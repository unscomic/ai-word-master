"use client"

import { Suspense, useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { WordCard } from "@/components/learn/WordCard"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { WordContent } from "@/lib/ai/generate"

interface WordItem {
  id: string
  word: string
  phonetic: string | null
  content: WordContent | null
}

export default function LearnPage() {
  return (
    <Suspense fallback={<LearnLoader />}>
      <LearnContent />
    </Suspense>
  )
}

function LearnLoader() {
  return (
    <div className="container max-w-lg mx-auto py-8 px-4">
      <WordCard word="" loading />
    </div>
  )
}

function LearnContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const wordbookId = searchParams.get("wordbook")

  const [words, setWords] = useState<WordItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [finished, setFinished] = useState(false)
  const [stats, setStats] = useState({ known: 0, fuzzy: 0, unknown: 0 })

  // Swipe state
  const [swipeDelta, setSwipeDelta] = useState(0)
  const cardRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)

  // Refs to avoid stale closures in keyboard handler
  const qualityRef = useRef(handleQuality)
  qualityRef.current = handleQuality

  useEffect(() => {
    fetchWords()
  }, [])

  // Keyboard support with ref to avoid stale closures
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") qualityRef.current(2)
      if (e.key === "ArrowLeft") qualityRef.current(0)
      if (e.key === "ArrowUp" || e.key === " ") qualityRef.current(1)
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [])

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchMove(e: React.TouchEvent) {
    const delta = e.touches[0].clientX - touchStartX.current
    setSwipeDelta(delta)
  }

  function handleTouchEnd() {
    const threshold = 80
    if (swipeDelta > threshold) {
      handleQuality(2) // 右滑 = 认识
    } else if (swipeDelta < -threshold) {
      handleQuality(0) // 左滑 = 不认识
    }
    setSwipeDelta(0)
  }

  async function fetchWords() {
    setLoading(true)
    const res = await fetch("/api/learn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordbookId }),
    })
    if (res.ok) {
      const data = await res.json()
      setWords(data.words || [])
      if (data.message) toast.info(data.message)
    } else {
      toast.error("获取单词失败")
    }
    setLoading(false)
  }

  async function handleQuality(quality: number) {
    if (submitting || !words[currentIndex]) return
    setSubmitting(true)

    const word = words[currentIndex]

    try {
      await fetch("/api/learn/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordId: word.id, quality }),
      })
    } catch {
      // 静默失败，不影响用户体验
    }

    // 更新统计
    setStats((prev) => ({
      known: prev.known + (quality === 2 ? 1 : 0),
      fuzzy: prev.fuzzy + (quality === 1 ? 1 : 0),
      unknown: prev.unknown + (quality === 0 ? 1 : 0),
    }))

    setSubmitting(false)

    if (currentIndex + 1 >= words.length) {
      setFinished(true)
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }

  const currentWord = words[currentIndex]
  const progress = words.length > 0 ? ((currentIndex + 1) / words.length) * 100 : 0

  if (loading) {
    return (
      <div className="container max-w-lg mx-auto py-8 px-4">
        <WordCard word="" loading />
      </div>
    )
  }

  if (finished) {
    return (
      <div className="container max-w-lg mx-auto py-12 px-4 text-center space-y-6">
        <h2 className="text-2xl font-bold">今日学习完成！</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-emerald-50 dark:bg-emerald-950 rounded-lg p-4">
            <p className="text-2xl font-bold text-emerald-600">{stats.known}</p>
            <p className="text-sm text-muted-foreground">认识</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-4">
            <p className="text-2xl font-bold text-amber-600">{stats.fuzzy}</p>
            <p className="text-sm text-muted-foreground">模糊</p>
          </div>
          <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4">
            <p className="text-2xl font-bold text-red-600">{stats.unknown}</p>
            <p className="text-sm text-muted-foreground">不认识</p>
          </div>
        </div>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => router.push("/review")}>
            开始复习
          </Button>
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
        <h2 className="text-2xl font-bold">没有新单词了</h2>
        <p className="text-muted-foreground">你已经学完了词库中的所有单词！</p>
        <Button onClick={() => router.push("/review")}>去复习</Button>
      </div>
    )
  }

  return (
    <div className="container max-w-lg mx-auto py-6 px-4 space-y-4">
      {/* 进度条 */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            {currentIndex + 1} / {words.length}
          </span>
          <span>
            认识 {stats.known} | 模糊 {stats.fuzzy} | 不认识 {stats.unknown}
          </span>
        </div>
        <Progress value={progress} />
      </div>

      {/* 单词卡片 + 滑动 */}
      {currentWord && (
        <div
          ref={cardRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative select-none"
        >
          {/* 滑动指示器 */}
          {Math.abs(swipeDelta) > 20 && (
            <div className="absolute inset-0 z-10 flex items-center justify-between pointer-events-none px-4">
              <div
                className={`rounded-full p-2 transition-opacity ${swipeDelta < 0 ? "opacity-100 bg-red-100 text-red-600" : "opacity-0"}`}
              >
                <ChevronLeft className="size-8" />
              </div>
              <div
                className={`rounded-full p-2 transition-opacity ${swipeDelta > 0 ? "opacity-100 bg-emerald-100 text-emerald-600" : "opacity-0"}`}
              >
                <ChevronRight className="size-8" />
              </div>
            </div>
          )}
          <div
            style={{
              transform: `translateX(${swipeDelta}px)`,
              transition: swipeDelta === 0 ? "transform 0.2s ease" : "none",
            }}
          >
            <WordCard
              word={currentWord.word}
              phonetic={currentWord.phonetic}
              content={currentWord.content}
            />
          </div>
        </div>
      )}

      {/* 滑动提示 */}
      <div className="flex justify-between text-xs text-muted-foreground px-2">
        <span>← 左滑：不认识</span>
        <span className="hidden sm:inline">键盘 ← ↑ →</span>
        <span>右滑：认识 →</span>
      </div>

      {/* 操作按钮 */}
      <div className="grid grid-cols-3 gap-3">
        <Button
          variant="outline"
          size="lg"
          className="h-14 border-red-200 hover:bg-red-50 hover:text-red-700"
          disabled={submitting}
          onClick={() => handleQuality(0)}
        >
          不认识
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
          认识
        </Button>
      </div>
    </div>
  )
}
