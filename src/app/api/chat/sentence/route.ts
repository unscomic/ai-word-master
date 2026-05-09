import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/server"
import { prisma } from "@/lib/db/prisma"
import { generateAIResponse, type AIProvider } from "@/lib/ai/client"
import { buildSentencePracticePrompt } from "@/lib/ai/prompts"
import { decrypt } from "@/lib/crypto"

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { word, sentence, wordId } = await request.json()

    if (!word || !sentence) {
      return NextResponse.json({ error: "请提供单词和句子" }, { status: 400 })
    }

    // 获取用户 AI 配置
    const userConfig = await prisma.user.findUnique({
      where: { id: user.id },
      select: { apiKey: true, aiProvider: true },
    })

    // 解密 API Key
    let apiKey: string | undefined
    if (userConfig?.apiKey) {
      try { apiKey = decrypt(userConfig.apiKey) } catch {}
    }

    // 获取单词释义
    let meaning = ""
    if (wordId) {
      const wordRecord = await prisma.word.findUnique({
        where: { id: wordId },
        select: { aiContent: true },
      })
      if (wordRecord?.aiContent) {
        try {
          const content = JSON.parse(wordRecord.aiContent)
          meaning = content.meaning?.cn || ""
        } catch {}
      }
    }

    const prompt = buildSentencePracticePrompt(word, sentence, meaning)
    const provider = (userConfig?.aiProvider || "claude") as AIProvider

    const response = await generateAIResponse(prompt, sentence, {
      provider,
      apiKey,
      maxTokens: 800,
    })

    const result = JSON.parse(
      response.match(/\{[\s\S]*\}/)?.[0] || response,
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error("Sentence practice error:", error)
    if (error instanceof Error && error.message.includes("API Key")) {
      return NextResponse.json({ error: "请先在设置中配置 AI API Key" }, { status: 400 })
    }
    return NextResponse.json({ error: "AI 评估失败，请重试" }, { status: 500 })
  }
}
