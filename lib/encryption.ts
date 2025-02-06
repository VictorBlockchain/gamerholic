import crypto from "crypto"

const ALGORITHM = "aes-256-cbc"

// Ensure ENCRYPTION_KEY is a 32-byte hexadecimal string in your .env.local file
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, "hex")

export async function encrypt(data: Uint8Array | string): Promise<{ encryptedKey: string; iv: string }> {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv)

  let encrypted = cipher.update(Buffer.from(data))
  encrypted = Buffer.concat([encrypted, cipher.final()])

  return { encryptedKey: encrypted.toString("hex"), iv: iv.toString("hex") }
}

export async function decrypt(encryptedKey: string, iv: string): Promise<string> {
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, Buffer.from(iv, "hex"))

  let decrypted = decipher.update(Buffer.from(encryptedKey, "hex"))
  decrypted = Buffer.concat([decrypted, decipher.final()])

  return decrypted.toString("base64") // Return base64 encoded private key
}

