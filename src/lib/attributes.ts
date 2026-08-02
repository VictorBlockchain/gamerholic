/**
 * Gamerholic Attribute tokens — equip onto Dexsta XFTs
 * to turn collectibles into battleable “Pokémon-style” fighters.
 */

export type AttributeId =
  | "power"
  | "speed"
  | "attack"
  | "defense"
  | "luck"
  | "focus"
  | "vitality"
  | "crit";

export type AttributeMeta = {
  id: AttributeId;
  name: string;
  short: string;
  color: string;
  blurb: string;
  battle: string;
  /** Token icon (public path) */
  icon: string;
  /** ICRC / canister symbol for on-chain token */
  symbol: string;
};

export const ATTRIBUTES: AttributeMeta[] = [
  {
    id: "power",
    name: "Power",
    short: "PWR",
    color: "#f43fa8",
    blurb: "Raw force behind specials and finishers.",
    battle: "Boosts move damage floor.",
    icon: "/art/attributes/power.svg",
    symbol: "ghPWR",
  },
  {
    id: "speed",
    name: "Speed",
    short: "SPD",
    color: "#22d3ee",
    blurb: "Initiative and dodge windows.",
    battle: "Acts earlier; harder to hit.",
    icon: "/art/attributes/speed.svg",
    symbol: "ghSPD",
  },
  {
    id: "attack",
    name: "Attack",
    short: "ATK",
    color: "#a3ff3d",
    blurb: "Strike strength on every hit.",
    battle: "Raises basic + combo output.",
    icon: "/art/attributes/attack.svg",
    symbol: "ghATK",
  },
  {
    id: "defense",
    name: "Defense",
    short: "DEF",
    color: "#8b5cf6",
    blurb: "Damage reduction and block strength.",
    battle: "Cuts incoming damage.",
    icon: "/art/attributes/defense.svg",
    symbol: "ghDEF",
  },
  {
    id: "luck",
    name: "Luck",
    short: "LCK",
    color: "#fbbf24",
    blurb: "Crit chance and rare proc rates.",
    battle: "RNG tips in your favor.",
    icon: "/art/attributes/luck.svg",
    symbol: "ghLCK",
  },
  {
    id: "focus",
    name: "Focus",
    short: "FCS",
    color: "#38bdf8",
    blurb: "Accuracy and combo continuity.",
    battle: "Fewer whiffs, longer combos.",
    icon: "/art/attributes/focus.svg",
    symbol: "ghFCS",
  },
  {
    id: "vitality",
    name: "Vitality",
    short: "VIT",
    color: "#4ade80",
    blurb: "HP pool and recovery ticks.",
    battle: "Survives longer bouts.",
    icon: "/art/attributes/vitality.svg",
    symbol: "ghVIT",
  },
  {
    id: "crit",
    name: "Crit",
    short: "CRT",
    color: "#fb7185",
    blurb: "Critical multiplier when luck hits.",
    battle: "Big moments hit harder.",
    icon: "/art/attributes/crit.svg",
    symbol: "ghCRT",
  },
];

/**
 * Core battle edges — Tokens As Attributes on Dexsta XFT (NFT 2.0).
 * Flight is a bag/attr role used in aerial duels (maps to equip pipeline later).
 */
export type BattleEdgeId = "power" | "speed" | "flight" | "defense" | "attack";

export const BATTLE_EDGE_ORDER: BattleEdgeId[] = [
  "speed",
  "power",
  "flight",
  "defense",
  "attack",
];

export const BATTLE_EDGE_META: Record<
  BattleEdgeId,
  { name: string; short: string; color: string; token: string }
> = {
  speed: { name: "Speed", short: "SPD", color: "#22d3ee", token: "ghSPD" },
  power: { name: "Power", short: "PWR", color: "#f43fa8", token: "ghPWR" },
  flight: { name: "Flight", short: "FLT", color: "#a78bfa", token: "ghFLT" },
  defense: { name: "Defense", short: "DEF", color: "#8b5cf6", token: "ghDEF" },
  attack: { name: "Attack", short: "ATK", color: "#a3ff3d", token: "ghATK" },
};

export type BattleFighter = {
  name: string;
  xftLabel: string;
  level: number;
  /** Tokens As Attributes bag values on the XFT */
  stats: Partial<Record<AttributeId | BattleEdgeId, number>>;
  element?: string;
  /** NFT portrait art */
  imageUrl?: string;
  tokenId?: number;
};

export const DEMO_FIGHTERS: BattleFighter[] = [
  {
    name: "Neon Fang",
    xftLabel: "Dexsta XFT · Lead AURORA",
    level: 14,
    element: "Volt",
    tokenId: 1204,
    imageUrl: "/art/battle/neon-fang.jpg",
    stats: {
      power: 78,
      speed: 91,
      flight: 84,
      attack: 86,
      defense: 52,
      luck: 40,
      vitality: 65,
    },
  },
  {
    name: "Iron Chorus",
    xftLabel: "Dexsta XFT · Media #42",
    level: 11,
    element: "Stone",
    tokenId: 42,
    imageUrl: "/art/battle/iron-chorus.jpg",
    stats: {
      power: 68,
      speed: 44,
      flight: 38,
      attack: 74,
      defense: 94,
      focus: 55,
      vitality: 80,
    },
  },
];
