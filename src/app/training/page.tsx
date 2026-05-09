"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { ArrowRight, Check, X, Volume2, RotateCcw, Brain, Pencil, Ear } from "lucide-react"
import Link from "next/link"

interface ErrorWord {
  progressId: string
  wordId: string
  word: string
  phonetic: string | null
  meaning: string
  mistakes: number
  level: number
}

type QuizMode = "choice" | "spelling" | "listening"

interface QuizItem {
  word: ErrorWord
  mode: QuizMode
  options?: string[]
}

interface QuizResult {
  progressId: string
  wordId: string
  correct: boolean
  word: string
  meaning: string
  userAnswer: string
  correctAnswer: string
  mode: QuizMode
}

export default function TrainingPage() {
  const [loading, setLoading] = useState(true)
  const [errorWords, setErrorWords] = useState<ErrorWord[]>([])
  const [distractors, setDistractors] = useState<string[]>([])
  const [started, setStarted] = useState(false)
  const [quizItems, setQuizItems] = useState<QuizItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState("")
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [results, setResults] = useState<QuizResult[]>([])
  const [finished, setFinished] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [totalAccuracy, setTotalAccuracy] = useState<{ correct: number; total: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/training/errors")
      if (res.ok) {
        const data = await res.json()
        setErrorWords(data.words || [])
        setDistractors(data.distractors || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  // 生成测验题目
  const generateQuiz = useCallback(() => {
    const modes: QuizMode[] = ["choice", "spelling", "listening"]
    const items: QuizItem[] = errorWords.map((word) => {
      const mode = modes[Math.floor(Math.random() * modes.length)]

      let options: string[] | undefined
      if (mode === "choice") {
        // 生成 4 个选项（1 正确 + 3 干扰）
        const distract = getMeaningOptions(word, errorWords)
        options = [word.meaning, ...distract].sort(() => Math.random() - 0.5)
      }

      return { word, mode, options }
    })

    return items
  }, [errorWords])

  function getMeaningOptions(target: ErrorWord, all: ErrorWord[]): string[] {
    const others = all
      .filter((w) => w.wordId !== target.wordId)
      .map((w) => w.meaning)
      .filter((m) => m && m !== "未获取释义")
    return others.sort(() => Math.random() - 0.5).slice(0, 3)
  }

  function startTraining() {
    if (errorWords.length === 0) return
    const quiz = generateQuiz()
    setQuizItems(quiz)
    setCurrentIndex(0)
    setResults([])
    setFinished(false)
    setStarted(true)
    setShowFeedback(false)
    setSelectedOption(null)
    setUserAnswer("")
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  function submitAnswer() {
    const current = quizItems[currentIndex]
    if (!current) return

    let correct = false
    let answer = ""
    const correctAnswer = current.word.meaning

    if (current.mode === "choice") {
      correct = selectedOption === current.word.meaning
      answer = selectedOption || ""
    } else {
      // spelling or listening: compare word
      correct = userAnswer.trim().toLowerCase() === current.word.word.toLowerCase()
      answer = userAnswer.trim()
    }

    setIsCorrect(correct)
    setShowFeedback(true)

    setResults((prev) => [
      ...prev,
      {
        progressId: current.word.progressId,
        wordId: current.word.wordId,
        correct,
        word: current.word.word,
        meaning: current.word.meaning,
        userAnswer: answer,
        correctAnswer: current.mode === "choice" ? current.word.meaning : current.word.word,
        mode: current.mode,
      },
    ])
  }

  function nextQuestion() {
    if (currentIndex + 1 >= quizItems.length) {
      // 全部完成
      finishTraining()
    } else {
      setCurrentIndex((i) => i + 1)
      setShowFeedback(false)
      setSelectedOption(null)
      setUserAnswer("")
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  async function finishTraining() {
    setFinished(true)
    setSubmitting(true)

    const res = await fetch("/api/training/result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ results }),
    })

    if (res.ok) {
      const data = await res.json()
      setTotalAccuracy(data)
    }
    setSubmitting(false)
  }

  function speak(word: string) {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(word)
      utterance.lang = "en-US"
      utterance.rate = 0.85
      speechSynthesis.speak(utterance)
    }
  }

  // 加载中
  if (loading) {
    return (
      <div className="container max-w-lg mx-auto py-8 px-4 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    )
  }

  // 无错词
  if (errorWords.length === 0 && !started) {
    return (
      <div className="container max-w-lg mx-auto py-16 px-4 text-center space-y-6">
        <div className="text-6xl">🎉</div>
        <div>
          <h1 className="text-2xl font-bold">太棒了！</h1>
          <p className="text-muted-foreground mt-2">目前没有需要强化训练的错词</p>
          <p className="text-sm text-muted-foreground">
            当某个单词累计错误 3 次以上时，会自动加入强化训练池
          </p>
        </div>
        <Link href="/review" className={buttonVariants({})}>
          去复习
        </Link>
      </div>
    )
  }

  // 结果总结
  if (finished) {
    const correct = results.filter((r) => r.correct).length
    const accuracy = results.length > 0 ? Math.round((correct / results.length) * 100) : 0

    return (
      <div className="container max-w-lg mx-auto py-6 px-4 space-y-6">
        <div className="text-center space-y-3">
          <div className="text-5xl">{accuracy >= 80 ? "🎉" : accuracy >= 50 ? "💪" : "📚"}</div>
          <h1 className="text-2xl font-bold">训练完成</h1>
          <div className="text-3xl font-bold text-primary">{accuracy}%</div>
          <p className="text-muted-foreground">
            {results.length} 题中正确 {correct} 题
          </p>
          {submitting && <p className="text-sm text-muted-foreground">正在保存结果...</p>}
        </div>

        {/* 详细结果 */}
        <div className="space-y-2">
          {results.map((r, i) => (
            <Card key={i} className={r.correct ? "border-emerald-200" : "border-red-200"}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${r.correct ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
                  {r.correct ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{r.word}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.meaning}</p>
                  {!r.correct && (
                    <p className="text-xs text-red-500 mt-0.5">
                      你的答案：{r.userAnswer || "未作答"}
                    </p>
                  )}
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {r.mode === "choice" ? "选择" : r.mode === "spelling" ? "拼写" : "听音"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button className="w-full" onClick={startTraining} disabled={submitting}>
          <RotateCcw className="size-4 mr-1" />
          再来一轮
        </Button>

        <Link href="/review" className={buttonVariants({ variant: "outline", className: "w-full" })}>
          去复习
        </Link>
      </div>
    )
  }

  // 未开始
  if (!started) {
    return (
      <div className="container max-w-lg mx-auto py-8 px-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="size-5 text-primary" />
            错词强化训练
          </h1>
          <p className="text-muted-foreground mt-1">
            针对高频错误单词的专项训练，包含选择、拼写、听音多种模式
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">待训练错词</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-4xl font-bold text-primary">{errorWords.length}</div>
            <p className="text-sm text-muted-foreground">个单词需要强化训练</p>

            <div className="space-y-1">
              {errorWords.slice(0, 10).map((w) => (
                <div key={w.wordId} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{w.word}</span>
                  <Badge variant="secondary" className="text-xs">错 {w.mistakes} 次</Badge>
                </div>
              ))}
              {errorWords.length > 10 && (
                <p className="text-xs text-muted-foreground">...还有 {errorWords.length - 10} 个</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <Card>
            <CardContent className="p-3">
              <Pencil className="size-5 mx-auto mb-1 text-blue-500" />
              <p className="font-medium">选择题</p>
              <p className="text-xs text-muted-foreground">看词选义</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <Ear className="size-5 mx-auto mb-1 text-purple-500" />
              <p className="font-medium">听音题</p>
              <p className="text-xs text-muted-foreground">听音拼写</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <Brain className="size-5 mx-auto mb-1 text-emerald-500" />
              <p className="font-medium">拼写题</p>
              <p className="text-xs text-muted-foreground">看义拼写</p>
            </CardContent>
          </Card>
        </div>

        <Button className="w-full" size="lg" onClick={startTraining}>
          开始强化训练
          <ArrowRight className="size-4 ml-1" />
        </Button>
      </div>
    )
  }

  // 训练中
  const current = quizItems[currentIndex]
  const progress = ((currentIndex + (showFeedback ? 1 : 0)) / quizItems.length) * 100

  return (
    <div className="container max-w-lg mx-auto py-4 px-4 space-y-4">
      {/* 进度 */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {showFeedback ? currentIndex + 1 : currentIndex} / {quizItems.length}
          </span>
          <span className="text-muted-foreground">
            {current.mode === "choice" ? "选择题" : current.mode === "spelling" ? "拼写题" : "听音题"}
          </span>
        </div>
        <Progress value={progress} />
      </div>

      {/* 题目 */}
      <Card className="text-center">
        <CardContent className="p-6 space-y-4">
          {current.mode === "listening" ? (
            <>
              <p className="text-sm text-muted-foreground">点击喇叭听发音，输入你听到的单词</p>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full size-16 mx-auto"
                onClick={() => speak(current.word.word)}
              >
                <Volume2 className="size-6" />
              </Button>
              <p className="text-xs text-muted-foreground">{current.word.phonetic || ""}</p>
            </>
          ) : current.mode === "spelling" ? (
            <>
              <p className="text-sm text-muted-foreground">根据释义写出单词</p>
              <p className="text-lg font-medium">{current.word.meaning}</p>
              <p className="text-xs text-muted-foreground">
                提示：首字母 "{current.word.word[0].toUpperCase()}"，共 {current.word.word.length} 个字母
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">选择正确的中文释义</p>
              <p className="text-3xl font-bold">{current.word.word}</p>
              {current.word.phonetic && (
                <Button variant="ghost" size="sm" onClick={() => speak(current.word.word)}>
                  <Volume2 className="size-4 mr-1" /> {current.word.phonetic}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 反馈 */}
      {showFeedback && (
        <Card className={isCorrect ? "border-emerald-300" : "border-red-300"}>
          <CardContent className="p-4 text-center space-y-2">
            <div className={`text-lg font-bold ${isCorrect ? "text-emerald-600" : "text-red-600"}`}>
              {isCorrect ? "正确!" : "错误!"}
            </div>
            <p className="text-sm">
              <span className="font-semibold">{current.word.word}</span>
              {" — "}
              <span className="text-muted-foreground">{current.word.meaning}</span>
            </p>
            {!isCorrect && (
              <p className="text-xs text-red-500">
                你的答案：{results[results.length - 1]?.userAnswer || "未作答"}
              </p>
            )}
            <Button size="sm" onClick={nextQuestion}>
              {currentIndex + 1 >= quizItems.length ? "查看结果" : "下一题"}
              <ArrowRight className="size-3.5 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 答题区域 */}
      {!showFeedback && (
        <div className="space-y-3">
          {current.mode === "choice" && current.options && (
            <div className="grid gap-2">
              {current.options.map((opt, i) => (
                <Button
                  key={i}
                  variant={selectedOption === opt ? "default" : "outline"}
                  className="justify-start h-auto py-3 px-4 text-sm"
                  onClick={() => setSelectedOption(opt)}
                >
                  {opt}
                </Button>
              ))}
            </div>
          )}

          {(current.mode === "spelling" || current.mode === "listening") && (
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder={current.mode === "listening" ? "输入你听到的单词..." : "输入英文单词..."}
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && userAnswer.trim()) {
                    submitAnswer()
                  }
                }}
                autoFocus
              />
              {current.mode === "listening" && (
                <Button variant="outline" size="icon" onClick={() => speak(current.word.word)}>
                  <Volume2 className="size-4" />
                </Button>
              )}
            </div>
          )}

          <Button
            className="w-full"
            disabled={
              (current.mode === "choice" && !selectedOption) ||
              (current.mode !== "choice" && !userAnswer.trim())
            }
            onClick={submitAnswer}
          >
            确认
          </Button>
        </div>
      )}
    </div>
  )
}
