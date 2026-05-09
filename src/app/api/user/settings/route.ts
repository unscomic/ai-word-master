import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/server"
import { prisma } from "@/lib/db/prisma"

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const { name, examType, dailyGoal } = await request.json()

    const validExamTypes = ["cet4", "cet6", "postgrad", "ielts", "toefl", null]
    if (examType !== undefined && !validExamTypes.includes(examType)) {
      return NextResponse.json(
        { error: "无效的考试类型" },
        { status: 400 }
      )
    }

    if (dailyGoal !== undefined && (dailyGoal < 5 || dailyGoal > 200)) {
      return NextResponse.json(
        { error: "每日目标应在 5-200 之间" },
        { status: 400 }
      )
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(examType !== undefined && { examType }),
        ...(dailyGoal !== undefined && { dailyGoal }),
      },
    })

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      examType: updated.examType,
      dailyGoal: updated.dailyGoal,
    })
  } catch (error) {
    console.error("Settings update error:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 })
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        examType: true,
        dailyGoal: true,
      },
    })

    return NextResponse.json(fullUser)
  } catch (error) {
    console.error("Settings fetch error:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}
