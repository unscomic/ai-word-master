import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock Prisma
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed_password"),
  },
}))

import { POST } from "./route"
import { prisma } from "@/lib/db/prisma"

function createRequest(body: Record<string, string>) {
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("注册 API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("邮箱为空应返回 400", async () => {
    const res = await POST(createRequest({ email: "", password: "123456" }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })

  it("密码为空应返回 400", async () => {
    const res = await POST(createRequest({ email: "test@test.com", password: "" }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })

  it("密码少于6位应返回 400", async () => {
    const res = await POST(createRequest({ email: "test@test.com", password: "12345" }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain("6位")
  })

  it("正常注册应返回 201", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)
    vi.mocked(prisma.user.create).mockResolvedValueOnce({
      id: "user-123",
      email: "new@test.com",
      password: "hashed",
      name: "测试",
      examType: null,
      dailyGoal: 20,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const res = await POST(
      createRequest({ email: "new@test.com", password: "123456", name: "测试" })
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.userId).toBe("user-123")
  })

  it("重复邮箱应返回 409", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: "existing",
      email: "exists@test.com",
      password: "hashed",
      name: "已存在",
      examType: null,
      dailyGoal: 20,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never)

    const res = await POST(
      createRequest({ email: "exists@test.com", password: "123456" })
    )
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toContain("已被注册")
  })
})
