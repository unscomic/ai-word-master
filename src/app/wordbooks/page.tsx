"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { BookOpen, Plus, Trash2, X, Search, Loader2 } from "lucide-react"

interface Wordbook {
  id: string
  name: string
  description: string | null
  wordCount: number
  isPreset: boolean
}

export default function WordbooksPage() {
  const router = useRouter()
  const [wordbooks, setWordbooks] = useState<Wordbook[]>([])
  const [loading, setLoading] = useState(true)

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [creating, setCreating] = useState(false)

  // Word search dialog
  const [addWordOpen, setAddWordOpen] = useState(false)
  const [activeWordbookId, setActiveWordbookId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<{ id: string; word: string }[]>([])
  const [searching, setSearching] = useState(false)
  const [addingWord, setAddingWord] = useState<string | null>(null)

  async function loadWordbooks() {
    const res = await fetch("/api/wordbooks")
    if (res.ok) {
      setWordbooks(await res.json())
    }
    setLoading(false)
  }

  useEffect(() => {
    loadWordbooks()
  }, [])

  async function handleCreate() {
    if (!newName.trim()) return
    setCreating(true)
    const res = await fetch("/api/wordbooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, description: newDesc }),
    })
    setCreating(false)
    if (res.ok) {
      const wb = await res.json()
      setWordbooks((prev) => [...prev, wb])
      setNewName("")
      setNewDesc("")
      setCreateOpen(false)
      toast.success("单词本已创建")
    } else {
      const data = await res.json()
      toast.error(data.error || "创建失败")
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/wordbooks/${id}`, { method: "DELETE" })
    if (res.ok) {
      setWordbooks((prev) => prev.filter((w) => w.id !== id))
      toast.success("已删除")
    } else {
      toast.error("删除失败")
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim() || !activeWordbookId) return
    setSearching(true)
    const res = await fetch(`/api/wordbooks/${activeWordbookId}?search=${encodeURIComponent(searchQuery)}`)
    // Search across all words in the database
    const searchRes = await fetch(`/api/wordbooks/${activeWordbookId}`)
    if (searchRes.ok) {
      const data = await searchRes.json()
      // Find words matching the query from the full word list
      // We'll search the general word list
      setSearchResults([])
      // Use the global word search
      const wordRes = await fetch(`/api/words/search?q=${encodeURIComponent(searchQuery.trim())}`)
      if (wordRes.ok) {
        const wordData = await wordRes.json()
        setSearchResults(wordData.words || [])
      }
    }
    setSearching(false)
  }

  async function handleAddWord(wordId: string, word: string) {
    if (!activeWordbookId) return
    setAddingWord(wordId)
    const res = await fetch(`/api/wordbooks/${activeWordbookId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordId, word }),
    })
    setAddingWord(null)
    if (res.ok) {
      toast.success(`已添加 "${word}"`)
      loadWordbooks()
    } else if (res.status === 409) {
      toast.error("该单词已在词库中")
    } else {
      const data = await res.json()
      toast.error(data.error || "添加失败")
    }
  }

  const presetBooks = wordbooks.filter((w) => w.isPreset)
  const customBooks = wordbooks.filter((w) => !w.isPreset)

  if (loading) {
    return (
      <div className="container max-w-xl mx-auto py-8 px-4">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    )
  }

  return (
    <div className="container max-w-xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">选择词库</h1>
        <p className="text-muted-foreground">选择一个词库开始学习</p>
      </div>

      {/* 预设词库 */}
      <div className="grid gap-4">
        {presetBooks.map((wb) => (
          <Card key={wb.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="size-5 text-primary" />
                  {wb.name}
                </CardTitle>
                <Badge variant="secondary">{wb.wordCount} 词</Badge>
              </div>
              {wb.description && (
                <CardDescription>{wb.description}</CardDescription>
              )}
            </CardHeader>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => router.push(`/learn?wordbook=${wb.id}`)}
              >
                开始学习
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* 自定义词库 */}
      <Separator />

      <div className="flex items-center justify-between">
        <h2 className="font-semibold">我的词库</h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger
            className="inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
          >
            <Plus className="size-4" />
            新建
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新建单词本</DialogTitle>
              <DialogDescription>创建一个自定义单词本，添加你想学习的单词</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Input
                placeholder="单词本名称（如：编程术语）"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
              <Input
                placeholder="描述（可选）"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
              <Button className="w-full" onClick={handleCreate} disabled={creating || !newName.trim()}>
                {creating ? "创建中..." : "创建"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {customBooks.length > 0 ? (
        <div className="grid gap-3">
          {customBooks.map((wb) => (
            <Card key={wb.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="size-4 text-primary" />
                    {wb.name}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-xs">{wb.wordCount} 词</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(wb.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardFooter className="pt-0 flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => router.push(`/learn?wordbook=${wb.id}`)}
                  disabled={wb.wordCount === 0}
                >
                  开始学习
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setActiveWordbookId(wb.id)
                    setAddWordOpen(true)
                  }}
                >
                  <Plus className="size-3.5 mr-1" />
                  加词
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          还没有自定义词库，点击"新建"创建
        </p>
      )}

      {wordbooks.length === 0 && (
        <p className="text-center text-muted-foreground py-8">暂无可选词库</p>
      )}

      {/* 加词对话框 */}
      <Dialog
        open={addWordOpen}
        onOpenChange={(open) => {
          setAddWordOpen(open)
          if (!open) { setActiveWordbookId(null); setSearchResults([]); setSearchQuery("") }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              添加单词到 "{customBooks.find((w) => w.id === activeWordbookId)?.name || ""}"
            </DialogTitle>
            <DialogDescription>搜索并添加单词到你的自定义词库</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex gap-2">
              <Input
                placeholder="搜索单词..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button size="icon" onClick={handleSearch} disabled={searching || !searchQuery.trim()}>
                {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {searchResults.map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
                  >
                    <span className="font-medium">{w.word}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAddWord(w.id, w.word)}
                      disabled={addingWord === w.id}
                    >
                      {addingWord === w.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Plus className="size-3.5" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {searchResults.length === 0 && searchQuery.trim() && !searching && (
              <p className="text-sm text-muted-foreground text-center py-2">未找到匹配单词</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
