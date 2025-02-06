import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Game ID is required" }, { status: 400 })
  }

  try {
    const filePath = path.join(process.cwd(), "public", "games", `${id}.js`)
    const gameCode = fs.readFileSync(filePath, "utf8")

    return NextResponse.json({ success: true, gameCode })
  } catch (error) {
    console.error("Error reading game code:", error)
    return NextResponse.json({ error: "Failed to read game code" }, { status: 500 })
  }
}

