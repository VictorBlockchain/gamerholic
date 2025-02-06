import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { processGameImage } from "@/lib/imageProcessing"
import { validateGameCode } from "@/lib/codeValidation"

export async function POST(request: Request) {
  const formData = await request.formData()
  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const playFee = Number.parseFloat(formData.get("playFee") as string)
  const topPayout = Number.parseInt(formData.get("topPayout") as string)
  const category = formData.get("category") as string
  const rules = formData.get("rules") as string
  const gameCode = formData.get("gameCode") as string
  const gameCss = formData.get("gameCss") as string
  const creatorWallet = formData.get("creatorWallet") as string
  const image = formData.get("image") as File | null

  const supabase = createRouteHandlerClient({ cookies })

  try {
    // Validate game code
    const validation = validateGameCode(gameCode)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    let imageUrl = null
    if (image) {
      const { thumbnail, fullSize } = await processGameImage(image)

      // Upload thumbnail
      const { data: thumbnailData, error: thumbnailError } = await supabase.storage
        .from("game-images")
        .upload(`thumbnails/${Date.now()}-thumbnail.webp`, thumbnail, { contentType: "image/webp" })

      if (thumbnailError) throw thumbnailError

      // Upload full-size image
      const { data: fullSizeData, error: fullSizeError } = await supabase.storage
        .from("game-images")
        .upload(`full-size/${Date.now()}-full.webp`, fullSize, { contentType: "image/webp" })

      if (fullSizeError) throw fullSizeError

      imageUrl = supabase.storage.from("game-images").getPublicUrl(fullSizeData.path).data.publicUrl
    }

    // Insert the new game
    const { data: gameData, error: gameError } = await supabase
      .from("games")
      .insert([
        {
          title,
          description,
          play_fee: playFee,
          top_payout: topPayout,
          category,
          rules,
          game_code: gameCode,
          game_css: gameCss,
          creator_wallet: creatorWallet,
          image_url: imageUrl,
          status: "pending_test",
        },
      ])
      .select()

    if (gameError) throw gameError

    // Handle the game creation payment
    const { error: paymentError } = await supabase.rpc("handle_game_creation_payment", {
      p_game_id: gameData[0].id,
      p_total_amount: playFee, // Assuming the play fee is the creation fee
    })

    if (paymentError) throw paymentError

    return NextResponse.json({ success: true, gameId: gameData[0].id })
  } catch (error) {
    console.error("Error creating game:", error)
    return NextResponse.json({ error: "Failed to create game" }, { status: 500 })
  }
}

