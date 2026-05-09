"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Send, Plus, MessageCircle, Trash2, ChevronRight, Bot, User } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

interface SessionInfo {
  id: string
  preview: string
  messageCount: number
  createdAt: string
  updatedAt: string
}

export default function FreeChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [streamingText, setStreamingText] = useState("")
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, streamingText, scrollToBottom])
  useEffect(() => { loadSessions() }, [])

  async function loadSessions() {
    const res = await fetch("/api/chat/free")
    if (res.ok) {
      const data = await res.json()
      setSessions(data.sessions || [])
    }
  }

  async function loadSession(id: string) {
    const res = await fetch(`/api/chat/free?sessionId=${id}`)
    if (res.ok) {
      const data = await res.json()
      setMessages(data.messages.filter((m: ChatMessage) => m.role !== "system"))
      setSessionId(id)
      setHistoryOpen(false)
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput("")
    setStreamingText("")

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: userMsg },
    ]
    setMessages(newMessages)

    setLoading(true)
    scrollToBottom()

    try {
      const res = await fetch("/api/chat/free", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          sessionId: sessionId,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "请求失败")
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error("No response body")

      const decoder = new TextDecoder()
      let buffer = ""
      let fullText = ""
      let newSessionId: string | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // 解析 SSE 事件
        while (buffer.includes("\n\n")) {
          const idx = buffer.indexOf("\n\n")
          const event = buffer.slice(0, idx)
          buffer = buffer.slice(idx + 2)

          const lines = event.split("\n")
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue
            const jsonStr = line.slice(6)

            if (jsonStr === "[DONE]") continue

            try {
              const data = JSON.parse(jsonStr)
              if (data.text) {
                fullText += data.text
                setStreamingText(fullText)
              }
              if (data.sessionId) {
                newSessionId = data.sessionId
              }
            } catch {}
          }
        }
      }

      // 添加 AI 回复
      if (fullText) {
        setMessages((prev) => [...prev, { role: "assistant", content: fullText }])
      }
      setStreamingText("")

      if (newSessionId) {
        setSessionId(newSessionId)
        loadSessions()
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "发送失败"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  function newChat() {
    setMessages([])
    setSessionId(null)
    setStreamingText("")
    setHistoryOpen(false)
    inputRef.current?.focus()
  }

  // 解析 AI 回复中的 tip 格式
  function renderContent(content: string) {
    const parts = content.split(/(💡 Tip:.*)/)
    return parts.map((part, i) => {
      if (part.startsWith("💡 Tip:")) {
        return (
          <span key={i} className="text-blue-500 dark:text-blue-400">
            {part}
          </span>
        )
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <div className="container max-w-lg mx-auto py-2 px-3 h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="size-5 text-primary" />
          <div>
            <h1 className="font-semibold text-sm">AI 英语导师 Alex</h1>
            <p className="text-xs text-muted-foreground">自由对话练习</p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon-sm" onClick={newChat}>
            <Plus className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setHistoryOpen(true)}>
            <MessageCircle className="size-4" />
          </Button>
          <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>历史对话</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-1">
                {sessions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">暂无历史对话</p>
                )}
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    className="w-full text-left p-2 rounded-lg hover:bg-muted flex items-center justify-between group"
                    onClick={() => loadSession(s.id)}
                  >
                    <div className="min-w-0">
                      <p className="text-sm truncate">{s.preview}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.messageCount} 条消息
                      </p>
                    </div>
                    <ChevronRight className="size-4 opacity-0 group-hover:opacity-100 shrink-0" />
                  </button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pr-1" ref={scrollRef}>
        <div className="space-y-3 pb-2">
          {messages.length === 0 && !loading && (
            <div className="text-center py-16 space-y-3">
              <Bot className="size-12 mx-auto text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                和 AI 英语导师 Alex 开始自由对话吧！
              </p>
              <p className="text-xs text-muted-foreground">
                可以聊任何话题，Alex 会帮你纠正语法错误
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="size-3.5 text-primary" />
                </div>
              )}
              <div
                className={`rounded-2xl px-3 py-2 max-w-[82%] text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted rounded-bl-md"
                }`}
              >
                <p className="whitespace-pre-wrap">{renderContent(msg.content)}</p>
              </div>
              {msg.role === "user" && (
                <div className="shrink-0 w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
                  <User className="size-3.5" />
                </div>
              )}
            </div>
          ))}

          {/* Streaming response */}
          {streamingText && (
            <div className="flex gap-2">
              <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="size-3.5 text-primary" />
              </div>
              <div className="rounded-2xl rounded-bl-md px-3 py-2 max-w-[82%] text-sm bg-muted">
                <p className="whitespace-pre-wrap">{renderContent(streamingText)}</p>
                <span className="inline-block w-1.5 h-4 bg-primary animate-pulse ml-0.5 align-middle" />
              </div>
            </div>
          )}

          {/* Loading (before first token) */}
          {loading && !streamingText && (
            <div className="flex gap-2">
              <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="size-3.5 text-primary" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-2 shrink-0">
        <Input
          ref={inputRef}
          placeholder="和 Alex 聊聊吧..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
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
    </div>
  )
}
