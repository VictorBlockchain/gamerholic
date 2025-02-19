// import "server-only"
import crypto from "crypto"

const IV_LENGTH = 16

export class CryptoManager {
  private static ENCRYPTION_KEY: Buffer

  static initialize() {
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

  static encrypt(text: string): { iv: string; encrypted: string } {
    if (!this.ENCRYPTION_KEY) {
      throw new Error("Encryption key is not initialized. Call CryptoManager.initialize() first.")
    }

    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv("aes-256-cbc", this.ENCRYPTION_KEY, iv)
    let encrypted = cipher.update(text, "utf8")
    encrypted = Buffer.concat([encrypted, cipher.final()])
    return { iv: iv.toString("hex"), encrypted: encrypted.toString("hex") }
  }

  static decrypt(encrypted: string, iv: string): string {
    if (!this.ENCRYPTION_KEY) {
      throw new Error("Encryption key is not initialized. Call CryptoManager.initialize() first.")
    }

    const ivBuffer = Buffer.from(iv, "hex")
    const encryptedBuffer = Buffer.from(encrypted, "hex")
    const decipher = crypto.createDecipheriv("aes-256-cbc", this.ENCRYPTION_KEY, ivBuffer)
    let decrypted = decipher.update(encryptedBuffer)
    decrypted = Buffer.concat([decrypted, decipher.final()])
    return decrypted.toString("utf8")
  }
}

// Initialize the encryption key when the module is loaded
CryptoManager.initialize()