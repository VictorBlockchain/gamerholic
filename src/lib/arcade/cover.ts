/**
 * Arcade cabinet cover helpers.
 * Covers are stored on the game row as `image_url` (preset path or compressed data URL).
 */

import {
  ARCADE_COVER_DEFAULT,
  ARCADE_COVER_PRESETS,
  ARCADE_COVER_SIZE,
} from "@/lib/art";

/** Max data-URL length we attempt to persist in Supabase `image_url` text. */
export const ARCADE_COVER_DATA_URL_MAX_CHARS = 900_000;

export function isArcadePresetCover(url: string | null | undefined): boolean {
  if (!url) return false;
  return ARCADE_COVER_PRESETS.some((p) => p.src === url);
}

/**
 * Resolve the cover to show for a cabinet.
 * Prefer the saved `imageUrl` (preset path or uploaded data/https URL).
 */
export function resolveArcadeCoverUrl(
  imageUrl: string | null | undefined,
): string {
  const u = (imageUrl || "").trim();
  if (u) return u;
  return ARCADE_COVER_DEFAULT;
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}

/**
 * Resize + JPEG-compress a user upload to the recommended arcade cover size.
 * Returns a data URL suitable for `gh_arcade_games.image_url`.
 */
export async function fileToArcadeCoverDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image (JPEG or PNG)");
  }
  // ~2.5 MB raw is plenty before canvas compress
  if (file.size > 4 * 1024 * 1024) {
    throw new Error("Image too large — use under 4 MB (we compress to 1280×720)");
  }

  const img = await loadImageFromFile(file);
  const tw = ARCADE_COVER_SIZE.width;
  const th = ARCADE_COVER_SIZE.height;
  const canvas = document.createElement("canvas");
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  // cover-fit (center crop)
  const scale = Math.max(tw / img.naturalWidth, th / img.naturalHeight);
  const sw = tw / scale;
  const sh = th / scale;
  const sx = (img.naturalWidth - sw) / 2;
  const sy = (img.naturalHeight - sh) / 2;
  ctx.fillStyle = "#0b0e14";
  ctx.fillRect(0, 0, tw, th);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, tw, th);

  // Step quality down until under max chars
  for (const q of [0.85, 0.75, 0.65, 0.55, 0.45]) {
    const dataUrl = canvas.toDataURL("image/jpeg", q);
    if (dataUrl.length <= ARCADE_COVER_DATA_URL_MAX_CHARS) {
      return dataUrl;
    }
  }
  throw new Error(
    "Could not compress cover under size limit — try a simpler image",
  );
}

/** Reject covers that will not survive Supabase persist. */
export function assertCoverPersistable(imageUrl: string): void {
  const u = (imageUrl || "").trim();
  if (!u) {
    throw new Error("Cover image required");
  }
  if (u.startsWith("data:") && u.length > ARCADE_COVER_DATA_URL_MAX_CHARS) {
    throw new Error(
      "Cover image still too large after compress — pick a smaller file or a preset",
    );
  }
  // blob: is session-only and must never be saved
  if (u.startsWith("blob:")) {
    throw new Error("Invalid cover — re-upload the image");
  }
}
