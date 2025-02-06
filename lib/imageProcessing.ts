import sharp from "sharp"

const MAX_IMAGE_SIZE = 1024 * 1024 // 1MB
const THUMBNAIL_WIDTH = 350
const THUMBNAIL_HEIGHT = 200

export async function processGameImage(file: File): Promise<{ thumbnail: Buffer; fullSize: Buffer }> {
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(`Image size exceeds the maximum allowed size of ${MAX_IMAGE_SIZE / 1024 / 1024}MB`)
  }

  const buffer = await file.arrayBuffer()

  // Create a thumbnail
  const thumbnail = await sharp(buffer).resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, { fit: "cover" }).toBuffer()

  // Resize full image if it's too large
  const fullSize = await sharp(buffer).resize(1920, 1080, { fit: "inside", withoutEnlargement: true }).toBuffer()

  return { thumbnail, fullSize }
}

