/**
 * Compress user-uploaded profile avatars to a square gamer-card image.
 */

import { PROFILE_AVATAR_SIZE } from "@/lib/profile";

const MAX_DATA_URL_CHARS = 450_000;

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

/** Center-crop to square JPEG at PROFILE_AVATAR_SIZE. */
export async function fileToProfileAvatarDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image (JPEG or PNG)");
  }
  if (file.size > 4 * 1024 * 1024) {
    throw new Error("Image too large — use under 4 MB");
  }

  const img = await loadImageFromFile(file);
  const tw = PROFILE_AVATAR_SIZE.width;
  const th = PROFILE_AVATAR_SIZE.height;
  const canvas = document.createElement("canvas");
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  const scale = Math.max(tw / img.naturalWidth, th / img.naturalHeight);
  const sw = tw / scale;
  const sh = th / scale;
  const sx = (img.naturalWidth - sw) / 2;
  const sy = (img.naturalHeight - sh) / 2;
  ctx.fillStyle = "#0b0e14";
  ctx.fillRect(0, 0, tw, th);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, tw, th);

  for (const q of [0.88, 0.78, 0.68, 0.55, 0.45]) {
    const dataUrl = canvas.toDataURL("image/jpeg", q);
    if (dataUrl.length <= MAX_DATA_URL_CHARS) return dataUrl;
  }
  throw new Error("Could not compress avatar — try a simpler image");
}
