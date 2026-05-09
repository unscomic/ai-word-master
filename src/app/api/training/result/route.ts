import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/server"
import { prisma } from "@/lib/db/prisma"

/** 提交强化训练结果 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { results } = await request.json()
    // results: { progressId: string, wordId: string, correct: boolean }[]

    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json({ error: "无效数据" }, { status: 400 })
    }

    const updates = []
    const now = new Date()

    for (const r of results) {
      const progress = await prisma.wordProgress.findFirst({
        where: { id: r.progressId, userId: user.id },
      })

      if (!progress) continue

      if (r.correct) {
        // 正确：减少 mistakes 计数，提升 level
        updates.push(
          prisma.wordProgress.update({
            where: { id: r.progressId },
            data: {
              mistakes: Math.max(0, progress.mistakes - 1),
              level: Math.min(2, progress.level + 1),
              ease: Math.min(3.0, progress.ease + 0.1),
              lastReview: now,
              nextReview: new Date(now.getTime() + 24 * 60 * 60 * 1000),
            },
          }),
        )

        // 记录学习日志
        updates.push(
          prisma.studyLog.create({
            data: {
              userId: user.id,
              wordId: r.wordId,
              action: "correct",
            },
          }),
        )
      } else {
        // 错误：增加 mistakes
        updates.push(
          prisma.wordProgress.update({
            where: { id: r.progressId },
            data: {
              mistakes: progress.mistakes + 1,
              level: Math.max(0, progress.level - 1),
              ease: Math.max(1.3, progress.ease - 0.2),
              lastReview: now,
            },
          }),
        )

        updates.push(
          prisma.studyLog.create({
            data: {
              userId: user.id,
              wordId: r.wordId,
              action: "wrong",
            },
          }),
        )
      }
    }

    // 并行执行所有更新
    await Promise.all(updates)

    // 统计结果
    const correct = results.filter((r) => r.correct).length
    const total = results.length

    return NextResponse.json({
      correct,
      total,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
    })
  } catch (error) {
    console.error("Training result error:", error)
    return NextResponse.json({ error: "提交失败" }, { status: 500 })
  }
}
