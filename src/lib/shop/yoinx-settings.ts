/**
 * Admin-overridable Yoinx embed settings (localStorage).
 * Env vars remain defaults; admin UI can override without redeploy.
 */

export type YoinxAdminSettings = {
  apiUrl: string;
  appUrl: string;
  siteKey: string;
  businessId: string;
};

const KEY = "gh_shop_yoinx_settings_v1";

export function getYoinxAdminSettings(): YoinxAdminSettings {
  const envDefaults: YoinxAdminSettings = {
    apiUrl: (process.env.NEXT_PUBLIC_YOINX_API_URL || "").trim(),
    appUrl: (process.env.NEXT_PUBLIC_YOINX_APP_URL || "").trim(),
    siteKey: (process.env.NEXT_PUBLIC_YOINX_SITE_KEY || "").trim(),
    businessId: (process.env.NEXT_PUBLIC_YOINX_BUSINESS_ID || "").trim(),
  };
  if (typeof window === "undefined") return envDefaults;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return envDefaults;
    const p = JSON.parse(raw) as Partial<YoinxAdminSettings>;
    return {
      apiUrl: (p.apiUrl ?? envDefaults.apiUrl).trim(),
      appUrl: (p.appUrl ?? envDefaults.appUrl).trim(),
      siteKey: (p.siteKey ?? envDefaults.siteKey).trim(),
      businessId: (p.businessId ?? envDefaults.businessId).trim(),
    };
  } catch {
    return envDefaults;
  }
}

export function saveYoinxAdminSettings(s: YoinxAdminSettings): YoinxAdminSettings {
  const next: YoinxAdminSettings = {
    apiUrl: s.apiUrl.trim(),
    appUrl: s.appUrl.trim(),
    siteKey: s.siteKey.trim(),
    businessId: s.businessId.trim(),
  };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("gh-yoinx-settings"));
    } catch {
      /* ignore */
    }
  }
  return next;
}

export function clearYoinxAdminSettings(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event("gh-yoinx-settings"));
  } catch {
    /* ignore */
  }
}
