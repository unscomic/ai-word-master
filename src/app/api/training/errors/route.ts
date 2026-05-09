import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/server"
import { prisma } from "@/lib/db/prisma"

/** 获取错词强化训练词列表 */
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    // 错词条件：累计错误 >= 3 且未掌握（level < 2）
    const errorWords = await prisma.wordProgress.findMany({
      where: {
        userId: user.id,
        mistakes: { gte: 3 },
        level: { lt: 2 },
      },
      include: {
        word: {
          select: {
            id: true,
            word: true,
            phonetic: true,
            aiContent: true,
          },
        },
      },
      orderBy: { mistakes: "desc" },
      take: 30,
    })

    // 为每个错词生成 3 个干扰选项
    const wordIds = errorWords.map((ew) => ew.word.id)
    const allWords = wordIds.length > 0
      ? await prisma.word.findMany({
          where: { id: { notIn: wordIds } },
          select: { word: true },
          take: 100,
        })
      : []

    const words = errorWords.map((ew) => {
      // 解析 AI 内容获取释义
      let meaning = "未获取释义"
      try {
        if (ew.word.aiContent) {
          const content = JSON.parse(ew.word.aiContent)
          meaning = content.meaning?.cn || meaning
        }
      } catch {}

      // 随机选 3 个干扰选项
      const distractors = allWords
        .filter((w) => w.word !== ew.word.word)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((w) => w.word)

      return {
        progressId: ew.id,
        wordId: ew.word.id,
        word: ew.word.word,
        phonetic: ew.word.phonetic,
        meaning,
        mistakes: ew.mistakes,
        level: ew.level,
      }
    })

    // 打乱顺序
    words.sort(() => Math.random() - 0.5)

    // 干扰选项（用于选择题）
    const randomDistractors = allWords
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.max(words.length * 3, 10))
      .map((w) => w.word)

    return NextResponse.json({
      words,
      distractors: randomDistractors,
      total: words.length,
    })
  } catch (error) {
    console.error("Training errors fetch error:", error)
    return NextResponse.json({ error: "获取错词失败" }, { status: 500 })
  }
}
