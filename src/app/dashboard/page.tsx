import { getCurrentUser } from "@/lib/auth/server"
import { prisma } from "@/lib/db/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { BookOpen, Brain, Flame, TrendingUp, Target } from "lucide-react"

export default async function DashboardPage() {
  const sessionUser = await getCurrentUser()
  const userId = sessionUser?.id

  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, examType: true, dailyGoal: true },
      })
    : null

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

  // 并行查询所有统计数据
  const [
    todayStudied,
    dueCount,
    totalLearned,
    totalAvailable,
    streak,
  ] = await Promise.all([
    userId ? prisma.studyLog.count({
      where: {
        userId,
        createdAt: { gte: todayStart, lt: todayEnd },
      },
    }) : 0,
    userId ? prisma.wordProgress.count({
      where: {
        userId,
        nextReview: { lte: now },
      },
    }) : 0,
    userId ? prisma.wordProgress.count({
      where: { userId },
    }) : 0,
    prisma.word.count(),
    calculateStreak(userId || ""),
  ])

  const examLabel: Record<string, string> = {
    cet4: "四级", cet6: "六级", postgrad: "考研", ielts: "雅思", toefl: "托福",
  }

  const stats = [
    { title: "今日已学", value: todayStudied, icon: BookOpen, color: "text-blue-600", suffix: "词" },
    { title: "待复习", value: dueCount, icon: Brain, color: "text-amber-600", suffix: "词" },
    { title: "连续打卡", value: streak, icon: Flame, color: "text-orange-600", suffix: "天" },
    { title: "总学习进度", value: totalLearned, icon: TrendingUp, color: "text-emerald-600", suffix: "词" },
  ]

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* 问候 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            你好，{user?.name || "同学"}！
          </h1>
          <p className="text-muted-foreground">
            今日目标：{totalAvailable ? `已学 ${totalLearned} / ${totalAvailable} 词` : "选择词库开始学习"}
          </p>
        </div>
        {examLabel[user?.examType || ""] && (
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {examLabel[user?.examType || ""]}
          </Badge>
        )}
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <Card key={s.title}>
            <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.title}
              </CardTitle>
              <s.icon className={`size-4 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${s.color}`}>
                {s.value}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  {s.suffix}
                </span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 快捷操作 */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/wordbooks" className={buttonVariants({ size: "lg" })}>
          <Target className="size-4 mr-2" />
          选择词库
        </Link>
        <Link href="/learn" className={buttonVariants({ variant: "outline", size: "lg" })}>
          开始学习
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/review" className={buttonVariants({ variant: "outline", size: "lg" })}>
          开始复习
        </Link>
        <Link href="/settings" className={buttonVariants({ variant: "outline", size: "lg" })}>
          学习设置
        </Link>
      </div>
    </div>
  )
}

async function calculateStreak(userId: string): Promise<number> {
  if (!userId) return 0

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
  let checkDate = new Date(now)

  // 如果今天学了，从今天开始算；否则从昨天开始
  if (!dates.has(today)) {
    checkDate.setDate(checkDate.getDate() - 1)
  }

  while (dates.has(checkDate.toDateString())) {
    streak++
    checkDate.setDate(checkDate.getDate() - 1)
  }

  return streak
}
