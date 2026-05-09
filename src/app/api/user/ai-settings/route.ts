import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/server"
import { prisma } from "@/lib/db/prisma"
import { encrypt } from "@/lib/crypto"

// GET — 获取 AI 设置（不返回完整 API Key，只返回是否已配置和模型选择）
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { apiKey: true, aiProvider: true },
    })

    return NextResponse.json({
      hasApiKey: !!fullUser?.apiKey,
      aiProvider: fullUser?.aiProvider || "claude",
    })
  } catch (error) {
    console.error("AI settings fetch error:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}

// PATCH — 更新 AI 设置
export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { apiKey, aiProvider } = await request.json()

    if (aiProvider && !["claude", "deepseek"].includes(aiProvider)) {
      return NextResponse.json(
        { error: "不支持的 AI 提供商，可选 claude 或 deepseek" },
        { status: 400 },
      )
    }

    const data: Record<string, string | null> = {}

    if (apiKey !== undefined) {
      if (apiKey && apiKey.trim()) {
        data.apiKey = encrypt(apiKey.trim())
      } else {
        data.apiKey = null // 清除 API Key
      }
    }

    if (aiProvider) {
      data.aiProvider = aiProvider
    }

    await prisma.user.update({
      where: { id: user.id },
      data,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("AI settings update error:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}
