"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen } from "lucide-react"

interface Wordbook {
  id: string
  name: string
  description: string | null
  wordCount: number
}

export default function WordbooksPage() {
  const router = useRouter()
  const [wordbooks, setWordbooks] = useState<Wordbook[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchWordbooks() {
      const res = await fetch("/api/wordbooks")
      if (res.ok) {
        setWordbooks(await res.json())
      }
      setLoading(false)
    }
    fetchWordbooks()
  }, [])

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

      <div className="grid gap-4">
        {wordbooks.map((wb) => (
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

      {wordbooks.length === 0 && (
        <p className="text-center text-muted-foreground py-8">暂无可选词库</p>
      )}
    </div>
  )
}
