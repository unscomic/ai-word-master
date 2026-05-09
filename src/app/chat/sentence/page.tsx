"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Send, Sparkles, CheckCircle, AlertCircle, Lightbulb } from "lucide-react"

interface SentenceResult {
  isCorrect: boolean
  score: number
  corrections: Array<{ original: string; corrected: string; explanation: string }>
  improvedVersion: string
  feedback: string
}

export default function SentencePracticePage() {
  const [word, setWord] = useState("")
  const [sentence, setSentence] = useState("")
  const [result, setResult] = useState<SentenceResult | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!word.trim() || !sentence.trim()) {
      toast.error("请输入单词和句子")
      return
    }

    setLoading(true)
    setResult(null)

    const res = await fetch("/api/chat/sentence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word: word.trim(), sentence: sentence.trim() }),
    })

    const data = await res.json()
    setLoading(false)

    if (res.ok) {
      setResult(data)
    } else {
      toast.error(data.error || "评估失败")
    }
  }

  return (
    <div className="container max-w-lg mx-auto py-6 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          造句练习
        </h1>
        <p className="text-muted-foreground mt-1">
          选一个单词，用英文造句，AI 会帮你评估和润色
        </p>
      </div>

      {/* 输入区 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">写一个句子</CardTitle>
          <CardDescription>输入你想练习的单词，然后用它造句</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="单词（如：abandon）"
              value={word}
              onChange={(e) => setWord(e.target.value)}
            />
            <Input
              placeholder="用这个单词写下你的句子..."
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                "AI 评估中..."
              ) : (
                <>
                  <Send className="size-4 mr-2" />
                  提交评估
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <Card>
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      )}

      {/* 结果 */}
      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                {result.isCorrect ? (
                  <CheckCircle className="size-5 text-emerald-500" />
                ) : (
                  <AlertCircle className="size-5 text-amber-500" />
                )}
                评估结果
              </CardTitle>
              <Badge variant={result.score >= 7 ? "default" : "secondary"}>
                {result.score} / 10 分
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 反馈 */}
            <div>
              <p className="text-sm font-medium mb-1">反馈</p>
              <p className="text-muted-foreground">{result.feedback}</p>
            </div>

            {/* 纠正列表 */}
            {result.corrections.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-2">纠错建议</p>
                  <ul className="space-y-2">
                    {result.corrections.map((c, i) => (
                      <li key={i} className="bg-muted rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <span className="text-red-500 line-through text-sm">
                            {c.original}
                          </span>
                          <span className="text-emerald-600 text-sm font-medium">
                            {c.corrected}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {c.explanation}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* 优化版本 */}
            <Separator />
            <div>
              <p className="text-sm font-medium mb-1 flex items-center gap-1">
                <Lightbulb className="size-3 text-amber-500" />
                更地道的表达
              </p>
              <p className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 rounded-lg p-3">
                {result.improvedVersion}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
