import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/server"
import { prisma } from "@/lib/db/prisma"

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q")

    if (!q || q.trim().length < 1) {
      return NextResponse.json({ words: [] })
    }

    const words = await prisma.word.findMany({
      where: {
        word: { contains: q.trim().toLowerCase() },
      },
      select: { id: true, word: true },
      take: 20,
      orderBy: { word: "asc" },
    })

    return NextResponse.json({ words })
  } catch (error) {
    console.error("Word search error:", error)
    return NextResponse.json({ error: "搜索失败" }, { status: 500 })
  }
}
