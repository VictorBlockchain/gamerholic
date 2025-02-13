import { NextResponse } from "next/server"
import { cryptoManager } from "@/lib/server/cryptoManager"

export async function POST(req: Request) {
  try {
    const { action, data, iv } = await req.json()

    if (action === "encrypt") {
      const { iv, encrypted } = cryptoManager.encrypt(data)
      return NextResponse.json({ success: true, iv, encrypted })
    } else if (action === "decrypt") {
      const decrypted = cryptoManager.decrypt(data, iv)
      return NextResponse.json({ success: true, decrypted })
    } else {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Crypto operation failed:", error)
    return NextResponse.json({ success: false, error: "Crypto operation failed" }, { status: 500 })
  }
}

