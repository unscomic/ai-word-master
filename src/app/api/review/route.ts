import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/server"
import { prisma } from "@/lib/db/prisma"
import { sm2 } from "@/lib/spaced-repetition/sm2"

// GET — 获取今日待复习单词列表
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const now = new Date()
    const dueList = await prisma.wordProgress.findMany({
      where: {
        userId: user.id,
        nextReview: { lte: now },
      },
      include: {
        word: {
          select: { id: true, word: true, phonetic: true, aiContent: true },
        },
      },
      orderBy: { nextReview: "asc" },
      take: 50,
    })

    const words = dueList.map((p) => ({
      progressId: p.id,
      wordId: p.word.id,
      word: p.word.word,
      phonetic: p.word.phonetic,
      content: tryParseJSON(p.word.aiContent),
      level: p.level,
      mistakes: p.mistakes,
    }))

    // 统计
    const totalLearned = await prisma.wordProgress.count({
      where: { userId: user.id },
    })
    const dueCount = await prisma.wordProgress.count({
      where: {
        userId: user.id,
        nextReview: { lte: now },
      },
    })

    return NextResponse.json({ words, totalLearned, dueCount })
  } catch (error) {
    console.error("Review list error:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}

// POST — 提交复习结果
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { wordId, quality } = await request.json()

    if (!wordId || ![0, 1, 2].includes(quality)) {
      return NextResponse.json({ error: "参数无效" }, { status: 400 })
    }

    const progress = await prisma.wordProgress.findUnique({
      where: {
        userId_wordId: { userId: user.id, wordId },
      },
    })

    if (!progress) {
      return NextResponse.json({ error: "未找到学习记录" }, { status: 404 })
    }

    const result = sm2(
      quality,
      progress.ease,
      progress.interval,
      progress.repetitions,
    )

    await prisma.wordProgress.update({
      where: { id: progress.id },
      data: {
        level: quality,
        ease: result.ease,
        interval: result.interval,
        repetitions: result.repetitions,
        nextReview: result.nextReview,
        lastReview: new Date(),
        mistakes: quality < 2 ? progress.mistakes + 1 : progress.mistakes,
      },
    })

    await prisma.studyLog.create({
      data: {
        userId: user.id,
        wordId,
        action: "review",
      },
    })

    return NextResponse.json({
      success: true,
      nextReview: result.nextReview,
      interval: result.interval,
    })
  } catch (error) {
    console.error("Review submit error:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}

function tryParseJSON(str: string | null) {
  if (!str) return null
  try { return JSON.parse(str) } catch { return null }
}
