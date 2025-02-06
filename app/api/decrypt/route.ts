import { NextResponse } from "next/server"
import crypto from "crypto"

const IV_LENGTH = 16 // AES block size

class CryptoManager {
  private ENCRYPTION_KEY: Buffer

  constructor() {
    if (!process.env.ENCRYPTION_KEY) {
      throw new Error("ENCRYPTION_KEY is not set in environment variables")
    }
    this.ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, "hex")
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

const cryptoManager = new CryptoManager()

export async function POST(req: Request) {
  try {
    const { encrypted, iv } = await req.json()

    if (!encrypted || !iv) {
      return NextResponse.json({ error: "Missing encrypted data or IV" }, { status: 400 })
    }

    const decrypted = cryptoManager.decrypt(encrypted, iv)

    return NextResponse.json({ success: true, decrypted })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Failed to decrypt data" }, { status: 500 })
  }
}

