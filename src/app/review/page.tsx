"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Volume2 } from "lucide-react"
import { toast } from "sonner"

interface ReviewWord {
  progressId: string
  wordId: string
  word: string
  phonetic: string | null
  content: { meaning?: { cn: string; en: string } } | null
  level: number
  mistakes: number
}

export default function ReviewPage() {
  const router = useRouter()
  const [words, setWords] = useState<ReviewWord[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [finished, setFinished] = useState(false)
  const [stats, setStats] = useState({ correct: 0, fuzzy: 0, forgot: 0 })

  useEffect(() => {
    fetchReviews()
  }, [])

  async function fetchReviews() {
    setLoading(true)
    const res = await fetch("/api/review")
    if (res.ok) {
      const data = await res.json()
      setWords(data.words || [])
    } else {
      toast.error("获取复习列表失败")
    }
    setLoading(false)
  }

  function speak(text: string) {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "en-US"
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
    }
  }

  async function handleQuality(quality: number) {
    if (submitting || !words[currentIndex]) return
    setSubmitting(true)

    const word = words[currentIndex]

    try {
      await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordId: word.wordId, quality }),
      })
    } catch {
      // 静默失败
    }

    setStats((prev) => ({
      correct: prev.correct + (quality === 2 ? 1 : 0),
      fuzzy: prev.fuzzy + (quality === 1 ? 1 : 0),
      forgot: prev.forgot + (quality === 0 ? 1 : 0),
    }))

    setSubmitting(false)
    setShowAnswer(false)

    if (currentIndex + 1 >= words.length) {
      setFinished(true)
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }

  const currentWord = words[currentIndex]
  const progress = words.length > 0 ? ((currentIndex + 1) / words.length) * 100 : 0
  const meaning = currentWord?.content?.meaning?.cn

  if (loading) {
    return (
      <div className="container max-w-lg mx-auto py-12 px-4 text-center">
        <p className="text-muted-foreground">加载复习列表...</p>
      </div>
    )
  }

  if (finished) {
    return (
      <div className="container max-w-lg mx-auto py-12 px-4 text-center space-y-6">
        <h2 className="text-2xl font-bold">复习完成！</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-emerald-50 dark:bg-emerald-950 rounded-lg p-4">
            <p className="text-2xl font-bold text-emerald-600">{stats.correct}</p>
            <p className="text-sm text-muted-foreground">记得</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-4">
            <p className="text-2xl font-bold text-amber-600">{stats.fuzzy}</p>
            <p className="text-sm text-muted-foreground">模糊</p>
          </div>
          <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4">
            <p className="text-2xl font-bold text-red-600">{stats.forgot}</p>
            <p className="text-sm text-muted-foreground">忘了</p>
          </div>
        </div>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => router.push("/learn")}>学习新词</Button>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            返回首页
          </Button>
        </div>
      </div>
    )
  }

  if (words.length === 0) {
    return (
      <div className="container max-w-lg mx-auto py-12 px-4 text-center space-y-4">
        <h2 className="text-2xl font-bold">今日无待复习单词</h2>
        <p className="text-muted-foreground">加油学习新单词吧！</p>
        <Button onClick={() => router.push("/learn")}>去学习</Button>
      </div>
    )
  }

  return (
    <div className="container max-w-lg mx-auto py-6 px-4 space-y-4">
      {/* 进度条 */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{currentIndex + 1} / {words.length}</span>
          <span>复习中</span>
        </div>
        <Progress value={progress} />
      </div>

      {/* 单词卡片 */}
      {currentWord && (
        <Card className="w-full">
          <CardContent className="p-6 space-y-4 text-center">
            <div className="flex items-center justify-center gap-3">
              <h2 className="text-3xl font-bold">{currentWord.word}</h2>
              <Button
                variant="outline"
                size="icon"
                className="size-10 rounded-full"
                onClick={() => speak(currentWord.word)}
              >
                <Volume2 className="size-4" />
              </Button>
            </div>

            {currentWord.phonetic && (
              <p className="text-lg text-muted-foreground font-mono">
                {currentWord.phonetic}
              </p>
            )}

            {currentWord.mistakes > 0 && (
              <Badge variant="destructive" className="mx-auto">
                错过 {currentWord.mistakes} 次
              </Badge>
            )}

            {!showAnswer ? (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setShowAnswer(true)}
              >
                查看释义
              </Button>
            ) : (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-xl font-medium">{meaning || "（暂无释义）"}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 操作按钮 */}
      {showAnswer && (
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            size="lg"
            className="h-14 border-red-200 hover:bg-red-50 hover:text-red-700"
            disabled={submitting}
            onClick={() => handleQuality(0)}
          >
            忘了
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-14 border-amber-200 hover:bg-amber-50 hover:text-amber-700"
            disabled={submitting}
            onClick={() => handleQuality(1)}
          >
            模糊
          </Button>
          <Button
            size="lg"
            className="h-14 bg-emerald-600 hover:bg-emerald-700"
            disabled={submitting}
            onClick={() => handleQuality(2)}
          >
            记得
          </Button>
        </div>
      )}
    </div>
  )
}
