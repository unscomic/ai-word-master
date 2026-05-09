"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

const EXAM_OPTIONS = [
  { value: "cet4", label: "四级" },
  { value: "cet6", label: "六级" },
  { value: "postgrad", label: "考研" },
  { value: "ielts", label: "雅思" },
  { value: "toefl", label: "托福" },
]

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [name, setName] = useState("")
  const [examType, setExamType] = useState<string | null>(null)
  const [dailyGoal, setDailyGoal] = useState(20)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadSettings() {
      const res = await fetch("/api/user/settings")
      if (res.ok) {
        const data = await res.json()
        setName(data.name || "")
        setExamType(data.examType)
        setDailyGoal(data.dailyGoal)
      }
      setLoading(false)
    }
    loadSettings()
  }, [])

  async function handleSave() {
    setSaving(true)
    const res = await fetch("/api/user/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, examType, dailyGoal }),
    })
    setSaving(false)

    if (res.ok) {
      toast.success("设置已保存")
      update()
    } else {
      const data = await res.json()
      toast.error(data.error || "保存失败")
    }
  }

  if (loading) {
    return (
      <div className="container max-w-xl mx-auto py-8 px-4">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    )
  }

  return (
    <div className="container max-w-xl mx-auto py-8 px-4 space-y-6">
      <h1 className="text-2xl font-bold">个人设置</h1>

      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
          <CardDescription>你的账户信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input id="email" value={session?.user?.email || ""} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">昵称</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="你的昵称"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>学习目标</CardTitle>
          <CardDescription>设定你的考试类型和每日目标</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>考试类型</Label>
            <div className="flex flex-wrap gap-2">
              {EXAM_OPTIONS.map((opt) => (
                <Badge
                  key={opt.value}
                  variant={examType === opt.value ? "default" : "outline"}
                  className="cursor-pointer hover:opacity-80"
                  onClick={() => setExamType(examType === opt.value ? null : opt.value)}
                >
                  {opt.label}
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dailyGoal">每日学习单词数</Label>
            <Input
              id="dailyGoal"
              type="number"
              min={5}
              max={200}
              value={dailyGoal}
              onChange={(e) => setDailyGoal(Number(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? "保存中..." : "保存设置"}
      </Button>

      <Separator />

      <Button
        variant="outline"
        className="w-full text-destructive"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        退出登录
      </Button>
    </div>
  )
}
