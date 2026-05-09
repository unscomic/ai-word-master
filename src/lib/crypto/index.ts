import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"

function getKey(): Buffer {
  const secret = process.env.AUTH_SECRET || "fallback-dev-key-32chars!!"
  return crypto.scryptSync(secret, "salt", 32)
}

export function encrypt(text: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(text, "utf8", "hex")
  encrypted += cipher.final("hex")
  const tag = cipher.getAuthTag()

  // iv:tag:ciphertext
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`
}

export function decrypt(encrypted: string): string {
  const key = getKey()
  const [ivHex, tagHex, cipherText] = encrypted.split(":")
  if (!ivHex || !tagHex || !cipherText) {
    throw new Error("Invalid encrypted data format")
  }

  const iv = Buffer.from(ivHex, "hex")
  const tag = Buffer.from(tagHex, "hex")
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  let decrypted = decipher.update(cipherText, "hex", "utf8")
  decrypted += decipher.final("utf8")
  return decrypted
}
