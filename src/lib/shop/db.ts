/**
 * Shop catalog via Supabase `gh_shop_products` — no mock / localStorage seed.
 */

import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { GH_TABLES } from "@/lib/supabase/tables";
import {
  slugify,
  type ShopCategory,
  type ShopProduct,
  type ShopProductAspect,
  type ShopProductVariant,
  type ShopSettings,
  DEFAULT_SHOP_SETTINGS,
} from "./types";

type DbRow = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  price_usd?: number | string | null;
  compare_at_usd?: number | string | null;
  images?: unknown;
  variants?: unknown;
  stock?: number | null;
  sku?: string | null;
  supplier_url?: string | null;
  supplier_note?: string | null;
  published?: boolean | null;
  featured?: boolean | null;
  print_asset_url?: string | null;
  print_font_family?: string | null;
  print_font_url?: string | null;
  print_text?: string | null;
  print_notes?: string | null;
  aspect?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function asStringArr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map(String).filter(Boolean);
}

function asVariants(v: unknown): ShopProductVariant[] | undefined {
  if (!Array.isArray(v) || !v.length) return undefined;
  const out: ShopProductVariant[] = [];
  for (const raw of v) {
    if (!raw || typeof raw !== "object") continue;
    const o = raw as { name?: string; options?: unknown };
    const name = String(o.name || "").trim();
    const options = asStringArr(o.options);
    if (name && options.length) out.push({ name, options });
  }
  return out.length ? out : undefined;
}

function asAspect(v: unknown): ShopProductAspect | undefined {
  const s = String(v || "");
  if (s === "tall" || s === "square" || s === "wide") return s;
  return undefined;
}

export function rowToProduct(row: DbRow): ShopProduct {
  return {
    id: String(row.id),
    name: String(row.name || ""),
    slug: String(row.slug || ""),
    description: String(row.description || ""),
    category: (String(row.category || "apparel") as ShopCategory) || "apparel",
    priceUsd: num(row.price_usd),
    compareAtUsd:
      row.compare_at_usd != null && row.compare_at_usd !== ""
        ? num(row.compare_at_usd)
        : undefined,
    images: asStringArr(row.images),
    variants: asVariants(row.variants),
    stock: Math.max(0, Math.floor(num(row.stock))),
    sku: row.sku ? String(row.sku) : undefined,
    supplierUrl: row.supplier_url ? String(row.supplier_url) : undefined,
    supplierNote: row.supplier_note ? String(row.supplier_note) : undefined,
    published: Boolean(row.published),
    featured: Boolean(row.featured),
    aspect: asAspect(row.aspect),
    printAssetUrl: row.print_asset_url
      ? String(row.print_asset_url)
      : undefined,
    printFontFamily: row.print_font_family
      ? String(row.print_font_family)
      : undefined,
    printFontUrl: row.print_font_url ? String(row.print_font_url) : undefined,
    printText: row.print_text ? String(row.print_text) : undefined,
    printNotes: row.print_notes ? String(row.print_notes) : undefined,
    createdAt: String(row.created_at || new Date().toISOString()),
    updatedAt: String(row.updated_at || new Date().toISOString()),
  };
}

export function productToDbPayload(p: ShopProduct): Record<string, unknown> {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug || slugify(p.name),
    description: p.description || "",
    category: p.category || "apparel",
    price_usd: p.priceUsd,
    priceUsd: p.priceUsd,
    compare_at_usd: p.compareAtUsd ?? null,
    compareAtUsd: p.compareAtUsd ?? null,
    images: p.images || [],
    variants: p.variants || [],
    stock: p.stock,
    sku: p.sku || null,
    supplier_url: p.supplierUrl || null,
    supplierUrl: p.supplierUrl || null,
    supplier_note: p.supplierNote || null,
    supplierNote: p.supplierNote || null,
    published: Boolean(p.published),
    featured: Boolean(p.featured),
    print_asset_url: p.printAssetUrl || null,
    printAssetUrl: p.printAssetUrl || null,
    print_font_family: p.printFontFamily || null,
    printFontFamily: p.printFontFamily || null,
    print_font_url: p.printFontUrl || null,
    printFontUrl: p.printFontUrl || null,
    print_text: p.printText || null,
    printText: p.printText || null,
    print_notes: p.printNotes || null,
    printNotes: p.printNotes || null,
    aspect: p.aspect || "square",
  };
}

function sortProducts(list: ShopProduct[]): ShopProduct[] {
  return [...list].sort(
    (a, b) =>
      Number(Boolean(b.featured)) - Number(Boolean(a.featured)) ||
      a.name.localeCompare(b.name),
  );
}

/** Published catalog for storefront (RLS: published = true). */
export async function fetchPublishedProducts(opts?: {
  category?: string;
}): Promise<ShopProduct[]> {
  if (!isSupabaseConfigured()) return [];
  const sb = getSupabase();
  if (!sb) return [];

  let q = sb
    .from(GH_TABLES.shopProducts)
    .select("*")
    .eq("published", true)
    .order("featured", { ascending: false })
    .order("name", { ascending: true });

  if (opts?.category) {
    q = q.eq("category", opts.category);
  }

  const { data, error } = await q;
  if (error) {
    console.warn("[shop] fetch published", error.message);
    return [];
  }
  return sortProducts((data as DbRow[] | null)?.map(rowToProduct) ?? []);
}

/** Single product by id or slug (published only for anon). */
export async function fetchProduct(
  idOrSlug: string,
): Promise<ShopProduct | null> {
  if (!idOrSlug || !isSupabaseConfigured()) return null;
  const sb = getSupabase();
  if (!sb) return null;

  const key = idOrSlug.trim();
  const byId = await sb
    .from(GH_TABLES.shopProducts)
    .select("*")
    .eq("id", key)
    .maybeSingle();
  if (!byId.error && byId.data) {
    return rowToProduct(byId.data as DbRow);
  }

  const bySlug = await sb
    .from(GH_TABLES.shopProducts)
    .select("*")
    .eq("slug", key)
    .maybeSingle();
  if (!bySlug.error && bySlug.data) {
    return rowToProduct(bySlug.data as DbRow);
  }
  return null;
}

/**
 * All products including drafts — requires platform admin (RPC).
 * Falls back to published-only select if RPC missing.
 */
export async function fetchAdminProducts(
  callerPrincipal: string,
): Promise<{ products: ShopProduct[]; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { products: [], error: "Supabase not configured" };
  }
  const sb = getSupabase();
  if (!sb) return { products: [], error: "Supabase client unavailable" };

  const caller = String(callerPrincipal || "").trim();
  if (caller) {
    const { data, error } = await sb.rpc("list_gh_shop_products_admin", {
      p_caller: caller,
    });
    if (!error && Array.isArray(data)) {
      return {
        products: sortProducts((data as DbRow[]).map(rowToProduct)),
      };
    }
    if (error && !error.message.includes("function") && !error.message.includes("schema cache")) {
      // forbidden or other — still try published fallback for visibility
      console.warn("[shop] admin list", error.message);
    }
  }

  // Fallback: published only (RLS)
  const pub = await fetchPublishedProducts();
  return {
    products: pub,
    error: caller
      ? "Admin list unavailable — apply gh_shop_product_rpcs migration or check admin role"
      : undefined,
  };
}

export async function upsertShopProductDb(
  callerPrincipal: string,
  product: ShopProduct,
): Promise<{ ok: boolean; error?: string; product?: ShopProduct }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase not configured" };
  }
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Supabase client unavailable" };
  const caller = String(callerPrincipal || "").trim();
  if (!caller) return { ok: false, error: "caller required" };

  const now = new Date().toISOString();
  const next: ShopProduct = {
    ...product,
    slug: product.slug || slugify(product.name),
    images: (product.images || []).filter(Boolean),
    updatedAt: now,
    createdAt: product.createdAt || now,
  };

  const { data, error } = await sb.rpc("upsert_gh_shop_product", {
    p_caller: caller,
    p: productToDbPayload(next),
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  const body = (data || {}) as { ok?: boolean; error?: string };
  if (!body.ok) {
    return { ok: false, error: body.error || "Upsert failed" };
  }
  return { ok: true, product: next };
}

export async function deleteShopProductsDb(
  callerPrincipal: string,
  ids: string[],
): Promise<{ ok: boolean; deleted: number; error?: string }> {
  if (!ids.length) return { ok: true, deleted: 0 };
  if (!isSupabaseConfigured()) {
    return { ok: false, deleted: 0, error: "Supabase not configured" };
  }
  const sb = getSupabase();
  if (!sb) return { ok: false, deleted: 0, error: "Supabase client unavailable" };
  const caller = String(callerPrincipal || "").trim();
  if (!caller) return { ok: false, deleted: 0, error: "caller required" };

  const { data, error } = await sb.rpc("delete_gh_shop_products", {
    p_caller: caller,
    p_ids: ids,
  });
  if (error) {
    return { ok: false, deleted: 0, error: error.message };
  }
  const body = (data || {}) as {
    ok?: boolean;
    deleted?: number;
    error?: string;
  };
  if (!body.ok) {
    return { ok: false, deleted: 0, error: body.error || "Delete failed" };
  }
  return { ok: true, deleted: Number(body.deleted) || 0 };
}

export async function fetchShopSettingsDb(): Promise<ShopSettings> {
  if (!isSupabaseConfigured()) return { ...DEFAULT_SHOP_SETTINGS };
  const sb = getSupabase();
  if (!sb) return { ...DEFAULT_SHOP_SETTINGS };

  const { data, error } = await sb
    .from(GH_TABLES.shopSettings)
    .select("*")
    .eq("id", "default")
    .maybeSingle();
  if (error || !data) return { ...DEFAULT_SHOP_SETTINGS };
  const row = data as {
    enabled?: boolean;
    banner_title?: string;
    banner_body?: string;
    shipping_blurb?: string;
    currency_label?: string;
  };
  return {
    enabled: row.enabled !== false,
    bannerTitle: row.banner_title || DEFAULT_SHOP_SETTINGS.bannerTitle,
    bannerBody: row.banner_body || DEFAULT_SHOP_SETTINGS.bannerBody,
    shippingBlurb: row.shipping_blurb || DEFAULT_SHOP_SETTINGS.shippingBlurb,
    currencyLabel: row.currency_label || DEFAULT_SHOP_SETTINGS.currencyLabel,
  };
}
