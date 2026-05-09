import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/server"
import { prisma } from "@/lib/db/prisma"
import { streamAIResponse, type StreamOptions } from "@/lib/ai/stream"
import { buildFreeChatPrompt } from "@/lib/ai/prompts"
import { decrypt } from "@/lib/crypto"
import type { AIProvider } from "@/lib/ai/client"

/** 流式 AI 自由对话 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { message, sessionId } = await request.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: "请输入消息" }, { status: 400 })
    }

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

    // 加载或创建会话
    let history: Array<{ role: string; content: string }> = []
    let chatSession: { id: string; userId: string; messages: string } | null = null

    if (sessionId) {
      chatSession = await prisma.chatSession.findUnique({
        where: { id: sessionId },
      })
      if (chatSession && chatSession.userId === user.id) {
        try { history = JSON.parse(chatSession.messages) } catch {}
      }
    }

    // 添加用户消息
    history.push({ role: "user", content: message.trim() })

    // 流式生成回复
    const systemPrompt = buildFreeChatPrompt()
    const stream = streamAIResponse(systemPrompt, history, {
      provider,
      apiKey,
      maxTokens: 800,
    })

    // 在流中收集完整响应
    let fullResponse = ""
    const encoder = new TextEncoder()
    const reader = stream.getReader()

    const responseStream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            // 解析 SSE 数据，收集文本用于保存
            const text = new TextDecoder().decode(value)
            controller.enqueue(value) // 转发原始 chunk

            // 从 SSE 数据中提取文本
            const lines = text.split("\n")
            for (const line of lines) {
              if (line.startsWith("data: ") && line !== "data: [DONE]") {
                try {
                  const parsed = JSON.parse(line.slice(6))
                  if (parsed.text) fullResponse += parsed.text
                } catch {}
              }
            }
          }

          // 保存会话
          history.push({ role: "assistant", content: fullResponse })

          if (chatSession) {
            await prisma.chatSession.update({
              where: { id: chatSession.id },
              data: { messages: JSON.stringify(history), updatedAt: new Date() },
            })
          } else {
            chatSession = await prisma.chatSession.create({
              data: {
                userId: user.id,
                type: "free",
                messages: JSON.stringify(history),
              },
            })
          }

          // 发送会话 ID
          const idData = JSON.stringify({ sessionId: chatSession.id })
          controller.enqueue(encoder.encode(`data: ${idData}\n\n`))
          controller.close()
        } catch (error) {
          console.error("Stream processing error:", error)
          controller.error(error)
        }
      },
    })

    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Free chat error:", error)
    if (error instanceof Error && error.message.includes("API Key")) {
      return NextResponse.json({ error: "请先在设置中配置 AI API Key" }, { status: 400 })
    }
    return NextResponse.json({ error: "AI 对话失败，请重试" }, { status: 500 })
  }
}

/** 获取历史对话列表 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    if (sessionId) {
      const session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
      })
      if (!session || session.userId !== user.id) {
        return NextResponse.json({ error: "会话不存在" }, { status: 404 })
      }
      let messages = []
      try { messages = JSON.parse(session.messages) } catch {}
      return NextResponse.json({ id: session.id, messages })
    }

    const sessions = await prisma.chatSession.findMany({
      where: { userId: user.id, type: "free" },
      orderBy: { updatedAt: "desc" },
      select: { id: true, messages: true, createdAt: true, updatedAt: true },
      take: 20,
    })

    return NextResponse.json({
      sessions: sessions.map((s) => {
        let msgs: Array<{ role: string; content: string }> = []
        try { msgs = JSON.parse(s.messages) } catch {}
        const firstUser = msgs.find((m) => m.role === "user")
        const preview = firstUser?.content?.slice(0, 40) || "新对话"
        return {
          id: s.id,
          preview,
          messageCount: msgs.length,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        }
      }),
    })
  } catch (error) {
    console.error("Get free chat sessions error:", error)
    return NextResponse.json({ error: "获取会话失败" }, { status: 500 })
  }
}
