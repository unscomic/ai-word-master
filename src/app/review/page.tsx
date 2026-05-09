"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Volume2, Check, X, ArrowRight, BookOpen, Pencil, Grid3X3 } from "lucide-react"
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

type ReviewMode = "standard" | "choice" | "spelling"

export default function ReviewPage() {
  const router = useRouter()
  const [words, setWords] = useState<ReviewWord[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [finished, setFinished] = useState(false)
  const [stats, setStats] = useState({ correct: 0, fuzzy: 0, forgot: 0 })
  const [mode, setMode] = useState<ReviewMode>("standard")

  // Choice mode state
  const [options, setOptions] = useState<string[]>([])
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [choiceResult, setChoiceResult] = useState<boolean | null>(null)

  // Spelling mode state
  const [spellingInput, setSpellingInput] = useState("")
  const [spellingResult, setSpellingResult] = useState<boolean | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchReviews() }, [])

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

  // 为选择题生成选项（从所有待复习单词的释义中抽取）
  function generateOptions(word: ReviewWord) {
    const correct = word.content?.meaning?.cn || ""
    const distractors = words
      .filter((w) => w.wordId !== word.wordId)
      .map((w) => w.content?.meaning?.cn || "")
      .filter((m) => m && m !== correct)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)

    // 确保有足够选项
    while (distractors.length < 3) {
      distractors.push(`选项 ${distractors.length + 1}`)
    }

    const all = [correct, ...distractors].sort(() => Math.random() - 0.5)
    setOptions(all)
    setSelectedOption(null)
    setChoiceResult(null)
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

  function handleModeChange(newMode: string) {
    setMode(newMode as ReviewMode)
    setShowAnswer(false)
    setSelectedOption(null)
    setChoiceResult(null)
    setSpellingInput("")
    setSpellingResult(null)
    if (newMode === "choice") {
      setTimeout(() => generateOptions(words[currentIndex]), 0)
    } else if (newMode === "spelling") {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  function advanceToNext() {
    if (currentIndex + 1 >= words.length) {
      setFinished(true)
    } else {
      const next = currentIndex + 1
      setCurrentIndex(next)
      setShowAnswer(false)
      setSelectedOption(null)
      setChoiceResult(null)
      setSpellingInput("")
      setSpellingResult(null)
      if (mode === "choice" && words[next]) {
        setTimeout(() => generateOptions(words[next]), 0)
      } else if (mode === "spelling") {
        setTimeout(() => inputRef.current?.focus(), 100)
      }
    }
  }

  async function submitStandard(quality: number) {
    if (submitting || !words[currentIndex]) return
    setSubmitting(true)
    const word = words[currentIndex]
    try {
      await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordId: word.wordId, quality }),
      })
    } catch {}
    setStats((prev) => ({
      correct: prev.correct + (quality === 2 ? 1 : 0),
      fuzzy: prev.fuzzy + (quality === 1 ? 1 : 0),
      forgot: prev.forgot + (quality === 0 ? 1 : 0),
    }))
    setSubmitting(false)
    advanceToNext()
  }

  // 选择题：确认选择
  function confirmChoice() {
    if (!selectedOption) return
    const current = words[currentIndex]
    const correct = current.content?.meaning?.cn || ""
    const isCorrect = selectedOption === correct
    setChoiceResult(isCorrect)

    // 自动提交 SM-2 结果
    const quality = isCorrect ? 2 : 0
    fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordId: current.wordId, quality }),
    }).catch(() => {})

    setStats((prev) => ({
      ...prev,
      correct: prev.correct + (isCorrect ? 1 : 0),
      forgot: prev.forgot + (isCorrect ? 0 : 1),
    }))
  }

  // 拼写题：确认拼写
  function confirmSpelling() {
    if (!spellingInput.trim()) return
    const current = words[currentIndex]
    const isCorrect = spellingInput.trim().toLowerCase() === current.word.toLowerCase()
    setSpellingResult(isCorrect)

    const quality = isCorrect ? 2 : 0
    fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordId: current.wordId, quality }),
    }).catch(() => {})

    setStats((prev) => ({
      ...prev,
      correct: prev.correct + (isCorrect ? 1 : 0),
      forgot: prev.forgot + (isCorrect ? 0 : 1),
    }))
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
    const total = stats.correct + stats.fuzzy + stats.forgot
    const accuracy = total > 0 ? Math.round((stats.correct / total) * 100) : 0
    return (
      <div className="container max-w-lg mx-auto py-12 px-4 text-center space-y-6">
        <h2 className="text-2xl font-bold">复习完成！</h2>
        <div className="text-3xl font-bold text-primary">{accuracy}%</div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-emerald-50 dark:bg-emerald-950 rounded-lg p-4">
            <p className="text-2xl font-bold text-emerald-600">{stats.correct}</p>
            <p className="text-sm text-muted-foreground">正确</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-4">
            <p className="text-2xl font-bold text-amber-600">{stats.fuzzy}</p>
            <p className="text-sm text-muted-foreground">模糊</p>
          </div>
          <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4">
            <p className="text-2xl font-bold text-red-600">{stats.forgot}</p>
            <p className="text-sm text-muted-foreground">错误</p>
          </div>
        </div>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => router.push("/learn")}>学习新词</Button>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>返回首页</Button>
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
    <div className="container max-w-lg mx-auto py-4 px-4 space-y-4">
      {/* 进度条 */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{currentIndex + 1} / {words.length}</span>
          <span>复习中</span>
        </div>
        <Progress value={progress} />
      </div>

      {/* 模式选择 */}
      <Tabs value={mode} onValueChange={handleModeChange}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="standard" className="text-xs">
            <BookOpen className="size-3 mr-1" />
            标准
          </TabsTrigger>
          <TabsTrigger value="choice" className="text-xs" onClick={() => generateOptions(currentWord)}>
            <Grid3X3 className="size-3 mr-1" />
            选择
          </TabsTrigger>
          <TabsTrigger value="spelling" className="text-xs">
            <Pencil className="size-3 mr-1" />
            拼写
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 单词卡片 */}
      {currentWord && mode === "standard" && (
        <Card>
          <CardContent className="p-6 space-y-4 text-center">
            <div className="flex items-center justify-center gap-3">
              <h2 className="text-3xl font-bold">{currentWord.word}</h2>
              <Button variant="outline" size="icon" className="size-10 rounded-full" onClick={() => speak(currentWord.word)}>
                <Volume2 className="size-4" />
              </Button>
            </div>
            {currentWord.phonetic && (
              <p className="text-lg text-muted-foreground font-mono">{currentWord.phonetic}</p>
            )}
            {currentWord.mistakes > 0 && (
              <Badge variant="destructive" className="mx-auto">错过 {currentWord.mistakes} 次</Badge>
            )}
            {!showAnswer ? (
              <Button variant="outline" className="w-full mt-4" onClick={() => setShowAnswer(true)}>
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

      {/* 选择题模式 */}
      {currentWord && mode === "choice" && (
        <Card>
          <CardContent className="p-6 space-y-4 text-center">
            <div className="flex items-center justify-center gap-3">
              <h2 className="text-3xl font-bold">{currentWord.word}</h2>
              <Button variant="outline" size="icon" className="size-10 rounded-full" onClick={() => speak(currentWord.word)}>
                <Volume2 className="size-4" />
              </Button>
            </div>
            {currentWord.phonetic && (
              <p className="text-lg text-muted-foreground font-mono">{currentWord.phonetic}</p>
            )}
            <p className="text-sm text-muted-foreground">选择正确的中文释义</p>

            {!choiceResult ? (
              <div className="grid gap-2">
                {options.map((opt, i) => (
                  <Button
                    key={i}
                    variant={selectedOption === opt ? "default" : "outline"}
                    className="justify-start h-auto py-3 px-4 text-sm"
                    onClick={() => setSelectedOption(opt)}
                  >
                    {opt}
                  </Button>
                ))}
                <Button className="mt-2" disabled={!selectedOption} onClick={confirmChoice}>
                  确认选择
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className={`p-4 rounded-lg ${choiceResult ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {choiceResult ? (
                      <Check className="size-5 text-emerald-600" />
                    ) : (
                      <X className="size-5 text-red-600" />
                    )}
                    <span className={`font-bold ${choiceResult ? "text-emerald-600" : "text-red-600"}`}>
                      {choiceResult ? "正确！" : "错误！"}
                    </span>
                  </div>
                  <p className="font-medium">{currentWord.word}</p>
                  <p className="text-sm text-muted-foreground">{meaning}</p>
                  {!choiceResult && (
                    <p className="text-xs text-red-500 mt-1">你选择了：{selectedOption}</p>
                  )}
                </div>
                <Button onClick={advanceToNext}>
                  下一题 <ArrowRight className="size-3.5 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 拼写题模式 */}
      {currentWord && mode === "spelling" && (
        <Card>
          <CardContent className="p-6 space-y-4 text-center">
            <p className="text-sm text-muted-foreground">根据释义拼写单词</p>
            <p className="text-xl font-medium">{meaning || "（暂无释义）"}</p>

            <Button variant="outline" size="sm" onClick={() => speak(currentWord.word)}>
              <Volume2 className="size-4 mr-1" /> 听发音
            </Button>

            <p className="text-xs text-muted-foreground">
              提示：首字母 "{currentWord.word[0].toUpperCase()}"，共 {currentWord.word.length} 个字母
            </p>

            {spellingResult === null ? (
              <div className="space-y-3">
                <Input
                  ref={inputRef}
                  placeholder="输入英文单词..."
                  value={spellingInput}
                  onChange={(e) => setSpellingInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && spellingInput.trim()) confirmSpelling()
                  }}
                  autoFocus
                  className="text-center text-lg"
                />
                <Button className="w-full" disabled={!spellingInput.trim()} onClick={confirmSpelling}>
                  确认拼写
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className={`p-4 rounded-lg ${spellingResult ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {spellingResult ? (
                      <Check className="size-5 text-emerald-600" />
                    ) : (
                      <X className="size-5 text-red-600" />
                    )}
                    <span className={`font-bold ${spellingResult ? "text-emerald-600" : "text-red-600"}`}>
                      {spellingResult ? "正确！" : "错误！"}
                    </span>
                  </div>
                  <p className="font-medium">{currentWord.word}</p>
                  <p className="text-sm text-muted-foreground">{meaning}</p>
                  {!spellingResult && (
                    <p className="text-xs text-red-500 mt-1">
                      你拼写了：<span className="line-through">{spellingInput}</span>
                      <span className="ml-2 text-emerald-600">{currentWord.word}</span>
                    </p>
                  )}
                </div>
                <Button onClick={advanceToNext}>
                  下一题 <ArrowRight className="size-3.5 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 标准模式按钮 */}
      {mode === "standard" && showAnswer && (
        <div className="grid grid-cols-3 gap-3">
          <Button variant="outline" size="lg" className="h-14 border-red-200 hover:bg-red-50 hover:text-red-700" disabled={submitting} onClick={() => submitStandard(0)}>忘了</Button>
          <Button variant="outline" size="lg" className="h-14 border-amber-200 hover:bg-amber-50 hover:text-amber-700" disabled={submitting} onClick={() => submitStandard(1)}>模糊</Button>
          <Button size="lg" className="h-14 bg-emerald-600 hover:bg-emerald-700" disabled={submitting} onClick={() => submitStandard(2)}>记得</Button>
        </div>
      )}
    </div>
  )
}
