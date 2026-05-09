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
import { Key, Eye, EyeOff, Sparkles } from "lucide-react"

const EXAM_OPTIONS = [
  { value: "cet4", label: "四级" },
  { value: "cet6", label: "六级" },
  { value: "postgrad", label: "考研" },
  { value: "ielts", label: "雅思" },
  { value: "toefl", label: "托福" },
]

const AI_PROVIDERS = [
  { value: "claude", label: "Claude", desc: "Anthropic Claude 模型" },
  { value: "deepseek", label: "DeepSeek", desc: "DeepSeek Chat 模型" },
]

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [name, setName] = useState("")
  const [examType, setExamType] = useState<string | null>(null)
  const [dailyGoal, setDailyGoal] = useState(20)
  const [apiKey, setApiKey] = useState("")
  const [aiProvider, setAiProvider] = useState("claude")
  const [hasApiKey, setHasApiKey] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadSettings() {
      const [userRes, aiRes] = await Promise.all([
        fetch("/api/user/settings"),
        fetch("/api/user/ai-settings"),
      ])

      if (userRes.ok) {
        const data = await userRes.json()
        setName(data.name || "")
        setExamType(data.examType)
        setDailyGoal(data.dailyGoal)
      }
      if (aiRes.ok) {
        const data = await aiRes.json()
        setHasApiKey(data.hasApiKey)
        setAiProvider(data.aiProvider || "claude")
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
      toast.success("常规设置已保存")
      update()
    } else {
      const data = await res.json()
      toast.error(data.error || "保存失败")
    }
  }

  async function handleSaveAI() {
    setSaving(true)
    const res = await fetch("/api/user/ai-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: apiKey || undefined,
        aiProvider,
      }),
    })

    const data = await res.json()
    setSaving(false)

    if (res.ok) {
      if (apiKey) {
        setHasApiKey(true)
        setApiKey("")
      }
      toast.success("AI 设置已保存")
    } else {
      toast.error(data.error || "保存失败")
    }
  }

  async function handleClearKey() {
    const res = await fetch("/api/user/ai-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: "" }),
    })
    if (res.ok) {
      setHasApiKey(false)
      toast.success("API Key 已清除")
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-5" />
            AI 模型配置
          </CardTitle>
          <CardDescription>
            设置你的 AI API Key，选择模型提供商。Key 将加密存储，仅用于生成学习内容。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 模型选择 */}
          <div className="space-y-2">
            <Label>AI 模型</Label>
            <div className="flex flex-wrap gap-2">
              {AI_PROVIDERS.map((p) => (
                <Badge
                  key={p.value}
                  variant={aiProvider === p.value ? "default" : "outline"}
                  className="cursor-pointer hover:opacity-80"
                  onClick={() => setAiProvider(p.value)}
                >
                  {p.label}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {
                AI_PROVIDERS.find((p) => p.value === aiProvider)?.desc
              }
              {aiProvider === "deepseek" && " — 性价比高，中文能力强"}
              {aiProvider === "claude" && " — 文本质量高，结构化输出稳定"}
            </p>
          </div>

          {/* API Key 输入 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Key className="size-3" />
              {hasApiKey ? "更换 API Key" : "API Key"}
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={
                    aiProvider === "deepseek"
                      ? "sk-..."
                      : "sk-ant-..."
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
              <Button
                onClick={handleSaveAI}
                disabled={saving || (!apiKey && !hasApiKey)}
              >
                {saving ? "保存中..." : "保存"}
              </Button>
            </div>
            {hasApiKey && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  已配置 API Key（加密存储）
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-destructive h-auto py-1"
                  onClick={handleClearKey}
                >
                  清除
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {aiProvider === "deepseek"
                ? "前往 platform.deepseek.com 获取 API Key"
                : "前往 console.anthropic.com 获取 API Key"}
              ，Key 将使用 AES-256-GCM 加密后存储
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? "保存中..." : "保存常规设置"}
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
