import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

const ENCRYPTION_KEY = process.env.SCORE_ENCRYPTION_KEY || randomBytes(32)
const IV_LENGTH = 16

export function encryptScore(score: number): string {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv)
  let encrypted = cipher.update(score.toString(), "utf8", "hex")
  encrypted += cipher.final("hex")
  return iv.toString("hex") + ":" + encrypted
}

export function decryptScore(encryptedScore: string): number {
  const [ivHex, encryptedHex] = encryptedScore.split(":")
  const iv = Buffer.from(ivHex, "hex")
  const decipher = createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv)
  let decrypted = decipher.update(encryptedHex, "hex", "utf8")
  decrypted += decipher.final("utf8")
  return Number.parseInt(decrypted, 10)
}

