"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Send, Sparkles, X, RotateCcw, ChevronDown, ChevronUp, Languages, Lightbulb } from "lucide-react"
import { SCENARIOS, type ScenarioConfig } from "@/lib/ai/prompts"

interface Correction {
  original: string
  corrected: string
  explanation: string
}

interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
  correction?: Correction | null
  tip?: string | null
}

interface SessionSummary {
  summary: string
  score: number
  highlights: string[]
  improvements: string[]
  keyPhrases: string[]
  done: boolean
}

export default function ScenarioChatPage() {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioConfig | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<SessionSummary | null>(null)
  const [expandedTips, setExpandedTips] = useState<Record<number, boolean>>({})
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function startScenario(scenario: ScenarioConfig) {
    setSelectedScenario(scenario)
    setLoading(true)
    setMessages([])
    setSummary(null)
    setSessionId(null)

    const res = await fetch("/api/chat/scenario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario: scenario.key }),
    })

    const data = await res.json()
    setLoading(false)

    if (res.ok) {
      setSessionId(data.sessionId)
      const msg: ChatMessage = {
        role: "assistant",
        content: data.reply,
        correction: data.correction,
        tip: data.tip,
      }
      setMessages([msg])
      // Focus input after AI starts
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      toast.error(data.error || "启动失败")
      setSelectedScenario(null)
    }
  }

  async function sendMessage() {
    if (!input.trim() || !sessionId || !selectedScenario) return

    const userMessage = input.trim()
    setInput("")

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setLoading(true)

    const res = await fetch("/api/chat/scenario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenario: selectedScenario.key,
        sessionId,
        message: userMessage,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (res.ok) {
      const aiMsg: ChatMessage = {
        role: "assistant",
        content: data.reply,
        correction: data.correction,
        tip: data.tip,
      }
      setMessages((prev) => [...prev, aiMsg])
    } else {
      toast.error(data.error || "发送失败")
    }
  }

  async function endSession() {
    if (!sessionId || !selectedScenario) return

    setLoading(true)
    const res = await fetch("/api/chat/scenario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenario: selectedScenario.key,
        sessionId,
        message: "__END_SESSION__",
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (res.ok) {
      setSummary(data)
    } else {
      toast.error(data.error || "结束失败")
    }
  }

  function reset() {
    setSelectedScenario(null)
    setSessionId(null)
    setMessages([])
    setInput("")
    setSummary(null)
  }

  function toggleTip(index: number) {
    setExpandedTips((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  // Scenario selection screen
  if (!selectedScenario) {
    return (
      <div className="container max-w-lg mx-auto py-6 px-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Languages className="size-5 text-primary" />
            情景对话
          </h1>
          <p className="text-muted-foreground mt-1">
            选一个场景，和 AI 进行英文对话练习，AI 会纠正你的语法错误
          </p>
        </div>

        <div className="grid gap-3">
          {SCENARIOS.map((scenario) => (
            <Card
              key={scenario.key}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => startScenario(scenario)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <span className="text-2xl">{scenario.icon}</span>
                <div className="flex-1">
                  <p className="font-medium">{scenario.title}</p>
                  <p className="text-sm text-muted-foreground">
                    角色：{scenario.role}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Chat screen
  return (
    <div className="container max-w-lg mx-auto py-4 px-4 h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">{selectedScenario.icon}</span>
          <div>
            <h1 className="font-semibold">{selectedScenario.title}</h1>
            <p className="text-xs text-muted-foreground">{selectedScenario.role}</p>
          </div>
        </div>
        <div className="flex gap-1">
          {!summary && (
            <Button variant="ghost" size="sm" onClick={endSession} disabled={loading || messages.length < 2}>
              <X className="size-4 mr-1" />
              结束
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={reset}>
            <RotateCcw className="size-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pr-2" ref={scrollRef}>
        <div className="space-y-3 pb-2">
          {messages.map((msg, i) => (
            <div key={i}>
              {msg.role === "user" ? (
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2 max-w-[80%]">
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2 max-w-[85%]">
                    <p className="text-sm">{msg.content}</p>
                  </div>

                  {/* Correction */}
                  {msg.correction && (
                    <div className="ml-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-2 max-w-[90%]">
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">纠正</p>
                      <div className="flex items-start gap-2 text-xs">
                        <span className="text-red-500 line-through">{msg.correction.original}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          {msg.correction.corrected}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{msg.correction.explanation}</p>
                    </div>
                  )}

                  {/* Tip */}
                  {msg.tip && (
                    <div
                      className="ml-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-2 max-w-[90%] cursor-pointer"
                      onClick={() => toggleTip(i)}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                          <Lightbulb className="size-3" />
                          实用表达
                        </p>
                        {expandedTips[i] ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                      </div>
                      {expandedTips[i] && (
                        <p className="text-xs mt-1 text-blue-700 dark:text-blue-300">{msg.tip}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="space-y-2">
              <Skeleton className="h-10 w-3/4 rounded-2xl" />
              <Skeleton className="h-6 w-1/2 ml-2" />
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <Card className="mx-2 mb-3 shrink-0">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">对话总结</CardTitle>
              <Badge variant={summary.score >= 7 ? "default" : "secondary"}>
                {summary.score} / 10
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pb-3">
            <p className="text-sm text-muted-foreground">{summary.summary}</p>

            {summary.highlights.length > 0 && (
              <div>
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">做得好的地方</p>
                <ul className="text-xs space-y-0.5">
                  {summary.highlights.map((h, i) => (
                    <li key={i} className="text-muted-foreground">- {h}</li>
                  ))}
                </ul>
              </div>
            )}

            {summary.improvements.length > 0 && (
              <div>
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">可以改进</p>
                <ul className="text-xs space-y-0.5">
                  {summary.improvements.map((imp, i) => (
                    <li key={i} className="text-muted-foreground">- {imp}</li>
                  ))}
                </ul>
              </div>
            )}

            {summary.keyPhrases.length > 0 && (
              <div>
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">实用短语</p>
                <div className="flex flex-wrap gap-1">
                  {summary.keyPhrases.map((p, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{p}</Badge>
                  ))}
                </div>
              </div>
            )}

            <Button variant="outline" size="sm" className="w-full" onClick={reset}>
              <RotateCcw className="size-3 mr-1" />
              换个场景
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Input area */}
      {!summary && (
        <div className="flex gap-2 pt-2 shrink-0">
          <Input
            ref={inputRef}
            placeholder="输入你的英文回复..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            disabled={loading}
          />
          <Button size="icon" onClick={sendMessage} disabled={loading || !input.trim()}>
            <Send className="size-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
