import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/server"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

    // 今日学习统计
    const todayStudied = await prisma.studyLog.count({
      where: {
        userId: user.id,
        createdAt: { gte: todayStart, lt: todayEnd },
      },
    })

    // 今日新增学习单词（首次学习）
    const todayNewWords = await prisma.wordProgress.count({
      where: {
        userId: user.id,
        lastReview: { gte: todayStart, lt: todayEnd },
        repetitions: 1, // 首次学习
      },
    })

    // 今日复习单词
    const todayReviewed = await prisma.studyLog.count({
      where: {
        userId: user.id,
        action: "review",
        createdAt: { gte: todayStart, lt: todayEnd },
      },
    })

    // 待复习单词
    const dueCount = await prisma.wordProgress.count({
      where: {
        userId: user.id,
        nextReview: { lte: now },
      },
    })

    // 总学习进度
    const totalLearned = await prisma.wordProgress.count({
      where: { userId: user.id },
    })

    const totalAvailable = await prisma.word.count()

    // 连续打卡天数
    const streak = await calculateStreak(user.id)

    // 全日学习日历（近30天）
    const last30Days = await getLast30DaysActivity(user.id)

    return NextResponse.json({
      todayStudied,
      todayNewWords,
      todayReviewed,
      dueCount,
      totalLearned,
      totalAvailable,
      streak,
      last30Days,
      dailyGoal: 20, // TODO: from user settings
    })
  } catch (error) {
    console.error("Dashboard error:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}

async function calculateStreak(userId: string): Promise<number> {
  const logs = await prisma.studyLog.findMany({
    where: { userId },
    select: { createdAt: true },
    orderBy: { createdAt: "desc" },
    distinct: ["createdAt"],
  })

  if (logs.length === 0) return 0

  const dates = new Set(
    logs.map((l) => {
      const d = new Date(l.createdAt)
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    }),
  )

  const now = new Date()
  let streak = 0

  for (let i = 0; i < 365; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    if (dates.has(key)) {
      streak++
    } else if (i === 0) {
      // 今天还没学，继续
      continue
    } else {
      break
    }
  }

  return streak
}

async function getLast30DaysActivity(userId: string) {
  const now = new Date()
  const result: { date: string; count: number }[] = []

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

    const count = await prisma.studyLog.count({
      where: {
        userId,
        createdAt: { gte: dayStart, lt: dayEnd },
      },
    })

    result.push({
      date: d.toISOString().slice(0, 10),
      count,
    })
  }

  return result
}
