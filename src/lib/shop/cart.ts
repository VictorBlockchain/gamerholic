/**
 * Cart — sessionStorage.
 */

import type { CartLine } from "./types";
import { getProduct } from "./store";

const CART_KEY = "gh_shop_cart_v1";

export function getCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(CART_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CartLine[];
  } catch {
    return [];
  }
}

export function setCart(lines: CartLine[]) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(CART_KEY, JSON.stringify(lines));
  window.dispatchEvent(new Event("gh-shop-cart"));
}

export function cartCount(): number {
  return getCart().reduce((n, l) => n + l.qty, 0);
}

export function addToCart(
  productId: string,
  qty = 1,
  variantLabel?: string,
): CartLine[] {
  const lines = getCart();
  const key = `${productId}::${variantLabel || ""}`;
  const i = lines.findIndex(
    (l) => `${l.productId}::${l.variantLabel || ""}` === key,
  );
  if (i >= 0) {
    lines[i] = { ...lines[i]!, qty: lines[i]!.qty + qty };
  } else {
    lines.push({ productId, qty, variantLabel });
  }
  setCart(lines);
  return lines;
}

export function updateCartQty(
  productId: string,
  qty: number,
  variantLabel?: string,
): CartLine[] {
  let lines = getCart();
  const key = `${productId}::${variantLabel || ""}`;
  if (qty <= 0) {
    lines = lines.filter(
      (l) => `${l.productId}::${l.variantLabel || ""}` !== key,
    );
  } else {
    lines = lines.map((l) =>
      `${l.productId}::${l.variantLabel || ""}` === key
        ? { ...l, qty }
        : l,
    );
  }
  setCart(lines);
  return lines;
}

export function clearCart() {
  setCart([]);
}

export function cartSubtotalUsd(): number {
  let t = 0;
  for (const l of getCart()) {
    const p = getProduct(l.productId);
    if (p) t += p.priceUsd * l.qty;
  }
  return Math.round(t * 100) / 100;
}

/**
 * Resolve cart line products from DB into the product cache, then subtotal.
 */
export async function hydrateCartProducts(): Promise<void> {
  const { ensureProduct, loadPublishedCatalog } = await import("./store");
  await loadPublishedCatalog();
  await Promise.all(getCart().map((l) => ensureProduct(l.productId)));
}
