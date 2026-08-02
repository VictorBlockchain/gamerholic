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

/**
 * II derivation origin — mirrors yoinx_new:
 * - Production host: pass app origin so principal is stable across domains
 * - Localhost / 127.0.0.1: omit derivationOrigin (local test principal)
 */
function iiDerivationOrigin(): string | undefined {
  const configured =
    process.env.NEXT_PUBLIC_II_DERIVATION_ORIGIN ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "";
  try {
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      if (host === "localhost" || host === "127.0.0.1") {
        return undefined;
      }
    }
    if (configured) return new URL(configured).origin;
    if (typeof window !== "undefined") return window.location.origin;
    return undefined;
  } catch {
    return undefined;
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
    setLocalSessionFlag(false);
    await applyPrincipal(id);
  }, [applyPrincipal]);

  const loginDemo = useCallback(() => {
    void login().catch((e) => console.warn("[session] login failed", e));
  }, [login]);

  const logout = useCallback(async () => {
    try {
      await clientRef.current?.logout?.();
    } catch {
      /* ignore */
    }
    setLocalSessionFlag(false);
    // Keep the Ed25519 key so Connect on local returns the same principal
    // (clear site data / clearLocalIdentity() for a fresh key).
    setIdentity(null);
    setLoggedIn(false);
    setProfile(null);
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
      setProfile(next);

      // Production: Supabase only — no profile localStorage
      if (isSupabaseConfigured()) {
        const r = await saveProfileToSupabase(next);
        if (!r.ok) {
          console.warn("[session] profile save failed", r.error);
        }
        return;
      }

      // Local / no Supabase: allow in-memory only (never write profile to disk in prod)
      if (!isProductionRuntime()) {
        // Optional local-only cache for offline UI during local dfx work
        try {
          window.sessionStorage.setItem(
            `gh_profile_session_${currentPrincipal}`,
            JSON.stringify(next),
          );
        } catch {
          /* ignore */
        }
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
