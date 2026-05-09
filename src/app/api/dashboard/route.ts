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

    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { dailyGoal: true, examType: true },
    })

    // 并行查询所有统计数据
    const [
      todayStudied,
      todayNewWords,
      todayReviewed,
      dueCount,
      totalLearned,
      totalAvailable,
      masteredCount,
    ] = await Promise.all([
      prisma.studyLog.count({
        where: {
          userId: user.id,
          createdAt: { gte: todayStart, lt: todayEnd },
        },
      }),
      prisma.wordProgress.count({
        where: {
          userId: user.id,
          lastReview: { gte: todayStart, lt: todayEnd },
          repetitions: 1,
        },
      }),
      prisma.studyLog.count({
        where: {
          userId: user.id,
          action: "review",
          createdAt: { gte: todayStart, lt: todayEnd },
        },
      }),
      prisma.wordProgress.count({
        where: {
          userId: user.id,
          nextReview: { lte: now },
        },
      }),
      prisma.wordProgress.count({
        where: { userId: user.id },
      }),
      prisma.word.count(),
      // 已掌握单词（level >= 2 且间隔 >= 21 天）
      prisma.wordProgress.count({
        where: {
          userId: user.id,
          level: { gte: 2 },
          interval: { gte: 21 },
        },
      }),
    ])

    const streak = await calculateStreak(user.id)

    // 近20周热力图数据（140天）
    const heatmapData = await getHeatmapData(user.id)

    // 近4周趋势
    const weeklyTrend = await getWeeklyTrend(user.id)

    // 每日目标
    const dailyGoal = userRecord?.dailyGoal || 20

    return NextResponse.json({
      todayStudied,
      todayNewWords,
      todayReviewed,
      dueCount,
      totalLearned,
      totalAvailable,
      masteredCount,
      streak,
      heatmapData,
      weeklyTrend,
      dailyGoal,
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
    take: 500,
  })

  if (logs.length === 0) return 0

  const dates = new Set(
    logs.map((l) => new Date(l.createdAt).toDateString()),
  )

  const now = new Date()
  const today = now.toDateString()

  let streak = 0
  const checkDate = new Date(now)

  if (!dates.has(today)) {
    checkDate.setDate(checkDate.getDate() - 1)
  }

  while (dates.has(checkDate.toDateString())) {
    streak++
    checkDate.setDate(checkDate.getDate() - 1)
  }

  return streak
}

async function getHeatmapData(userId: string) {
  const now = new Date()
  // 对齐到周日（一周开始）
  const dayOfWeek = now.getDay()
  const daysFromSunday = dayOfWeek // 0 = Sunday
  const totalDays = 140 + daysFromSunday

  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - totalDays + 1)
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())

  const logs = await prisma.studyLog.groupBy({
    by: ["createdAt"],
    where: {
      userId,
      createdAt: { gte: start },
    },
    _count: { id: true },
  })

  // 建立日期映射
  const countMap = new Map<string, number>()
  for (const log of logs) {
    const d = new Date(log.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    countMap.set(key, log._count.id)
  }

  // 生成 140 天数据
  const result: { date: string; count: number; level: number }[] = []
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    const count = countMap.get(key) || 0

    // 计算颜色等级 0-4
    let level = 0
    if (count > 0) level = 1
    if (count >= 5) level = 2
    if (count >= 15) level = 3
    if (count >= 30) level = 4

    result.push({ date: key, count, level })
  }

  return result
}

async function getWeeklyTrend(userId: string) {
  const now = new Date()
  const weeks: { week: string; newWords: number; reviews: number; total: number }[] = []

  for (let w = 3; w >= 0; w--) {
    const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - w * 7)
    const weekStart = new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate() - 6)

    const [total, reviews] = await Promise.all([
      prisma.studyLog.count({
        where: {
          userId,
          createdAt: {
            gte: new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()),
            lt: new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate() + 1),
          },
        },
      }),
      prisma.studyLog.count({
        where: {
          userId,
          action: "review",
          createdAt: {
            gte: new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()),
            lt: new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate() + 1),
          },
        },
      }),
    ])

    weeks.push({
      week: `${weekStart.getMonth() + 1}/${weekStart.getDate()} - ${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`,
      newWords: total - reviews,
      reviews,
      total,
    })
  }

  return weeks
}
