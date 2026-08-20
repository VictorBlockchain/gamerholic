/**
 * Link-only Betable identity — does NOT replace the Gamerholic II session.
 *
 * Opens Internet Identity with derivationOrigin=https://betable.fun so the user
 * gets the same principal as on betable.fun. Stores principal + Betable
 * username/avatar under the GH **primary** principal (device-sync aware).
 *
 * Used when creating/joining betable tournaments & challenges. Esports market
 * outcomes use Betable display name/avatar; GH primary is passed for link-back.
 *
 * Requires betable.fun `/.well-known/ii-alternative-origins` to list this host.
 */

import { AuthClient } from "@dfinity/auth-client";
import { Actor, HttpAgent } from "@dfinity/agent";
import { IDL } from "@dfinity/candid";
import { Principal } from "@dfinity/principal";

export const BETABLE_DERIVATION_ORIGIN = "https://betable.fun";
export const BETABLE_APP_URL =
  (typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_BETABLE_APP_URL?.trim()) ||
  "https://betable.fun";

const BETABLE_LINK_TTL_NS =
  BigInt(30) * BigInt(60) * BigInt(1_000_000_000); // 30 min — link only

function envOr(key: string, fallback = ""): string {
  const v = process.env[key];
  return v && v.trim().length > 0 ? v.trim() : fallback;
}

/** Mainnet user_manager (Betable). Override via env. */
export const BETABLE_USER_MANAGER_ID = envOr(
  "NEXT_PUBLIC_BETABLE_USER_MANAGER_ID",
  "mqdkn-myaaa-aaaau-ag5gq-cai",
);

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

export type BetableLink = {
  principal: string;
  username: string;
  avatarUrl: string;
};

function principalKey(ghPrincipal: string): string {
  return `gh:betable_principal:${ghPrincipal.trim()}`;
}
function usernameKey(ghPrincipal: string): string {
  return `gh:betable_username:${ghPrincipal.trim()}`;
}
function avatarKey(ghPrincipal: string): string {
  return `gh:betable_avatar:${ghPrincipal.trim()}`;
}

export function loadStoredBetableLink(
  ghPrincipal: string | null | undefined,
): BetableLink | null {
  if (typeof window === "undefined" || !ghPrincipal?.trim()) return null;
  try {
    const principal = window.localStorage.getItem(principalKey(ghPrincipal));
    if (!principal || principal === "2vxsx-fae") return null;
    return {
      principal: principal.trim(),
      username:
        window.localStorage.getItem(usernameKey(ghPrincipal))?.trim() || "",
      avatarUrl:
        window.localStorage.getItem(avatarKey(ghPrincipal))?.trim() || "",
    };
  } catch {
    return null;
  }
}

export function loadStoredBetablePrincipal(
  ghPrincipal: string | null | undefined,
): string | null {
  return loadStoredBetableLink(ghPrincipal)?.principal ?? null;
}

export function persistBetableLink(
  ghPrincipal: string,
  link: BetableLink | null,
): void {
  if (typeof window === "undefined" || !ghPrincipal?.trim()) return;
  try {
    if (!link?.principal || link.principal === "2vxsx-fae") {
      window.localStorage.removeItem(principalKey(ghPrincipal));
      window.localStorage.removeItem(usernameKey(ghPrincipal));
      window.localStorage.removeItem(avatarKey(ghPrincipal));
      return;
    }
    window.localStorage.setItem(
      principalKey(ghPrincipal),
      link.principal.trim(),
    );
    window.localStorage.setItem(
      usernameKey(ghPrincipal),
      (link.username || "").trim(),
    );
    window.localStorage.setItem(
      avatarKey(ghPrincipal),
      (link.avatarUrl || "").trim(),
    );
  } catch {
    /* private mode */
  }
}

export function clearStoredBetableLink(ghPrincipal: string): void {
  persistBetableLink(ghPrincipal, null);
}

export type ConnectBetableResult =
  | { ok: true; link: BetableLink }
  | { ok: false; error: string; cancelled?: boolean };

const userManagerIdl = () =>
  IDL.Service({
    get_canonical_principal: IDL.Func(
      [IDL.Principal],
      [IDL.Principal],
      ["query"],
    ),
    get_user_profile: IDL.Func(
      [IDL.Principal],
      [
        IDL.Opt(
          IDL.Record({
            principal: IDL.Principal,
            username: IDL.Opt(IDL.Text),
            email: IDL.Opt(IDL.Text),
            avatar: IDL.Opt(IDL.Text),
            bio: IDL.Opt(IDL.Text),
            // remaining fields ignored via candid if extra present
          }),
        ),
      ],
      ["query"],
    ),
  });

async function fetchBetableDisplay(
  identity: { getPrincipal: () => Principal },
  betablePrincipal: string,
): Promise<{ username: string; avatarUrl: string }> {
  try {
    const host =
      process.env.NEXT_PUBLIC_IC_HOST?.trim() || "https://icp0.io";
    const agent = await HttpAgent.create({
      host,
      identity: identity as never,
    });
    if (host.includes("127.0.0.1") || host.includes("localhost")) {
      await agent.fetchRootKey().catch(() => undefined);
    }
    const actor = Actor.createActor(userManagerIdl as never, {
      agent,
      canisterId: BETABLE_USER_MANAGER_ID,
    }) as {
      get_canonical_principal: (p: Principal) => Promise<Principal>;
      get_user_profile: (
        p: Principal,
      ) => Promise<
        [] | [{ username?: [] | [string]; avatar?: [] | [string] }]
      >;
    };
    let p = Principal.fromText(betablePrincipal);
    try {
      p = await actor.get_canonical_principal(p);
    } catch {
      /* use session principal */
    }
    const opt = await actor.get_user_profile(p);
    const profile = Array.isArray(opt) && opt.length ? opt[0] : null;
    const username = profile?.username
      ? Array.isArray(profile.username)
        ? profile.username[0] || ""
        : String(profile.username || "")
      : "";
    const avatarUrl = profile?.avatar
      ? Array.isArray(profile.avatar)
        ? profile.avatar[0] || ""
        : String(profile.avatar || "")
      : "";
    return {
      username: username || `user_${p.toText().slice(0, 8)}`,
      avatarUrl: avatarUrl || "",
    };
  } catch {
    return {
      username: `user_${betablePrincipal.slice(0, 8)}`,
      avatarUrl: "",
    };
  }
}

/**
 * Connect Betable II (temp session). Pass GH **primary** principal for storage key.
 */
export async function connectBetablePrincipal(
  ghPrimaryPrincipal: string,
): Promise<ConnectBetableResult> {
  if (typeof window === "undefined") {
    return { ok: false, error: "Connect Betable only works in the browser" };
  }
  if (!ghPrimaryPrincipal?.trim() || ghPrimaryPrincipal === "2vxsx-fae") {
    return { ok: false, error: "Gamerholic principal required" };
  }
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return {
      ok: false,
      error:
        "Connect Betable needs a production host listed on betable.fun alternative origins (not localhost).",
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
        derivationOrigin: BETABLE_DERIVATION_ORIGIN,
        maxTimeToLive: BETABLE_LINK_TTL_NS,
        onSuccess: () => resolve(),
        onError: (err) => {
          const msg = String(err || "cancelled");
          if (/user.*interrupt|cancel|abort|closed/i.test(msg)) {
            reject(Object.assign(new Error("cancelled"), { cancelled: true }));
          } else {
            reject(err ?? new Error("Betable connect failed"));
          }
        },
      });
    });

    const identity = client.getIdentity();
    let p = identity.getPrincipal().toText();
    if (!p || p === "2vxsx-fae") {
      try {
        await client.logout();
      } catch {
        /* */
      }
      return { ok: false, error: "Betable returned an anonymous principal" };
    }

    const display = await fetchBetableDisplay(identity, p);
    // Prefer Betable primary principal if device-synced
    try {
      const hostIc =
        process.env.NEXT_PUBLIC_IC_HOST?.trim() || "https://icp0.io";
      const agent = await HttpAgent.create({
        host: hostIc,
        identity: identity as never,
      });
      const actor = Actor.createActor(userManagerIdl as never, {
        agent,
        canisterId: BETABLE_USER_MANAGER_ID,
      }) as {
        get_canonical_principal: (x: Principal) => Promise<Principal>;
      };
      p = (await actor.get_canonical_principal(Principal.fromText(p))).toText();
    } catch {
      /* keep session p */
    }

    try {
      await client.logout();
    } catch {
      /* temp client only */
    }

    const link: BetableLink = {
      principal: p,
      username: display.username,
      avatarUrl: display.avatarUrl,
    };
    persistBetableLink(ghPrimaryPrincipal.trim(), link);
    return { ok: true, link };
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
          : "Could not connect Betable — check ii-alternative-origins on betable.fun",
    };
  }
}

/** Outcome label for Esports (Betable username only). */
export function toEsportsOutcomeLabel(link: BetableLink | null | undefined): string {
  return (link?.username || "").trim() || "Player";
}

export function toEsportsAvatarUrl(link: BetableLink | null | undefined): string {
  return (link?.avatarUrl || "").trim();
}

/** Gamerholic profile URL for Betable link-back (use GH primary). */
export function gamerholicProfileUrl(ghPrimaryPrincipal: string): string {
  const base =
    (typeof process !== "undefined" &&
      process.env.NEXT_PUBLIC_APP_URL?.trim()) ||
    "https://gamerholic.fun";
  const p = ghPrimaryPrincipal.trim();
  return `${base.replace(/\/$/, "")}/profile?p=${encodeURIComponent(p)}`;
}
