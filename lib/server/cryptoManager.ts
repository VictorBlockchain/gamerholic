// import "server-only"
import crypto from "crypto"

const IV_LENGTH = 16

export class CryptoManager {
  private ENCRYPTION_KEY: Buffer

  constructor() {
    if (typeof window !== "undefined") {
      throw new Error("CryptoManager should only be used on the server-side")
    }
    if (!process.env.ENCRYPTION_KEY) {
      this.ENCRYPTION_KEY = crypto.randomBytes(32) // 256-bit key
      console.log("Generated ENCRYPTION_KEY:", this.ENCRYPTION_KEY.toString("hex"))
    } else {
      this.ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, "hex")
    }
  }

  encrypt(text: string): { iv: string; encrypted: string } {
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv("aes-256-cbc", this.ENCRYPTION_KEY, iv)
    let encrypted = cipher.update(text, "utf8")
    encrypted = Buffer.concat([encrypted, cipher.final()])
    return { iv: iv.toString("hex"), encrypted: encrypted.toString("hex") }
  }

  decrypt(encrypted: string, iv: string): string {
    const ivBuffer = Buffer.from(iv, "hex")
    const encryptedBuffer = Buffer.from(encrypted, "hex")
    const decipher = crypto.createDecipheriv("aes-256-cbc", this.ENCRYPTION_KEY, ivBuffer)
    let decrypted = decipher.update(encryptedBuffer)
    decrypted = Buffer.concat([decrypted, decipher.final()])
    return decrypted.toString("utf8")
  }
}

