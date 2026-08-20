/**
 * Wishlist — real localStorage only (no mock products).
 * Scoped by principal when logged in; guest key otherwise.
 */

const GUEST_KEY = "gh_shop_wishlist_guest_v1";

function keyFor(principal?: string | null): string {
  if (principal && principal.length > 8) {
    return `gh_shop_wishlist_${principal.slice(0, 24)}_v1`;
  }
  return GUEST_KEY;
}

function readIds(principal?: string | null): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(keyFor(principal));
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

function writeIds(ids: string[], principal?: string | null) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(keyFor(principal), JSON.stringify([...new Set(ids)]));
    window.dispatchEvent(new Event("gh-shop-wishlist"));
  } catch {
    /* quota */
  }
}

export function getWishlistIds(principal?: string | null): string[] {
  return readIds(principal);
}

export function isInWishlist(
  productId: string,
  principal?: string | null,
): boolean {
  return readIds(principal).includes(productId);
}

export function toggleWishlist(
  productId: string,
  principal?: string | null,
): boolean {
  const ids = readIds(principal);
  const i = ids.indexOf(productId);
  if (i >= 0) {
    ids.splice(i, 1);
    writeIds(ids, principal);
    return false;
  }
  ids.unshift(productId);
  writeIds(ids, principal);
  return true;
}

export function addToWishlist(
  productId: string,
  principal?: string | null,
): void {
  const ids = readIds(principal);
  if (!ids.includes(productId)) {
    ids.unshift(productId);
    writeIds(ids, principal);
  }
}

export function removeFromWishlist(
  productId: string,
  principal?: string | null,
): void {
  writeIds(
    readIds(principal).filter((id) => id !== productId),
    principal,
  );
}
