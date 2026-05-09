import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/server"
import { prisma } from "@/lib/db/prisma"
import { getWordContent } from "@/lib/ai/generate"

// POST /api/learn — 获取今日学习单词列表并生成 AI 内容
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { wordbookId, count = 10 } = await request.json()

    // 获取用户进度 + AI 配置
    const userWithProgress = await prisma.user.findUnique({
      where: { id: user.id },
      select: { dailyGoal: true, examType: true, apiKey: true, aiProvider: true },
    })

    const targetCount = count || userWithProgress?.dailyGoal || 20

    // 获取词库中用户尚未学习的单词
    let wordsQuery: Array<{ id: string; word: string; phonetic: string | null; aiContent: string | null }>

    if (wordbookId) {
      // 从指定词库获取
      const bookWords = await prisma.wordbookWord.findMany({
        where: {
          wordbookId,
          word: {
            progress: {
              none: { userId: user.id },
            },
          },
        },
        include: { word: true },
        take: targetCount,
      })
      wordsQuery = bookWords.map((bw) => bw.word)
    } else {
      // 获取所有未学习的单词
      wordsQuery = await prisma.word.findMany({
        where: {
          progress: {
            none: { userId: user.id },
          },
        },
        take: targetCount,
      })
    }

    if (wordsQuery.length === 0) {
      return NextResponse.json({ words: [], message: "没有新单词了，去复习吧！" })
    }

    // 为每个单词准备内容（从缓存或 AI 生成）
    const words = await Promise.all(
      wordsQuery.map(async (w) => {
        const content = await getWordContent(
          w.id,
          w.word,
          userWithProgress?.examType,
          { apiKey: userWithProgress?.apiKey, provider: userWithProgress?.aiProvider },
        )
        return {
          id: w.id,
          word: w.word,
          phonetic: w.phonetic,
          content,
        }
      }),
    )

    return NextResponse.json({ words })
  } catch (error) {
    console.error("Learn start error:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}
