import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { HomeContent } from "@/components/home-content";

async function getServerSideData() {
  const supabase = createServerComponentClient({ cookies });

  // Fetch shop items with images
  const { data, error } = await supabase
    .from("shop_items")
    .select("images")
    .not("images", "is", null) // Exclude rows where `images` is null
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching shop items:", error);
    return { randomMerchImage: "/placeholder.svg" };
  }

  console.log("Raw Data:", JSON.stringify(data, null, 2)); // Debugging: Log raw data

  // Filter out items with empty image arrays or invalid images
  const itemsWithValidImages = data
    ?.filter((item) => 
      Array.isArray(item.images) && // Ensure `images` is an array
      item.images.length > 0 && // Ensure `images` is not empty
      item.images.some((image) => 
        typeof image === "string" && // Ensure each image is a string
        image.trim() !== "" && // Ensure the string is not empty
        !image.includes("undefined") // Exclude images with "undefined" in the name
      )
    ) || [];

  console.log("Filtered Items:", JSON.stringify(itemsWithValidImages, null, 2)); // Debugging: Log filtered items

  // Flatten all valid images into a single array
  const allValidImages = itemsWithValidImages.flatMap((item) =>
    item.images.filter((image) => 
      typeof image === "string" && // Ensure each image is a string
      image.trim() !== "" && // Ensure the string is not empty
      !image.includes("undefined") // Exclude images with "undefined" in the name
    )
  );

  console.log("All Valid Images:", allValidImages); // Debugging: Log all valid images

  // Select a random image if available, otherwise fallback to placeholder
  const randomMerchImage = allValidImages.length > 0
    ? allValidImages[Math.floor(Math.random() * allValidImages.length)]
    : "/placeholder.svg";

  console.log("Random Merch Image:", randomMerchImage); // Debugging: Log the selected image

  return { randomMerchImage };
}

export default async function Home() {
  const { randomMerchImage } = await getServerSideData();
  console.log(randomMerchImage);
  return <HomeContent randomMerchImage={randomMerchImage} />;
}