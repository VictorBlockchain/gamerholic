/**
 * Gamerholic official merch shop — products, cart, orders.
 * Not multi-vendor; admin-managed catalog only.
 */

export type ShopCategory =
  | "apparel"
  | "controllers"
  | "electronics"
  | "peripherals"
  | "lifestyle"
  | "accessories";

export const SHOP_CATEGORIES: {
  id: ShopCategory;
  label: string;
  blurb: string;
}[] = [
  { id: "apparel", label: "Apparel", blurb: "Tees, hoodies, hats" },
  { id: "controllers", label: "Controllers", blurb: "Pads, stands, kits" },
  { id: "electronics", label: "Electronics", blurb: "Docks, capture, gear" },
  { id: "peripherals", label: "Peripherals", blurb: "Headset, KB/M, pads" },
  { id: "lifestyle", label: "Lifestyle", blurb: "Stickers, posters, desk" },
  { id: "accessories", label: "Accessories", blurb: "Cables, cases, stands" },
];

export type ShopProductVariant = {
  name: string;
  options: string[];
};

/** Masonry / lookbook aspect hint */
export type ShopProductAspect = "tall" | "square" | "wide";

export type ShopProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: ShopCategory;
  priceUsd: number;
  compareAtUsd?: number;
  images: string[];
  variants?: ShopProductVariant[];
  stock: number;
  sku?: string;
  supplierUrl?: string;
  supplierNote?: string;
  published: boolean;
  featured?: boolean;
  /** tall | square | wide — fashion masonry */
  aspect?: ShopProductAspect;
  /** Printer pack — admin only in UI */
  printAssetUrl?: string;
  printFontFamily?: string;
  printFontUrl?: string;
  printText?: string;
  printNotes?: string;
  createdAt: string;
  updatedAt: string;
};

export type CartLine = {
  productId: string;
  qty: number;
  variantLabel?: string;
};

export type ShopOrderStatus =
  | "pending"
  | "paid"
  | "ordered"
  | "shipped"
  | "delivered"
  | "cancelled";

export const ORDER_STATUSES: ShopOrderStatus[] = [
  "pending",
  "paid",
  "ordered",
  "shipped",
  "delivered",
  "cancelled",
];

export type ShopOrderItem = {
  productId: string;
  name: string;
  qty: number;
  unitPriceUsd: number;
  variantLabel?: string;
  image?: string;
};

export type ShopShipping = {
  name: string;
  email: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postal: string;
  country: string;
  phone?: string;
};

export type ShopOrder = {
  id: string;
  userPrincipal?: string;
  username?: string;
  shipping: ShopShipping;
  items: ShopOrderItem[];
  status: ShopOrderStatus;
  totalUsd: number;
  /** CoinGecko snapshot at checkout (optional) */
  totalIcpEstimate?: number;
  icpUsdRate?: number;
  /** On-chain debit from play subaccount succeeded */
  paidFromPlaySub?: boolean;
  paymentNote?: string;
  notes?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
};

export type ShopSettings = {
  enabled: boolean;
  bannerTitle: string;
  bannerBody: string;
  shippingBlurb: string;
  currencyLabel: string;
};

export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  enabled: true,
  bannerTitle: "Gamerholic Merch",
  bannerBody:
    "Official Gamer & Gamerholic apparel — classic wordmarks to if-you-know-you-know arena lines.",
  shippingBlurb:
    "Orders are fulfilled after payment confirmation. Shipping times vary by region and supplier.",
  currencyLabel: "USD",
};

/** Standard blank options for apparel product copy */
export const FABRIC = {
  teeCore:
    "Fabric: 100% combed ring-spun cotton, ~6.1 oz (180 gsm), pre-shrunk jersey. Side-seamed, shoulder-to-shoulder tape, tear-away label. Soft hand; holds print. Wash cold, tumble low or hang dry.",
  teePremium:
    "Fabric: 100% organic combed cotton, ~6.5 oz (200 gsm), garment-washed for broken-in feel. Side-seamed, reinforced collar, tear-away label. Wash cold, hang dry for longevity.",
  teeHeavy:
    "Fabric: 100% cotton heavyweight jersey, ~7.5 oz (220 gsm). Boxy cut, structured drape, reinforced neck. Built for thrash + still looks clean. Wash cold inside-out.",
  hoodieCore:
    "Fabric: 80/20 cotton-poly midweight fleece, ~8.5 oz (280 gsm), brushed interior. Double-lined hood, metal eyelets, kangaroo pocket, rib cuffs & hem. Pill-resistant face for clean prints.",
  hoodieHeavy:
    "Fabric: 80/20 cotton-poly heavy fleece, ~12–14 oz (350–400 gsm), dense brush. Double-lined hood with matching drawcords, pouch pocket, rib trim. Tournament-night warmth.",
  hoodieFrench:
    "Fabric: 100% cotton French terry, ~10 oz (320 gsm), loopback interior, smooth face. Unbrushed luxury hand, structured drape, metal eyelets. Premium soft-hand print surface.",
  hoodieZip:
    "Fabric: 80/20 cotton-poly fleece, ~9 oz (300 gsm), full YKK-style zip, brushed lining, dual pouch or welt pockets, rib cuffs. Durable face fabric for chest + sleeve hits.",
} as const;

export function categoryLabel(c: ShopCategory): string {
  return SHOP_CATEGORIES.find((x) => x.id === c)?.label ?? c;
}

export function orderStatusLabel(s: ShopOrderStatus): string {
  const map: Record<ShopOrderStatus, string> = {
    pending: "Pending",
    paid: "Paid",
    ordered: "Ordered (supplier)",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };
  return map[s] ?? s;
}

export function formatUsd(n: number): string {
  if (!Number.isFinite(n)) return "$0";
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}
