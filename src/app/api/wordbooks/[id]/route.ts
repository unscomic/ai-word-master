import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/server"
import { prisma } from "@/lib/db/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { id } = await params

    const wordbook = await prisma.wordbook.findUnique({
      where: { id },
      include: {
        words: {
          include: {
            word: true,
          },
        },
      },
    })

    if (!wordbook) {
      return NextResponse.json({ error: "词库不存在" }, { status: 404 })
    }

    const words = wordbook.words.map((w) => ({
      id: w.word.id,
      word: w.word.word,
      phonetic: w.word.phonetic,
      hasContent: !!w.word.aiContent,
    }))

    return NextResponse.json({
      id: wordbook.id,
      name: wordbook.name,
      description: wordbook.description,
      words,
    })
  } catch (error) {
    console.error("Wordbook detail error:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}
