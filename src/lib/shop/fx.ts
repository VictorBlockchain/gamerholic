/**
 * USD → ICP via CoinGecko free API (cached).
 */

const CACHE_KEY = "gh_shop_icp_usd_v1";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min
const FALLBACK_USD_PER_ICP = 8; // conservative fallback if API down

type Cache = { rate: number; at: number };

function readCache(): Cache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Cache;
    if (!c.rate || !c.at) return null;
    if (Date.now() - c.at > CACHE_TTL_MS) return null;
    return c;
  } catch {
    return null;
  }
}

function writeCache(rate: number) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ rate, at: Date.now() } satisfies Cache),
    );
  } catch {
    /* ignore */
  }
}

/** USD per 1 ICP */
export async function fetchIcpUsdRate(): Promise<number> {
  const hit = readCache();
  if (hit) return hit.rate;

  const fallbackEnv = Number(
    process.env.NEXT_PUBLIC_ICP_USD_FALLBACK || FALLBACK_USD_PER_ICP,
  );
  const fallback =
    Number.isFinite(fallbackEnv) && fallbackEnv > 0
      ? fallbackEnv
      : FALLBACK_USD_PER_ICP;

  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=internet-computer&vs_currencies=usd",
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) throw new Error(`coingecko ${res.status}`);
    const data = (await res.json()) as {
      "internet-computer"?: { usd?: number };
    };
    const rate = data["internet-computer"]?.usd;
    if (!rate || !Number.isFinite(rate) || rate <= 0) throw new Error("bad rate");
    writeCache(rate);
    return rate;
  } catch {
    writeCache(fallback);
    return fallback;
  }
}

export function usdToIcp(usd: number, usdPerIcp: number): number {
  if (!usdPerIcp || usdPerIcp <= 0 || !Number.isFinite(usd)) return 0;
  return usd / usdPerIcp;
}

export function formatIcp(n: number, digits = 3): string {
  if (!Number.isFinite(n)) return "— ICP";
  return `${n.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: n < 1 ? digits : 2,
  })} ICP`;
}
