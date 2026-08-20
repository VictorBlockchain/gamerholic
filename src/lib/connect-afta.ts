/**
 * Link-only Afta identity — does NOT replace the Gamerholic II session.
 *
 * Opens Internet Identity with derivationOrigin=https://afta.cash so the user
 * gets the same principal as on afta.cash. Stored on gh_profiles.metadata for
 * XFT avatar / portfolio reads.
 *
 * Requires afta.cash `/.well-known/ii-alternative-origins` to list this host
 * (e.g. https://gamerholic.fun).
 */

import { AuthClient } from "@dfinity/auth-client";

export const AFTA_DERIVATION_ORIGIN = "https://afta.cash";
export const AFTA_APP_URL =
  (typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_AFTA_APP_URL?.trim()) ||
  "https://afta.cash";

const AFTA_LINK_TTL_NS =
  BigInt(30) * BigInt(60) * BigInt(1_000_000_000); // 30 min — link only

class MemoryStorage {
  private map = new Map<string, string>();
  async get(key: string): Promise<string | null> {
    return this.map.has(key) ? (this.map.get(key) as string) : null;
  }
  async set(key: string, value: string): Promise<void> {
    this.map.set(key, value);
  }
  async remove(key: string): Promise<void> {
    this.map.delete(key);
  }
}

function storageKey(ghPrincipal: string): string {
  return `gh:afta_principal:${ghPrincipal.trim()}`;
}

export function loadStoredAftaPrincipal(
  ghPrincipal: string | null | undefined,
): string | null {
  if (typeof window === "undefined" || !ghPrincipal?.trim()) return null;
  try {
    const v = window.localStorage.getItem(storageKey(ghPrincipal));
    return v && v !== "2vxsx-fae" ? v.trim() : null;
  } catch {
    return null;
  }
}

export function persistAftaPrincipal(
  ghPrincipal: string,
  aftaPrincipal: string,
): void {
  if (typeof window === "undefined" || !ghPrincipal?.trim()) return;
  try {
    if (!aftaPrincipal || aftaPrincipal === "2vxsx-fae") {
      window.localStorage.removeItem(storageKey(ghPrincipal));
      return;
    }
    window.localStorage.setItem(storageKey(ghPrincipal), aftaPrincipal.trim());
  } catch {
    /* private mode */
  }
}

export function clearStoredAftaPrincipal(ghPrincipal: string): void {
  persistAftaPrincipal(ghPrincipal, "");
}

export type ConnectAftaResult =
  | { ok: true; principal: string }
  | { ok: false; error: string; cancelled?: boolean };

export async function connectAftaPrincipal(): Promise<ConnectAftaResult> {
  if (typeof window === "undefined") {
    return { ok: false, error: "Connect Afta only works in the browser" };
  }
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return {
      ok: false,
      error:
        "Connect Afta needs a production host listed on afta.cash alternative origins (not localhost).",
    };
  }

  try {
    const client = await AuthClient.create({
      storage: new MemoryStorage() as never,
      idleOptions: {
        disableIdle: true,
        disableDefaultIdleCallback: true,
      },
    });

    await new Promise<void>((resolve, reject) => {
      void client.login({
        identityProvider:
          process.env.NEXT_PUBLIC_II_URL || "https://identity.ic0.app",
        derivationOrigin: AFTA_DERIVATION_ORIGIN,
        maxTimeToLive: AFTA_LINK_TTL_NS,
        onSuccess: () => resolve(),
        onError: (err) => {
          const msg = String(err || "cancelled");
          if (/user.*interrupt|cancel|abort|closed/i.test(msg)) {
            reject(Object.assign(new Error("cancelled"), { cancelled: true }));
          } else {
            reject(err ?? new Error("Afta connect failed"));
          }
        },
      });
    });

    const p = client.getIdentity().getPrincipal().toText();
    try {
      await client.logout();
    } catch {
      /* temp client only */
    }

    if (!p || p === "2vxsx-fae") {
      return { ok: false, error: "Afta returned an anonymous principal" };
    }
    return { ok: true, principal: p };
  } catch (e) {
    const cancelled =
      Boolean((e as { cancelled?: boolean })?.cancelled) ||
      /cancel/i.test(e instanceof Error ? e.message : String(e));
    if (cancelled) {
      return { ok: false, error: "Connect cancelled", cancelled: true };
    }
    return {
      ok: false,
      error:
        e instanceof Error
          ? e.message
          : "Could not connect Afta — check ii-alternative-origins on afta.cash",
    };
  }
}

export function portfolioOwnerPrincipal(
  appPrincipal: string | null | undefined,
  aftaPrincipal: string | null | undefined,
): string {
  const a = (aftaPrincipal || "").trim();
  if (a && a !== "2vxsx-fae") return a;
  return (appPrincipal || "").trim();
}
