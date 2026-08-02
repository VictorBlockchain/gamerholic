import type { NextConfig } from "next";

/**
 * Static export for Internet Computer asset canister (`gh_assets`).
 * Set NEXT_EXPORT=1 (or always for this project) to emit `out/`.
 */
const isExport =
  process.env.NEXT_EXPORT === "1" ||
  process.env.NEXT_EXPORT === "true" ||
  process.env.DFX_NETWORK === "ic";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isExport
    ? {
        output: "export" as const,
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
