/**
 * Brand mark — power-G app icon (raster only).
 * Electric lime + prize/attr neon on night purple (matches theme).
 */
export const BRAND = {
  mark: "/brand/gamerholic-mark.jpg",
  mark32: "/brand/gamerholic-mark-32.jpg",
  mark64: "/brand/gamerholic-mark-64.jpg",
  mark128: "/brand/gamerholic-mark-128.jpg",
  mark256: "/brand/gamerholic-mark-256.jpg",
} as const;

/** Game identity art in /public/art */
export const ART = {
  /** Cinematic arena key art */
  hero: "/art/hero-arena.jpg",
  /** Host booth (cinematic) */
  host: "/art/host-booth.jpg",
  /** Realistic arcade cabinet */
  arcade: "/art/arcade-cabinet.jpg",
  /** XFT creature battle splash */
  battle: "/art/xft-battle.jpg",
  /** Gear + ICP product still */
  gear: "/art/gear-icp.jpg",
  /** Chibi — 1v1 heads-up money match */
  headsUp: "/art/chibi-heads-up.jpg",
  /** Chibi — friends around arcade */
  arcadeFriends: "/art/chibi-arcade-friends.jpg",
  /** Chibi — team high-five victory lounge */
  teamHighfive: "/art/chibi-team-highfive.jpg",
  /** Chibi — squad trophy celebration */
  teamWin: "/art/chibi-team-win.jpg",
} as const;

/**
 * Arcade cabinet cover presets — Gamerholic octopus mascot, **1280×720 (16:9)**.
 * Catalog cards crop ~16:11; play hero uses the full wide frame.
 */
export const ARCADE_COVER_PRESETS = [
  {
    id: "neon-cabinet",
    label: "Neon cabinet",
    src: "/art/arcade-covers/neon-cabinet.jpg",
  },
  {
    id: "prize-crown",
    label: "Prize crown",
    src: "/art/arcade-covers/prize-crown.jpg",
  },
  {
    id: "volt-arena",
    label: "Volt arena",
    src: "/art/arcade-covers/volt-arena.jpg",
  },
  {
    id: "cyan-live",
    label: "Cyan live",
    src: "/art/arcade-covers/cyan-live.jpg",
  },
  {
    id: "attr-chamber",
    label: "Attr chamber",
    src: "/art/arcade-covers/attr-chamber.jpg",
  },
] as const;

/** Default cover for new cabinets */
export const ARCADE_COVER_DEFAULT = ARCADE_COVER_PRESETS[0].src;

/** Recommended upload dimensions for arcade covers */
export const ARCADE_COVER_SIZE = {
  width: 1280,
  height: 720,
  aspect: "16:9",
  label: "1280 × 720 (16:9)",
} as const;
