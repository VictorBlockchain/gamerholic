import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { HomeContent } from "@/components/home-content"

async function getServerSideData() {
  const supabase = createServerComponentClient({ cookies })

  // Fetch a random merchandise image
  const { data, error } = await supabase
    .from("shop_items")
    .select("images")
    .not("images", "is", null)
    .order("created_at", { ascending: false })
    .limit(10)

  if (error) {
    return { randomMerchImage: "/placeholder.svg" }
  }

  // Filter out items with empty image arrays
  const itemsWithImages = data?.filter((item) => item.images && item.images.length > 0) || []

  if (itemsWithImages.length === 0) {
    return { randomMerchImage: "/placeholder.svg" }
  }

  // Select a random item
  const randomItem = itemsWithImages[Math.floor(Math.random() * itemsWithImages.length)]

  // Select a random image from the item's images array
  const randomImage = randomItem.images[Math.floor(Math.random() * randomItem.images.length)]

  return {
    randomMerchImage: randomImage || "/placeholder.svg",
  }
}

export default async function Home() {
  const { randomMerchImage } = await getServerSideData()

  return <HomeContent randomMerchImage={randomMerchImage} />
}

