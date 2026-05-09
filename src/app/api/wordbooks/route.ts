import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/server"
import { prisma } from "@/lib/db/prisma"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const wordbooks = await prisma.wordbook.findMany({
      where: {
        OR: [
          { isPreset: true },
          { userId: user.id },
        ],
      },
      include: {
        _count: {
          select: { words: true },
        },
      },
      orderBy: [{ isPreset: "desc" }, { createdAt: "asc" }],
    })

    return NextResponse.json(
      wordbooks.map((wb) => ({
        id: wb.id,
        name: wb.name,
        description: wb.description,
        wordCount: wb._count.words,
        isPreset: wb.isPreset,
      }))
    )
  } catch (error) {
    console.error("Wordbooks list error:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}

/** 创建自定义单词本 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { name, description } = await request.json()
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "请输入单词本名称" }, { status: 400 })
    }

    const wordbook = await prisma.wordbook.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isPreset: false,
        userId: user.id,
      },
      include: { _count: { select: { words: true } } },
    })

    return NextResponse.json({
      id: wordbook.id,
      name: wordbook.name,
      description: wordbook.description,
      wordCount: wordbook._count.words,
      isPreset: false,
    }, { status: 201 })
  } catch (error) {
    console.error("Create wordbook error:", error)
    return NextResponse.json({ error: "创建失败" }, { status: 500 })
  }
}
