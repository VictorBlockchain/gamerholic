/**
 * Upload product images to Supabase Storage bucket `gh-shop`.
 * Public read URLs for storefront; requires bucket + policies (see migration).
 */

import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";

export const SHOP_BUCKET = "gh-shop";

function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/**
 * Upload a File; returns public URL or throws.
 */
export async function uploadShopImage(
  file: File,
  opts?: { productId?: string; folder?: string },
): Promise<string> {
  if (!file || !file.type.startsWith("image/")) {
    throw new Error("Choose an image file");
  }
  if (file.size > 6 * 1024 * 1024) {
    throw new Error("Image must be under 6MB");
  }

  const sb = getSupabase();
  if (!sb || !isSupabaseConfigured()) {
    throw new Error(
      "Supabase not configured (NEXT_PUBLIC_SUPABASE_URL + ANON_KEY)",
    );
  }

  const ext =
    file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "jpg";
  const folder = opts?.folder || opts?.productId || "uploads";
  const path = `${folder}/${Date.now().toString(36)}-${sanitizeFileName(file.name.replace(/\.[^.]+$/, ""))}.${ext}`;

  const { error } = await sb.storage.from(SHOP_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/jpeg",
  });

  if (error) {
    throw new Error(error.message || "Upload failed");
  }

  const { data } = sb.storage.from(SHOP_BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new Error("Upload ok but public URL missing");
  }
  return data.publicUrl;
}

export async function uploadShopImages(
  files: FileList | File[],
  opts?: { productId?: string },
): Promise<string[]> {
  const list = Array.from(files);
  const urls: string[] = [];
  for (const f of list) {
    urls.push(await uploadShopImage(f, opts));
  }
  return urls;
}
