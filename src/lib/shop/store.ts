/**
 * Shop store — products load from Supabase only (no mock seed).
 * Orders remain local until order RPC is wired; settings prefer DB.
 */

import {
  deleteShopProductsDb,
  fetchAdminProducts,
  fetchProduct,
  fetchPublishedProducts,
  fetchShopSettingsDb,
  upsertShopProductDb,
} from "./db";
import {
  DEFAULT_SHOP_SETTINGS,
  slugify,
  type ShopOrder,
  type ShopOrderStatus,
  type ShopProduct,
  type ShopSettings,
} from "./types";

const ORDERS_KEY = "gh_shop_orders_v1";
const SETTINGS_KEY = "gh_shop_settings_v1";

/** Legacy local catalog keys — wiped so mock gear never reappears */
const LEGACY_PRODUCT_KEYS = [
  "gh_shop_products_v1",
  "gh_shop_products_v2",
  "gh_shop_products_v3",
  "gh_shop_products_v4",
  "gh_shop_products_v5",
  "gh_shop_catalog_gen",
];

let productCache: ShopProduct[] = [];
let cacheReady = false;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

/** Drop any old mock catalog keys from this browser. */
export function clearLegacyProductStorage() {
  if (typeof window === "undefined") return;
  for (const k of LEGACY_PRODUCT_KEYS) {
    try {
      window.localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  }
}

function setCache(list: ShopProduct[]) {
  productCache = list;
  cacheReady = true;
}

function patchCacheProduct(p: ShopProduct) {
  const i = productCache.findIndex((x) => x.id === p.id);
  if (i >= 0) productCache[i] = p;
  else productCache.unshift(p);
  cacheReady = true;
}

function removeFromCache(ids: string[]) {
  const set = new Set(ids);
  productCache = productCache.filter((p) => !set.has(p.id));
}

/**
 * Load published products from DB into cache (storefront).
 */
export async function loadPublishedCatalog(opts?: {
  category?: string;
}): Promise<ShopProduct[]> {
  clearLegacyProductStorage();
  const list = await fetchPublishedProducts(opts);
  setCache(list);
  return list;
}

/**
 * Load full catalog for admin (drafts + print fields when RPC allows).
 */
export async function loadAdminCatalog(
  callerPrincipal: string,
): Promise<{ products: ShopProduct[]; error?: string }> {
  clearLegacyProductStorage();
  const res = await fetchAdminProducts(callerPrincipal);
  setCache(res.products);
  return res;
}

/**
 * Ensure a single product is in cache (product page / cart hydration).
 */
export async function ensureProduct(
  idOrSlug: string,
): Promise<ShopProduct | null> {
  const hit =
    productCache.find(
      (p) => p.id === idOrSlug || p.slug === idOrSlug,
    ) ?? null;
  if (hit) return hit;
  const p = await fetchProduct(idOrSlug);
  if (p) patchCacheProduct(p);
  return p;
}

/** Sync list from in-memory cache only (never seeds). */
export function listProducts(opts?: {
  publishedOnly?: boolean;
  category?: string;
}): ShopProduct[] {
  let list = [...productCache];
  if (opts?.publishedOnly) list = list.filter((p) => p.published);
  if (opts?.category) list = list.filter((p) => p.category === opts.category);
  return list.sort(
    (a, b) =>
      Number(Boolean(b.featured)) - Number(Boolean(a.featured)) ||
      a.name.localeCompare(b.name),
  );
}

export function isCatalogLoaded(): boolean {
  return cacheReady;
}

export function getProduct(idOrSlug: string): ShopProduct | null {
  return (
    productCache.find(
      (p) => p.id === idOrSlug || p.slug === idOrSlug,
    ) ?? null
  );
}

/**
 * Persist product to Supabase. Requires platform admin principal.
 */
export async function saveProductAsync(
  product: ShopProduct,
  callerPrincipal: string,
): Promise<{ ok: boolean; product?: ShopProduct; error?: string }> {
  const res = await upsertShopProductDb(callerPrincipal, product);
  if (res.ok && res.product) {
    patchCacheProduct(res.product);
  }
  return res;
}

/** @deprecated use saveProductAsync — kept for compile safety; no-ops without DB */
export function saveProduct(product: ShopProduct): ShopProduct {
  const now = new Date().toISOString();
  const next: ShopProduct = {
    ...product,
    slug: product.slug || slugify(product.name),
    images: (product.images || []).filter(Boolean),
    updatedAt: now,
    createdAt: product.createdAt || now,
  };
  patchCacheProduct(next);
  console.warn(
    "[shop] saveProduct sync is cache-only — use saveProductAsync with admin principal",
  );
  return next;
}

export async function deleteProductsAsync(
  ids: string[],
  callerPrincipal: string,
): Promise<{ ok: boolean; deleted: number; error?: string }> {
  const res = await deleteShopProductsDb(callerPrincipal, ids);
  if (res.ok) removeFromCache(ids);
  return res;
}

export function deleteProduct(id: string): boolean {
  removeFromCache([id]);
  return true;
}

export function deleteProducts(ids: string[]): number {
  const before = productCache.length;
  removeFromCache(ids);
  return before - productCache.length;
}

export async function loadShopSettings(): Promise<ShopSettings> {
  const fromDb = await fetchShopSettingsDb();
  // Prefer DB; merge any local overrides only for missing fields
  const local = readJson<Partial<ShopSettings>>(SETTINGS_KEY, {});
  return {
    ...DEFAULT_SHOP_SETTINGS,
    ...local,
    ...fromDb,
  };
}

export function getShopSettings(): ShopSettings {
  return {
    ...DEFAULT_SHOP_SETTINGS,
    ...readJson<Partial<ShopSettings>>(SETTINGS_KEY, {}),
  };
}

export function saveShopSettings(s: ShopSettings): ShopSettings {
  writeJson(SETTINGS_KEY, s);
  return s;
}

export function listOrders(): ShopOrder[] {
  return readJson<ShopOrder[]>(ORDERS_KEY, []).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export function getOrder(id: string): ShopOrder | null {
  return listOrders().find((o) => o.id === id) ?? null;
}

export function listOrdersForPrincipal(principal: string): ShopOrder[] {
  if (!principal) return [];
  return listOrders().filter((o) => o.userPrincipal === principal);
}

export function createOrder(
  order: Omit<ShopOrder, "id" | "createdAt" | "updatedAt" | "status"> & {
    status?: ShopOrderStatus;
  },
): ShopOrder {
  const now = new Date().toISOString();
  const full: ShopOrder = {
    ...order,
    id: `ord-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    status: order.status ?? "pending",
    createdAt: now,
    updatedAt: now,
  };
  const list = listOrders();
  list.unshift(full);
  writeJson(ORDERS_KEY, list);

  // Optimistic stock decrement in cache only (admin should re-save stock in DB)
  for (const item of full.items) {
    const p = productCache.find((x) => x.id === item.productId);
    if (p) {
      p.stock = Math.max(0, p.stock - item.qty);
      p.updatedAt = now;
    }
  }
  return full;
}

export function updateOrderStatus(
  id: string,
  status: ShopOrderStatus,
  adminNotes?: string,
): ShopOrder | null {
  const list = listOrders();
  const i = list.findIndex((o) => o.id === id);
  if (i < 0) return null;
  list[i] = {
    ...list[i]!,
    status,
    adminNotes:
      adminNotes !== undefined ? adminNotes : list[i]!.adminNotes,
    updatedAt: new Date().toISOString(),
  };
  writeJson(ORDERS_KEY, list);
  return list[i]!;
}

export function patchOrder(
  id: string,
  patch: Partial<
    Pick<
      ShopOrder,
      | "status"
      | "adminNotes"
      | "paymentNote"
      | "paidFromPlaySub"
      | "totalIcpEstimate"
      | "icpUsdRate"
    >
  >,
): ShopOrder | null {
  const list = listOrders();
  const i = list.findIndex((o) => o.id === id);
  if (i < 0) return null;
  list[i] = {
    ...list[i]!,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  writeJson(ORDERS_KEY, list);
  return list[i]!;
}

export function newProductId(): string {
  return `prod-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Units sold from real placed orders (all non-cancelled). */
export function countProductOrders(productId: string): {
  units: number;
  orderCount: number;
} {
  let units = 0;
  let orderCount = 0;
  for (const o of listOrders()) {
    if (o.status === "cancelled") continue;
    let hit = 0;
    for (const item of o.items) {
      if (item.productId === productId) {
        units += item.qty;
        hit += item.qty;
      }
    }
    if (hit > 0) orderCount += 1;
  }
  return { units, orderCount };
}

export type ProductBuyer = {
  label: string;
  principal?: string;
  qty: number;
  at: string;
  orderId: string;
};

/**
 * Other buyers of this product from real orders.
 * Prefer username; fall back to principal prefix. No mock entries.
 */
export function listProductBuyers(
  productId: string,
  opts?: { excludePrincipal?: string; limit?: number },
): ProductBuyer[] {
  const limit = opts?.limit ?? 12;
  const out: ProductBuyer[] = [];
  for (const o of listOrders()) {
    if (o.status === "cancelled") continue;
    if (
      opts?.excludePrincipal &&
      o.userPrincipal &&
      o.userPrincipal === opts.excludePrincipal
    ) {
      continue;
    }
    const qty = o.items
      .filter((i) => i.productId === productId)
      .reduce((s, i) => s + i.qty, 0);
    if (qty <= 0) continue;
    const label =
      (o.username && o.username.trim()) ||
      (o.shipping?.name && o.shipping.name.trim()) ||
      (o.userPrincipal
        ? `${o.userPrincipal.slice(0, 5)}…${o.userPrincipal.slice(-3)}`
        : "Gamer");
    out.push({
      label,
      principal: o.userPrincipal,
      qty,
      at: o.createdAt,
      orderId: o.id,
    });
  }
  return out.slice(0, limit);
}
