"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants, Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { BookOpen, Brain, Flame, TrendingUp, Target, Trophy, Calendar } from "lucide-react"

interface DashboardData {
  todayStudied: number
  todayNewWords: number
  todayReviewed: number
  dueCount: number
  totalLearned: number
  totalAvailable: number
  masteredCount: number
  streak: number
  heatmapData: { date: string; count: number; level: number }[]
  weeklyTrend: { week: string; newWords: number; reviews: number; total: number }[]
  dailyGoal: number
}

const DAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"]

function getColor(level: number): string {
  switch (level) {
    case 0: return "bg-muted"
    case 1: return "bg-emerald-200 dark:bg-emerald-900"
    case 2: return "bg-emerald-300 dark:bg-emerald-700"
    case 3: return "bg-emerald-400 dark:bg-emerald-600"
    case 4: return "bg-emerald-500 dark:bg-emerald-500"
    default: return "bg-muted"
  }
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/dashboard")
        if (res.ok) setData(await res.json())
      } catch (e) {
        console.error("Dashboard load failed:", e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <p className="text-muted-foreground">加载失败，请刷新重试</p>
      </div>
    )
  }

  const progressPercent = data.totalAvailable > 0
    ? Math.round((data.totalLearned / data.totalAvailable) * 100)
    : 0

  const dailyProgress = data.dailyGoal > 0
    ? Math.min(100, Math.round((data.todayStudied / data.dailyGoal) * 100))
    : 0

  // 热力图数据按周分组
  const weeks: { date: string; count: number; level: number }[][] = []
  let currentWeek: { date: string; count: number; level: number }[] = []
  for (let i = 0; i < data.heatmapData.length; i++) {
    const d = new Date(data.heatmapData[i].date + "T00:00:00")
    const dayOfWeek = d.getDay()
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek)
      currentWeek = []
    }
    currentWeek.push(data.heatmapData[i])
  }
  if (currentWeek.length > 0) weeks.push(currentWeek)

  return (
    <div className="container max-w-2xl mx-auto py-6 px-4 space-y-6">
      {/* 问候 + 每日进度 */}
      <div>
        <h1 className="text-2xl font-bold">学习仪表盘</h1>
        <p className="text-muted-foreground mt-1">
          今日目标：{data.todayStudied} / {data.dailyGoal} 词
        </p>
        {/* 进度条 */}
        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${dailyProgress}%` }}
          />
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">今日已学</CardTitle>
            <BookOpen className="size-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {data.todayStudied}<span className="text-sm font-normal text-muted-foreground ml-1">词</span>
            </p>
            <p className="text-xs text-muted-foreground">新学 {data.todayNewWords} · 复习 {data.todayReviewed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">待复习</CardTitle>
            <Brain className="size-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {data.dueCount}<span className="text-sm font-normal text-muted-foreground ml-1">词</span>
            </p>
            {data.dueCount > 0 && (
              <Link href="/review" className="text-xs text-primary hover:underline">
                去复习
              </Link>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">连续打卡</CardTitle>
            <Flame className="size-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {data.streak}<span className="text-sm font-normal text-muted-foreground ml-1">天</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">已掌握</CardTitle>
            <Trophy className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {data.masteredCount}<span className="text-sm font-normal text-muted-foreground ml-1">词</span>
            </p>
            <p className="text-xs text-muted-foreground">共学习 {data.totalLearned} / {data.totalAvailable} 词</p>
          </CardContent>
        </Card>
      </div>

      {/* 热力图 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            学习热力图（近20周）
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-0.5 overflow-x-auto pb-2">
            {/* 周标签 */}
            <div className="flex flex-col gap-0.5 mr-1 shrink-0">
              {DAY_LABELS.map((label, i) => (
                <div key={i} className="text-[10px] text-muted-foreground h-[14px] w-4 flex items-center justify-end pr-0.5">
                  {i % 2 === 1 ? label : ""}
                </div>
              ))}
            </div>
            {/* 热力图网格 */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {Array.from({ length: 7 }).map((_, di) => {
                  const day = week[di]
                  if (!day) return <div key={di} className="w-[14px] h-[14px] rounded-sm" />
                  return (
                    <div
                      key={di}
                      className={`w-[14px] h-[14px] rounded-sm ${getColor(day.level)}`}
                      title={`${day.date}: ${day.count} 次`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
          {/* 图例 */}
          <div className="flex items-center gap-1 mt-2 justify-end">
            <span className="text-[10px] text-muted-foreground mr-1">少</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <div key={level} className={`w-[12px] h-[12px] rounded-sm ${getColor(level)}`} />
            ))}
            <span className="text-[10px] text-muted-foreground ml-1">多</span>
          </div>
        </CardContent>
      </Card>

      {/* 周趋势 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="size-4 text-muted-foreground" />
            近4周学习趋势
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.weeklyTrend.map((week, i) => {
              const maxTotal = Math.max(...data.weeklyTrend.map((w) => w.total), 1)
              const barWidth = Math.round((week.total / maxTotal) * 100)
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{week.week}</span>
                    <span className="font-medium">{week.total} 词</span>
                  </div>
                  <div className="h-5 bg-muted rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-blue-400 dark:bg-blue-600 transition-all flex items-center justify-center text-[10px] text-white min-w-[20px]"
                      style={{ width: `${Math.round((week.newWords / maxTotal) * 100)}%` }}
                    >
                      {week.newWords > 0 ? `新 ${week.newWords}` : ""}
                    </div>
                    <div
                      className="h-full bg-amber-400 dark:bg-amber-600 transition-all flex items-center justify-center text-[10px] text-white min-w-[20px]"
                      style={{ width: `${Math.round((week.reviews / maxTotal) * 100)}%` }}
                    >
                      {week.reviews > 0 ? `复 ${week.reviews}` : ""}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="size-2 bg-blue-400 rounded-full" /> 新学
            </span>
            <span className="flex items-center gap-1">
              <div className="size-2 bg-amber-400 rounded-full" /> 复习
            </span>
          </div>
        </CardContent>
      </Card>

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
        <Link href="/chat/scenario" className={buttonVariants({ variant: "outline", size: "lg" })}>
          情景对话
        </Link>
      </div>
    </div>
  )
}
