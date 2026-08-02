/**
 * Static-export / IC assets deep links.
 *
 * Unknown path segments (`/tournaments/{id}`, `/teams/{id}`, …) are not prebuilt,
 * so the assets canister serves root `index.html` (visitor home). Always use the
 * always-built `…/view/?id=` shells (or arcade `/arcade/play/?id=`).
 *
 * Root layout also rewrites path URLs → view shells before React hydrates.
 */

export function challengeHref(id: string): string {
  const clean = String(id || "").trim();
  if (!clean) return "/challenges/";
  return `/challenges/view/?id=${encodeURIComponent(clean)}`;
}

export function tournamentHref(id: string): string {
  const clean = String(id || "").trim();
  if (!clean) return "/tournaments/";
  return `/tournaments/view/?id=${encodeURIComponent(clean)}`;
}

export function teamHref(id: string): string {
  const clean = String(id || "").trim();
  if (!clean) return "/teams/";
  return `/teams/view/?id=${encodeURIComponent(clean)}`;
}

export function chatHref(id: string): string {
  const clean = String(id || "").trim();
  if (!clean) return "/rooms/";
  return `/chat/view/?id=${encodeURIComponent(clean)}`;
}

export function marketHref(id: string): string {
  const clean = String(id || "").trim();
  if (!clean) return "/markets/";
  return `/markets/view/?id=${encodeURIComponent(clean)}`;
}

export function arcadePlayHref(id: string): string {
  const clean = String(id || "").trim();
  if (!clean) return "/arcade/";
  // Prefer path when prebuilt; ?id= always works on /arcade/play/
  return `/arcade/play/?id=${encodeURIComponent(clean)}`;
}

export function shareUrl(pathOrHref: string): string {
  if (typeof window === "undefined") return pathOrHref;
  if (pathOrHref.startsWith("http")) return pathOrHref;
  return `${window.location.origin}${pathOrHref}`;
}

export function challengeShareUrl(id: string): string {
  return shareUrl(challengeHref(id));
}

export function tournamentShareUrl(id: string): string {
  return shareUrl(tournamentHref(id));
}

export function teamShareUrl(id: string): string {
  return shareUrl(teamHref(id));
}

export function chatShareUrl(id: string): string {
  return shareUrl(chatHref(id));
}

/**
 * Resolve a resource id from query / route param / pathname.
 * Skips reserved segments like `_` and `view`.
 */
export function resolveDeepId(opts: {
  routeId?: string;
  paramId?: string | string[];
  queryId?: string | null;
  pathname?: string | null;
  /** e.g. /tournaments/([^/?#]+) */
  pathPattern: RegExp;
  reserved?: string[];
}): string {
  const reserved = new Set(opts.reserved ?? ["_", "view"]);
  if (opts.queryId && opts.queryId.trim()) {
    return decodeURIComponent(opts.queryId.trim());
  }
  const fromParam = Array.isArray(opts.paramId)
    ? opts.paramId[0]
    : opts.paramId;
  if (fromParam && !reserved.has(fromParam)) {
    return decodeURIComponent(fromParam);
  }
  if (opts.routeId && !reserved.has(opts.routeId)) {
    return decodeURIComponent(opts.routeId);
  }
  const path = opts.pathname || "";
  const m = path.match(opts.pathPattern);
  if (m?.[1] && !reserved.has(m[1])) {
    return decodeURIComponent(m[1]);
  }
  return "";
}
