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
      isPreset: wordbook.isPreset,
      userId: wordbook.userId,
      words,
    })
  } catch (error) {
    console.error("Wordbook detail error:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}

/** 删除自定义单词本 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { id } = await params

    const wordbook = await prisma.wordbook.findUnique({ where: { id } })
    if (!wordbook) {
      return NextResponse.json({ error: "词库不存在" }, { status: 404 })
    }
    if (wordbook.isPreset || wordbook.userId !== user.id) {
      return NextResponse.json({ error: "无权删除此词库" }, { status: 403 })
    }

    await prisma.wordbook.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete wordbook error:", error)
    return NextResponse.json({ error: "删除失败" }, { status: 500 })
  }
}

/** 向自定义单词本添加单词 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { id } = await params
    const { wordId, word: wordText } = await request.json()

    const wordbook = await prisma.wordbook.findUnique({ where: { id } })
    if (!wordbook) {
      return NextResponse.json({ error: "词库不存在" }, { status: 404 })
    }
    if (wordbook.isPreset || wordbook.userId !== user.id) {
      return NextResponse.json({ error: "无权修改此词库" }, { status: 403 })
    }

    // 查找或创建单词
    let word = wordId
      ? await prisma.word.findUnique({ where: { id: wordId } })
      : null

    if (!word && wordText) {
      word = await prisma.word.upsert({
        where: { word: wordText.trim().toLowerCase() },
        update: {},
        create: { word: wordText.trim().toLowerCase() },
      })
    }

    if (!word) {
      return NextResponse.json({ error: "请提供有效单词" }, { status: 400 })
    }

    // 检查是否已存在
    const existing = await prisma.wordbookWord.findUnique({
      where: {
        wordbookId_wordId: { wordbookId: id, wordId: word.id },
      },
    })

    if (existing) {
      return NextResponse.json({ error: "该单词已在词库中" }, { status: 409 })
    }

    await prisma.wordbookWord.create({
      data: { wordbookId: id, wordId: word.id },
    })

    return NextResponse.json({ wordId: word.id, word: word.word }, { status: 201 })
  } catch (error) {
    console.error("Add word to wordbook error:", error)
    return NextResponse.json({ error: "添加失败" }, { status: 500 })
  }
}
