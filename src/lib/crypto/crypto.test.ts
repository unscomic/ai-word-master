import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { encrypt, decrypt } from "./index"

describe("加密工具", () => {
  const originalKey = process.env.AUTH_SECRET

  beforeEach(() => {
    process.env.AUTH_SECRET = "test-secret-key-for-testing-abc123!!"
  })

  afterEach(() => {
    process.env.AUTH_SECRET = originalKey
  })

  it("加密后解密应得到原文", () => {
    const text = "sk-ant-api03-test-key-123456"
    const encrypted = encrypt(text)
    expect(encrypted).not.toBe(text)
    expect(encrypted).not.toContain(text)

    const decrypted = decrypt(encrypted)
    expect(decrypted).toBe(text)
  })

  it("每次加密结果应不同（不同 IV）", () => {
    const text = "sk-abc123"
    const e1 = encrypt(text)
    const e2 = encrypt(text)
    expect(e1).not.toBe(e2)
    // 但都能正确解密
    expect(decrypt(e1)).toBe(text)
    expect(decrypt(e2)).toBe(text)
  })

  it("加密长文本应正常工作", () => {
    const text = "sk-" + "x".repeat(100)
    const encrypted = encrypt(text)
    expect(decrypt(encrypted)).toBe(text)
  })

  it("解密无效格式应抛出错误", () => {
    expect(() => decrypt("not-valid")).toThrow("Invalid encrypted data format")
  })

  it("解密被篡改的数据应失败", () => {
    const original = encrypt("my-secret-key")
    // 修改密文
    const parts = original.split(":")
    parts[2] = "tampered" + parts[2]
    expect(() => decrypt(parts.join(":"))).toThrow()
  })

  it("特殊字符应正确加解密", () => {
    const text = "key:with:special!@#$%^&*()chars"
    const encrypted = encrypt(text)
    expect(decrypt(encrypted)).toBe(text)
  })
})
