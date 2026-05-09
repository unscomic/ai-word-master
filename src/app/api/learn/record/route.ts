import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/server"
import { prisma } from "@/lib/db/prisma"
import { sm2 } from "@/lib/spaced-repetition/sm2"

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { wordId, quality } = await request.json()
    // quality: 0=不认识, 1=模糊, 2=认识

    if (!wordId || ![0, 1, 2].includes(quality)) {
      return NextResponse.json({ error: "参数无效" }, { status: 400 })
    }

    // 查找或创建学习进度
    let progress = await prisma.wordProgress.findUnique({
      where: {
        userId_wordId: { userId: user.id, wordId },
      },
    })

    if (!progress) {
      // 首次学习：创建进度
      const sm2Result = sm2(quality)
      progress = await prisma.wordProgress.create({
        data: {
          userId: user.id,
          wordId,
          level: quality,
          ease: sm2Result.ease,
          interval: sm2Result.interval,
          repetitions: sm2Result.repetitions,
          nextReview: sm2Result.nextReview,
          lastReview: new Date(),
          mistakes: quality < 2 ? 1 : 0,
        },
      })
    } else {
      // 复习更新
      const sm2Result = sm2(
        quality,
        progress.ease,
        progress.interval,
        progress.repetitions,
      )
      await prisma.wordProgress.update({
        where: { id: progress.id },
        data: {
          level: quality,
          ease: sm2Result.ease,
          interval: sm2Result.interval,
          repetitions: sm2Result.repetitions,
          nextReview: sm2Result.nextReview,
          lastReview: new Date(),
          mistakes: quality < 2 ? progress.mistakes + 1 : progress.mistakes,
        },
      })
    }

    // 记录学习日志
    await prisma.studyLog.create({
      data: {
        userId: user.id,
        wordId,
        action: quality === 2 ? "correct" : quality === 1 ? "learn" : "wrong",
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Learn record error:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}
