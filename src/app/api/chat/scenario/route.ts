import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/server"
import { prisma } from "@/lib/db/prisma"
import { generateAIResponse, type AIProvider } from "@/lib/ai/client"
import {
  SCENARIOS,
  buildScenarioSystemPrompt,
  buildScenarioEndPrompt,
  type ScenarioConfig,
} from "@/lib/ai/prompts"
import { decrypt } from "@/lib/crypto"

interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { scenario, message, sessionId } = await request.json()

    // 获取用户 AI 配置
    const userConfig = await prisma.user.findUnique({
      where: { id: user.id },
      select: { apiKey: true, aiProvider: true },
    })

    let apiKey: string | undefined
    if (userConfig?.apiKey) {
      try { apiKey = decrypt(userConfig.apiKey) } catch {}
    }
    const provider = (userConfig?.aiProvider || "claude") as AIProvider

    // 查找场景配置
    const scenarioConfig = SCENARIOS.find((s) => s.key === scenario)
    if (!scenarioConfig) {
      return NextResponse.json({ error: "无效的场景" }, { status: 400 })
    }

    let chatSession
    let history: ChatMessage[] = []

    if (sessionId) {
      // 继续已有会话
      chatSession = await prisma.chatSession.findUnique({
        where: { id: sessionId },
      })
      if (!chatSession || chatSession.userId !== user.id) {
        return NextResponse.json({ error: "会话不存在" }, { status: 404 })
      }
      try {
        history = JSON.parse(chatSession.messages)
      } catch {}
    }

    const isEnding = message === "__END_SESSION__"

    if (isEnding) {
      // 结束会话，生成总结
      const endPrompt = buildScenarioEndPrompt(history)
      const response = await generateAIResponse(
        "You are an English tutor evaluating a student's scenario practice performance.",
        endPrompt,
        { provider, apiKey, maxTokens: 600 },
      )
      const result = JSON.parse(
        response.match(/\{[\s\S]*\}/)?.[0] || response,
      )

      // 标记会话完成
      history.push({ role: "system", content: "Session ended" })
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { messages: JSON.stringify(history), updatedAt: new Date() },
      })

      return NextResponse.json({ ...result, done: true })
    }

    if (!sessionId) {
      // 新会话：AI 先开场
      const systemPrompt = buildScenarioSystemPrompt(scenarioConfig)
      const openingResponse = await getAIResponse(
        systemPrompt,
        "Start the conversation with your opening line as the " + scenarioConfig.role + ".",
        provider,
        apiKey,
      )

      // 创建会话
      const openingMessages: ChatMessage[] = [
        { role: "system", content: `Scenario: ${scenarioConfig.title}` },
        { role: "assistant", content: openingResponse.reply },
      ]

      chatSession = await prisma.chatSession.create({
        data: {
          userId: user.id,
          type: "scenario",
          messages: JSON.stringify(openingMessages),
        },
      })

      return NextResponse.json({
        sessionId: chatSession.id,
        reply: openingResponse.reply,
        correction: openingResponse.correction,
        tip: openingResponse.tip,
      })
    }

    // 继续对话：用户发送了新消息
    if (!message) {
      return NextResponse.json({ error: "请输入消息" }, { status: 400 })
    }

    history.push({ role: "user", content: message })

    const systemPrompt = buildScenarioSystemPrompt(scenarioConfig)
    const conversationContext = history
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n")

    const aiResponse = await getAIResponse(
      systemPrompt,
      `Conversation so far:\n${conversationContext}\n\nRespond as the ${scenarioConfig.role}.`,
      provider,
      apiKey,
    )

    history.push({ role: "assistant", content: aiResponse.reply })

    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { messages: JSON.stringify(history), updatedAt: new Date() },
    })

    return NextResponse.json({
      sessionId,
      reply: aiResponse.reply,
      correction: aiResponse.correction,
      tip: aiResponse.tip,
    })
  } catch (error) {
    console.error("Scenario chat error:", error)
    if (error instanceof Error && error.message.includes("API Key")) {
      return NextResponse.json({ error: "请先在设置中配置 AI API Key" }, { status: 400 })
    }
    return NextResponse.json({ error: "AI 对话失败，请重试" }, { status: 500 })
  }
}

/** 获取 AI 角色扮演回复 */
async function getAIResponse(
  systemPrompt: string,
  userMessage: string,
  provider: AIProvider,
  apiKey?: string,
) {
  const response = await generateAIResponse(systemPrompt, userMessage, {
    provider,
    apiKey,
    maxTokens: 400,
  })

  try {
    const json = JSON.parse(response.match(/\{[\s\S]*\}/)?.[0] || response)
    return {
      reply: json.reply || response,
      correction: json.correction || null,
      tip: json.tip || null,
    }
  } catch {
    return { reply: response, correction: null, tip: null }
  }
}

/** 获取会话历史 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      // 列出用户的所有情景对话会话
      const sessions = await prisma.chatSession.findMany({
        where: { userId: user.id, type: "scenario" },
        orderBy: { updatedAt: "desc" },
        select: { id: true, createdAt: true, updatedAt: true, messages: true },
        take: 20,
      })

      return NextResponse.json({
        sessions: sessions.map((s) => {
          let messages: ChatMessage[] = []
          try { messages = JSON.parse(s.messages) } catch {}
          const scenarioMsg = messages.find((m) => m.role === "system")
          const title = scenarioMsg?.content?.replace("Scenario: ", "") || "情景对话"
          return {
            id: s.id,
            title,
            messageCount: messages.length,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
          }
        }),
      })
    }

    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    })

    if (!session || session.userId !== user.id) {
      return NextResponse.json({ error: "会话不存在" }, { status: 404 })
    }

    let messages: ChatMessage[] = []
    try { messages = JSON.parse(session.messages) } catch {}

    return NextResponse.json({ id: session.id, messages })
  } catch (error) {
    console.error("Get scenario sessions error:", error)
    return NextResponse.json({ error: "获取会话失败" }, { status: 500 })
  }
}
