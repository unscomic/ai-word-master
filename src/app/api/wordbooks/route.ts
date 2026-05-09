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
      where: { isPreset: true },
      include: {
        _count: {
          select: { words: true },
        },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(
      wordbooks.map((wb) => ({
        id: wb.id,
        name: wb.name,
        description: wb.description,
        wordCount: wb._count.words,
      }))
    )
  } catch (error) {
    console.error("Wordbooks list error:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}
