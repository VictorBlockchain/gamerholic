/**
 * Yoinx embed client (production).
 *
 * Gamerholic is often static-exported (IC assets) → no server secrets on GH.
 * Auth model:
 *   - NEXT_PUBLIC_YOINX_SITE_KEY  (publishable, like Stripe pk_)
 *   - NEXT_PUBLIC_YOINX_BUSINESS_ID
 * Yoinx maps site key → business_id + origin allowlist (server env).
 *
 * POST {YOINX_API}/api/create/embed
 * Header: X-Yoinx-Site-Key
 */

export const YOINX_USD_PER_TOOL = 0.1;

function adminOverride(): {
  apiUrl?: string;
  appUrl?: string;
  siteKey?: string;
  businessId?: string;
} {
  if (typeof window === "undefined") return {};
  try {
    // Lazy import avoided — read same key as yoinx-settings
    const raw = localStorage.getItem("gh_shop_yoinx_settings_v1");
    if (!raw) return {};
    return JSON.parse(raw) as {
      apiUrl?: string;
      appUrl?: string;
      siteKey?: string;
      businessId?: string;
    };
  } catch {
    return {};
  }
}

export function getYoinxApiBase(): string {
  const o = adminOverride();
  const raw =
    o.apiUrl ||
    process.env.NEXT_PUBLIC_YOINX_API_URL ||
    process.env.NEXT_PUBLIC_YOINX_URL ||
    "https://yoinx.fun";
  return raw.replace(/\/$/, "").trim();
}

export function getYoinxAppBase(): string {
  const o = adminOverride();
  const raw =
    o.appUrl ||
    process.env.NEXT_PUBLIC_YOINX_APP_URL ||
    process.env.NEXT_PUBLIC_YOINX_URL ||
    "https://yoinx.fun";
  return raw.replace(/\/$/, "").trim();
}

/** Publishable embed site key (admin override or env). */
export function getYoinxSiteKey(): string {
  const o = adminOverride();
  return (o.siteKey || process.env.NEXT_PUBLIC_YOINX_SITE_KEY || "").trim();
}

/** Yoinx businesses.id for this merchant (admin override or env). */
export function getYoinxBusinessId(): string {
  const o = adminOverride();
  return (
    o.businessId ||
    process.env.NEXT_PUBLIC_YOINX_BUSINESS_ID ||
    ""
  ).trim();
}

export function yoinxPlayHref(gameId: string): string {
  const id = encodeURIComponent(String(gameId || "").trim());
  return `${getYoinxAppBase()}/play/?id=${id}`;
}

export function randomMinPlayers(min = 5, max = 25): number {
  const lo = Math.max(2, Math.floor(min));
  const hi = Math.max(lo, Math.floor(max));
  return lo + Math.floor(Math.random() * (hi - lo + 1));
}

/** entryYoinx so entry × min × $0.10 ≈ item USD (Yoinx create wizard). */
export function entryYoinxForProduct(
  priceUsd: number,
  minPlayers: number,
): number {
  const n = Math.max(1, minPlayers);
  const p = Math.max(0, priceUsd);
  return Math.max(1, Math.ceil(p / YOINX_USD_PER_TOOL / n));
}

export function entryIcpEstimate(
  productIcp: number,
  minPlayers: number,
): number {
  const n = Math.max(1, minPlayers);
  return Math.max(0, productIcp / n);
}

export type CreateYoinxItemTableInput = {
  principal: string;
  title: string;
  story: string;
  itemName: string;
  itemPriceUsd: number;
  minPlayers: number;
  entryYoinx: number;
  images: string[];
  entryFeeIcp?: number;
};

export type CreateYoinxItemTableResult =
  | {
      ok: true;
      id: string;
      playUrl: string;
      businessId?: string;
      businessName?: string;
    }
  | { ok: false; error: string };

export function embedConfigured(): boolean {
  return Boolean(getYoinxSiteKey() && getYoinxBusinessId());
}

/**
 * Create a Yoinx physical item table attributed to the partner business.
 */
export async function createYoinxItemTable(
  input: CreateYoinxItemTableInput,
): Promise<CreateYoinxItemTableResult> {
  const principal = String(input.principal || "").trim();
  if (!principal) {
    return { ok: false, error: "Connect wallet to create a Yoinx table" };
  }
  const itemName = String(input.itemName || input.title || "").trim();
  if (!itemName) {
    return { ok: false, error: "Product name required" };
  }

  const siteKey = getYoinxSiteKey();
  const businessId = getYoinxBusinessId();
  if (!siteKey || !businessId) {
    return {
      ok: false,
      error:
        "Yoinx embed not configured (NEXT_PUBLIC_YOINX_SITE_KEY + NEXT_PUBLIC_YOINX_BUSINESS_ID)",
    };
  }

  const minPlayers = Math.max(2, Math.min(25, Math.floor(input.minPlayers || 5)));
  const entryYoinx = Math.max(1, Math.round(input.entryYoinx || 1));
  const images = (input.images || []).filter(Boolean).slice(0, 5);
  if (!images.length) {
    return {
      ok: false,
      error: "Product needs at least one image for the Yoinx prize table",
    };
  }

  const base = getYoinxApiBase();
  const url = `${base}/api/create/embed`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Yoinx-Site-Key": siteKey,
      },
      credentials: "omit",
      body: JSON.stringify({
        principal,
        businessId,
        title: input.title.trim() || itemName,
        itemName,
        itemDescription: input.story.trim() || undefined,
        itemPriceUsd: input.itemPriceUsd,
        minPlayers,
        maxPlayers: 25,
        entryYoinx,
        gameImages: images,
        bestOf: 1,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      id?: string;
      error?: string;
      businessId?: string;
      businessName?: string;
    };

    if (!res.ok || !data.id) {
      return {
        ok: false,
        error:
          data.error ||
          `Yoinx embed create failed (${res.status}). Check site key, business id, CORS origins on Yoinx.`,
      };
    }

    return {
      ok: true,
      id: data.id,
      playUrl: yoinxPlayHref(data.id),
      businessId: data.businessId || businessId,
      businessName: data.businessName,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    return {
      ok: false,
      error: `${msg}. Is Yoinx API at ${base} running and CORS-enabled?`,
    };
  }
}

export function absoluteProductImage(
  src: string,
  origin?: string,
): string {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("data:")) return src;
  const o =
    origin ||
    (typeof window !== "undefined" ? window.location.origin : "") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "";
  if (!o) return src;
  return `${o.replace(/\/$/, "")}${src.startsWith("/") ? src : `/${src}`}`;
}
