"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Identity } from "@dfinity/agent";
import type { ChatUser } from "@/lib/chat/types";
import {
  emptyProfileForPrincipal,
  resolveProfileAvatarUrl,
  type GamerProfile,
} from "@/lib/profile";
import {
  fetchProfileByPrincipal,
  saveProfileToSupabase,
} from "@/lib/supabase/profile";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  getOrCreateLocalIdentity,
  isLocalIcNetwork,
} from "@/lib/ic/local-identity";

export type { ChatUser };

const ANON = "2vxsx-fae";
const II_MAX_TTL_NS = BigInt(7 * 24 * 60 * 60 * 1_000_000_000); // 7 days
const LOCAL_SESSION_FLAG = "gh_local_session_v1";
/**
 * Bump when II derivation / storage rules change so old IndexedDB sessions
 * (created without derivationOrigin) are wiped once — forces one clean Connect.
 */
const AUTH_STORAGE_EPOCH = "gh-ii-v3-gamerholic.fun";
const AUTH_EPOCH_KEY = "gh_auth_epoch";

type SessionContextValue = {
  isLoggedIn: boolean;
  /** True after AuthClient bootstrap finishes */
  authReady: boolean;
  user: ChatUser | null;
  profile: GamerProfile | null;
  /** Authenticated principal text (empty when logged out) */
  principal: string;
  /** ICP identity for canister calls */
  identity: Identity | null;
  /** Internet Identity login */
  login: () => Promise<void>;
  /**
   * @deprecated Use `login` — alias for older call sites
   */
  loginDemo: () => void;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<GamerProfile>) => Promise<void>;
  /** Re-fetch profile from Supabase by principal */
  refreshProfile: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

/** Canonical production origin — II principals derive from this, not the canister URL. */
const GH_CANONICAL_ORIGIN = "https://gamerholic.fun";

/**
 * II derivation origin — always `https://gamerholic.fun` on any non-localhost host.
 * Never use `window.location.origin` (that minted a new principal per hostname).
 *
 * Requires `public/.well-known/ii-alternative-origins` listing canister + www hosts.
 */
function iiDerivationOrigin(): string | undefined {
  try {
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      if (host === "localhost" || host === "127.0.0.1") {
        return undefined;
      }
    }
    const configured =
      process.env.NEXT_PUBLIC_II_DERIVATION_ORIGIN ||
      process.env.NEXT_PUBLIC_APP_URL ||
      GH_CANONICAL_ORIGIN;
    return new URL(configured).origin;
  } catch {
    return GH_CANONICAL_ORIGIN;
  }
}

async function wipeAuthClientStorage() {
  try {
    const { AuthClient, IdbStorage, KEY_STORAGE_KEY, KEY_STORAGE_DELEGATION } =
      await import("@dfinity/auth-client");
    try {
      const client = await AuthClient.create({
        idleOptions: { disableIdle: true, disableDefaultIdleCallback: true },
      });
      if (await client.isAuthenticated()) {
        await client.logout();
      }
    } catch {
      /* ignore */
    }
    const storage = new IdbStorage();
    await storage.remove(KEY_STORAGE_KEY);
    await storage.remove(KEY_STORAGE_DELEGATION);
  } catch {
    /* ignore */
  }
}

function readAuthEpoch(): string {
  try {
    return window.localStorage.getItem(AUTH_EPOCH_KEY) || "";
  } catch {
    return "";
  }
}

function writeAuthEpoch(v: string) {
  try {
    window.localStorage.setItem(AUTH_EPOCH_KEY, v);
  } catch {
    /* ignore */
  }
}

/**
 * Internet Identity provider URL (mainnet / production only).
 *
 * Local dfx: we do **not** use mainnet II for canister updates — the local
 * replica cannot verify mainnet II canister signatures ("Invalid delegation").
 * See `getOrCreateLocalIdentity()` for local Connect.
 *
 * Optional local II: deploy internet_identity via dfx, then set
 * `NEXT_PUBLIC_II_URL=http://<local-ii-id>.localhost:4943` (or ?canisterId=…).
 */
function iiProviderUrl(): string {
  return (
    process.env.NEXT_PUBLIC_II_URL ||
    process.env.NEXT_PUBLIC_II_LOCAL_URL ||
    "https://identity.ic0.app"
  );
}

function hasLocalSessionFlag(): boolean {
  try {
    return window.localStorage.getItem(LOCAL_SESSION_FLAG) === "1";
  } catch {
    return false;
  }
}

function setLocalSessionFlag(on: boolean) {
  try {
    if (on) window.localStorage.setItem(LOCAL_SESSION_FLAG, "1");
    else window.localStorage.removeItem(LOCAL_SESSION_FLAG);
  } catch {
    /* ignore */
  }
}

function isProductionRuntime(): boolean {
  if (process.env.NEXT_PUBLIC_IC_NETWORK === "ic") return true;
  if (typeof window === "undefined") {
    return process.env.NODE_ENV === "production";
  }
  const host = window.location.hostname;
  return host !== "localhost" && host !== "127.0.0.1";
}

function profileToChatUser(p: GamerProfile): ChatUser {
  return {
    id: "me",
    username: p.username || p.principal.slice(0, 8),
    principal: p.principal,
    status: "online",
    games: p.games,
    game: p.games[0],
    record: "—",
    avatarUrl: resolveProfileAvatarUrl(p),
  };
}

/**
 * Session via Internet Identity (yoinx-style prod vs local).
 * Profile always loaded from Supabase `gh_profiles` by principal — never
 * persisted to localStorage in production.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [authReady, setAuthReady] = useState(false);
  const [isLoggedIn, setLoggedIn] = useState(false);
  const [profile, setProfile] = useState<GamerProfile | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientRef = useRef<any>(null);

  const applyPrincipal = useCallback(async (id: Identity) => {
    const principal = id.getPrincipal().toText();
    if (!principal || principal === ANON) {
      setIdentity(null);
      setLoggedIn(false);
      setProfile(null);
      return;
    }
    // Unlock UI immediately — do not block on Supabase/network
    setIdentity(id);
    setLoggedIn(true);
    setProfile((prev) =>
      prev?.principal === principal ? prev : emptyProfileForPrincipal(principal),
    );

    try {
      const loaded = await Promise.race([
        fetchProfileByPrincipal(principal),
        new Promise<null>((resolve) => {
          window.setTimeout(() => resolve(null), 4000);
        }),
      ]);
      if (loaded) {
        setProfile(loaded);
        if (isSupabaseConfigured() && !loaded.username) {
          const seed = emptyProfileForPrincipal(principal);
          setProfile(seed);
          void saveProfileToSupabase(seed);
        }
      }
    } catch (e) {
      console.warn("[session] profile fetch failed", e);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Drop legacy demo keys (never use for session)
        if (typeof window !== "undefined") {
          try {
            window.localStorage.removeItem("gh_demo_session");
            window.localStorage.removeItem("gh_demo_profile");
            window.localStorage.removeItem("gh_profile_v1");
          } catch {
            /* ignore */
          }
        }

        // Local replica: restore browser Ed25519 session (not mainnet II)
        if (isLocalIcNetwork() && hasLocalSessionFlag()) {
          if (!cancelled) {
            await applyPrincipal(getOrCreateLocalIdentity());
            setAuthReady(true);
          }
          return;
        }

        // Mainnet / remote: Internet Identity
        if (isLocalIcNetwork()) {
          // Do not rehydrate mainnet II into a local agent — signatures fail.
          // Clear any stale II so the user re-connects with a local key.
          try {
            const { AuthClient } = await import("@dfinity/auth-client");
            const client = await AuthClient.create({
              idleOptions: {
                disableIdle: true,
                disableDefaultIdleCallback: true,
              },
            });
            if (await client.isAuthenticated()) {
              await client.logout();
            }
            clientRef.current = client;
          } catch {
            /* ignore */
          }
          if (!cancelled) setAuthReady(true);
          return;
        }

        // One-time wipe of pre-derivation sessions so principal stays on gamerholic.fun
        if (typeof window !== "undefined" && readAuthEpoch() !== AUTH_STORAGE_EPOCH) {
          await wipeAuthClientStorage();
          writeAuthEpoch(AUTH_STORAGE_EPOCH);
          console.info(
            "[session] cleared pre-derivation II session; Connect again for stable principal under",
            GH_CANONICAL_ORIGIN,
          );
        }

        const { AuthClient } = await import("@dfinity/auth-client");
        const client = await AuthClient.create({
          idleOptions: {
            disableIdle: true,
            disableDefaultIdleCallback: true,
          },
        });
        if (cancelled) return;
        clientRef.current = client;

        const valid = await client.isAuthenticated();
        // Mark auth ready before profile hydrate so pages render
        if (!cancelled) setAuthReady(true);

        if (valid) {
          const id = client.getIdentity();
          const p = id.getPrincipal().toText();
          if (p && p !== ANON && !cancelled) {
            if (typeof window !== "undefined") {
              console.info(
                "[session] restored principal",
                p,
                "derivation",
                iiDerivationOrigin() || "(local)",
              );
            }
            void applyPrincipal(id);
          }
        }
      } catch (e) {
        console.warn("[session] AuthClient init failed", e);
        if (!cancelled) setAuthReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyPrincipal]);

  const login = useCallback(async () => {
    // Local dfx: mainnet II delegations cannot be verified by the local root key
    if (isLocalIcNetwork()) {
      try {
        await clientRef.current?.logout?.();
      } catch {
        /* ignore */
      }
      const id = getOrCreateLocalIdentity();
      setLocalSessionFlag(true);
      await applyPrincipal(id);
      return;
    }

    const { AuthClient } = await import("@dfinity/auth-client");
    let client = clientRef.current;
    if (!client) {
      client = await AuthClient.create({
        idleOptions: {
          disableIdle: true,
          disableDefaultIdleCallback: true,
        },
      });
      clientRef.current = client;
    }

    const derivationOrigin = iiDerivationOrigin();
    // Always set epoch so restore path does not wipe mid-session
    if (typeof window !== "undefined") {
      writeAuthEpoch(AUTH_STORAGE_EPOCH);
    }
    const loginOpts: Record<string, unknown> = {
      identityProvider: iiProviderUrl(),
      maxTimeToLive: II_MAX_TTL_NS,
      ...(derivationOrigin ? { derivationOrigin } : {}),
    };

    await new Promise<void>((resolve, reject) => {
      void client.login({
        ...loginOpts,
        onSuccess: () => resolve(),
        onError: (err: unknown) =>
          reject(err ?? new Error("II login failed")),
      });
    });

    const id = client.getIdentity();
    const p = id.getPrincipal().toText();
    if (!p || p === ANON) {
      throw new Error("Anonymous principal not allowed");
    }
    console.info(
      "[session] login principal",
      p,
      "derivation",
      derivationOrigin || "(local)",
      "page",
      typeof window !== "undefined" ? window.location.origin : "",
    );
    setLocalSessionFlag(false);
    await applyPrincipal(id);
  }, [applyPrincipal]);

  const loginDemo = useCallback(() => {
    void login().catch((e) => console.warn("[session] login failed", e));
  }, [login]);

  const logout = useCallback(async () => {
    // Always clear app session UI first so a failed storage wipe cannot leave
    // the chrome looking logged-in.
    setLocalSessionFlag(false);
    setIdentity(null);
    setLoggedIn(false);
    setProfile(null);

    // Local replica: keep browser Ed25519 key (stable local principal).
    // Mainnet: wipe AuthClient IndexedDB delegation so the next page load
    // does not auto-restore without Connect.
    if (isLocalIcNetwork()) {
      return;
    }

    try {
      let client = clientRef.current;
      if (!client) {
        const { AuthClient } = await import("@dfinity/auth-client");
        client = await AuthClient.create({
          idleOptions: {
            disableIdle: true,
            disableDefaultIdleCallback: true,
          },
        });
        clientRef.current = client;
      }
      await client.logout();
      // Drop the client so the next login builds a clean AuthClient
      clientRef.current = null;
    } catch (e) {
      console.warn("[session] AuthClient.logout failed", e);
      // Best-effort: clear AuthClient IndexedDB if logout threw
      try {
        const { IdbStorage, KEY_STORAGE_KEY, KEY_STORAGE_DELEGATION } =
          await import("@dfinity/auth-client");
        const storage = new IdbStorage();
        await storage.remove(KEY_STORAGE_KEY);
        await storage.remove(KEY_STORAGE_DELEGATION);
      } catch {
        /* ignore */
      }
      clientRef.current = null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const p = identity?.getPrincipal().toText();
    if (!p || p === ANON) return;
    const loaded = await fetchProfileByPrincipal(p);
    setProfile(loaded);
  }, [identity]);

  const updateProfile = useCallback(
    async (patch: Partial<GamerProfile>) => {
      const currentPrincipal =
        identity?.getPrincipal().toText() || profile?.principal || "";
      if (!currentPrincipal || currentPrincipal === ANON) {
        throw new Error("Connect Internet Identity first");
      }
      const base = profile ?? emptyProfileForPrincipal(currentPrincipal);
      const next: GamerProfile = {
        ...base,
        ...patch,
        principal: currentPrincipal,
      };
      // Optimistic UI
      const prev = profile;
      setProfile(next);

      // Production: Supabase only — no profile localStorage
      if (isSupabaseConfigured()) {
        const r = await saveProfileToSupabase(next);
        if (!r.ok) {
          console.warn("[session] profile save failed", r.error);
          // Roll back optimistic update so UI matches server
          setProfile(prev ?? emptyProfileForPrincipal(currentPrincipal));
          throw new Error(r.error || "Failed to save profile to Supabase");
        }
        return;
      }

      // Static IC build missing Supabase keys — fail loudly so users don't think it saved
      if (isProductionRuntime()) {
        setProfile(prev ?? emptyProfileForPrincipal(currentPrincipal));
        throw new Error(
          "Supabase is not configured in this build (NEXT_PUBLIC_SUPABASE_* missing). Profile was not saved.",
        );
      }

      // Local / no Supabase: allow in-memory only (never write profile to disk in prod)
      try {
        window.sessionStorage.setItem(
          `gh_profile_session_${currentPrincipal}`,
          JSON.stringify(next),
        );
      } catch {
        /* ignore */
      }
    },
    [identity, profile],
  );

  const value = useMemo(
    () => ({
      isLoggedIn,
      authReady,
      user: isLoggedIn && profile ? profileToChatUser(profile) : null,
      profile: isLoggedIn ? profile : null,
      principal:
        (isLoggedIn &&
          (identity?.getPrincipal().toText() || profile?.principal)) ||
        "",
      identity: isLoggedIn ? identity : null,
      login,
      loginDemo,
      logout,
      updateProfile,
      refreshProfile,
    }),
    [
      isLoggedIn,
      authReady,
      profile,
      identity,
      login,
      loginDemo,
      logout,
      updateProfile,
      refreshProfile,
    ],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return ctx;
}
