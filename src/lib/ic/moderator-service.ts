/**
 * Moderator / admin console — canister APIs for roles, disputes, penalties.
 */

import type { Identity } from "@dfinity/agent";
import { createBackendActor, isCanisterConfigured } from "./canisters";

export type ModeratorRoleName =
  | "BaseReferee"
  | "VettedMod"
  | "SuperMod"
  | "AdminMod";

export type ModeratorRecord = {
  wallet: string;
  role: ModeratorRoleName;
  appointedAt: number;
  gamesRefereed: number;
  disputesResolved: number;
  upvotesReceived: number;
  lastPromotion: number;
};

export type DisputeVote = {
  moderator: string;
  winner: string;
  weight: number;
};

export type DisputeRecord = {
  challengeId: string;
  disputedBy: string;
  disputedAt: number;
  status: "Active" | "Resolved" | "Cancelled";
  votes: DisputeVote[];
  expiresAt: number;
};

export type PenaltyRecord = {
  wallet: string;
  username?: string;
  surchargeUntil: number;
  multiplier: number;
  active: boolean;
};

function roleFromCandid(role: unknown): ModeratorRoleName {
  if (role && typeof role === "object") {
    if ("AdminMod" in (role as object)) return "AdminMod";
    if ("SuperMod" in (role as object)) return "SuperMod";
    if ("VettedMod" in (role as object)) return "VettedMod";
    if ("BaseReferee" in (role as object)) return "BaseReferee";
  }
  return "BaseReferee";
}

function roleToCandid(role: ModeratorRoleName) {
  return { [role]: null } as Record<string, null>;
}

function statusFromCandid(status: unknown): DisputeRecord["status"] {
  if (status && typeof status === "object") {
    if ("Active" in (status as object)) return "Active";
    if ("Resolved" in (status as object)) return "Resolved";
    if ("Cancelled" in (status as object)) return "Cancelled";
  }
  return "Active";
}

/** Backend Nat64 timestamps may be ns or seconds — normalize to ms for Date. */
function tsToMs(n: bigint | number): number {
  const v = typeof n === "bigint" ? Number(n) : n;
  if (!Number.isFinite(v) || v <= 0) return 0;
  // nanoseconds ~ 1e18 for 2020+
  if (v > 1e15) return Math.floor(v / 1e6);
  // seconds
  if (v < 1e12) return Math.floor(v * 1000);
  return Math.floor(v);
}

function mapModerator(m: {
  wallet: string;
  role: unknown;
  appointedAt: bigint;
  gamesRefereed: bigint;
  disputesResolved: bigint;
  upvotesReceived: bigint;
  lastPromotion: bigint;
}): ModeratorRecord {
  return {
    wallet: String(m.wallet),
    role: roleFromCandid(m.role),
    appointedAt: tsToMs(m.appointedAt),
    gamesRefereed: Number(m.gamesRefereed),
    disputesResolved: Number(m.disputesResolved),
    upvotesReceived: Number(m.upvotesReceived),
    lastPromotion: tsToMs(m.lastPromotion),
  };
}

function mapDispute(d: {
  challengeId: string;
  disputedBy: string;
  disputedAt: bigint;
  status: unknown;
  votes: { moderator: string; winner: string; weight: bigint }[];
  expiresAt: bigint;
}): DisputeRecord {
  return {
    challengeId: String(d.challengeId),
    disputedBy: String(d.disputedBy),
    disputedAt: tsToMs(d.disputedAt),
    status: statusFromCandid(d.status),
    votes: (d.votes || []).map((v) => ({
      moderator: String(v.moderator),
      winner: String(v.winner),
      weight: Number(v.weight),
    })),
    expiresAt: tsToMs(d.expiresAt),
  };
}

async function actor(identity?: Identity | null): Promise<any | null> {
  if (!isCanisterConfigured()) return null;
  return createBackendActor(identity);
}

export async function listModerators(
  identity?: Identity | null,
): Promise<ModeratorRecord[]> {
  const a = await actor(identity);
  if (!a) return [];
  try {
    const list =
      (await (a as { listModerators?: () => Promise<unknown[]> }).listModerators?.()) ||
      (await (a as { listAllModerators?: () => Promise<unknown[]> }).listAllModerators?.()) ||
      [];
    return (list as Parameters<typeof mapModerator>[0][]).map(mapModerator);
  } catch (e) {
    console.warn("[moderator-service] listModerators", e);
    return [];
  }
}

export async function getMyModeratorRole(
  address: string,
  identity?: Identity | null,
): Promise<ModeratorRoleName | null> {
  if (!address) return null;
  const a = await actor(identity);
  if (!a) return null;
  try {
    const opt = await (
      a as { getModerator: (w: string) => Promise<unknown[]> }
    ).getModerator(address);
    const m = Array.isArray(opt) ? opt[0] : null;
    if (!m) return null;
    return mapModerator(m as Parameters<typeof mapModerator>[0]).role;
  } catch {
    return null;
  }
}

export async function checkIsAdmin(
  address: string,
  identity?: Identity | null,
): Promise<boolean> {
  if (!address) return false;
  const a = await actor(identity);
  if (!a) return false;
  try {
    return Boolean(
      await (a as { isAdmin: (w: string) => Promise<boolean> }).isAdmin(address),
    );
  } catch {
    return false;
  }
}

export async function applyAsBaseReferee(
  address: string,
  identity?: Identity | null,
): Promise<boolean> {
  const a = await actor(identity);
  if (!a) throw new Error("Canister not configured");
  return Boolean(
    await (
      a as { applyBaseReferee: (w: string) => Promise<boolean> }
    ).applyBaseReferee(address),
  );
}

export async function appointModerator(
  caller: string,
  target: string,
  role: ModeratorRoleName,
  identity?: Identity | null,
): Promise<boolean> {
  const a = await actor(identity);
  if (!a) throw new Error("Canister not configured");
  return Boolean(
    await (
      a as {
        appointModerator: (
          c: string,
          t: string,
          r: unknown,
        ) => Promise<boolean>;
      }
    ).appointModerator(caller, target, roleToCandid(role)),
  );
}

export async function promoteModerator(
  caller: string,
  target: string,
  identity?: Identity | null,
): Promise<boolean> {
  const a = await actor(identity);
  if (!a) throw new Error("Canister not configured");
  return Boolean(
    await (
      a as { promoteModerator: (c: string, t: string) => Promise<boolean> }
    ).promoteModerator(caller, target),
  );
}

export async function listActiveDisputes(
  identity?: Identity | null,
): Promise<DisputeRecord[]> {
  const a = await actor(identity);
  if (!a) return [];
  try {
    const list = await (
      a as { listActiveDisputes: () => Promise<unknown[]> }
    ).listActiveDisputes();
    return (list as Parameters<typeof mapDispute>[0][]).map(mapDispute);
  } catch (e) {
    console.warn("[moderator-service] listActiveDisputes", e);
    return [];
  }
}

export async function voteOnDispute(
  challengeId: string,
  moderator: string,
  winner: string,
  weight: number,
  identity?: Identity | null,
): Promise<boolean> {
  const a = await actor(identity);
  if (!a) throw new Error("Canister not configured");
  return Boolean(
    await (
      a as {
        voteOnDispute: (
          id: string,
          m: string,
          w: string,
          wt: bigint,
        ) => Promise<boolean>;
      }
    ).voteOnDispute(challengeId, moderator, winner, BigInt(weight)),
  );
}

export async function finalizeDispute(
  challengeId: string,
  finalizer: string,
  identity?: Identity | null,
): Promise<boolean> {
  const a = await actor(identity);
  if (!a) throw new Error("Canister not configured");
  return Boolean(
    await (
      a as { finalizeDispute: (id: string, f: string) => Promise<boolean> }
    ).finalizeDispute(challengeId, finalizer),
  );
}

export async function listPenalties(
  identity?: Identity | null,
): Promise<PenaltyRecord[]> {
  const a = await actor(identity);
  if (!a) return [];
  try {
    const gamers = await (
      a as {
        listGamers: () => Promise<
          { wallet: string; username: string; avatarUrl: string }[]
        >;
      }
    ).listGamers();
    const out: PenaltyRecord[] = [];
    const now = Date.now();
    for (const g of gamers.slice(0, 80)) {
      try {
        const opt = await (
          a as {
            getPenalty: (
              w: string,
            ) => Promise<
              [] | [{ surchargeUntil: bigint; multiplier: bigint }]
            >;
          }
        ).getPenalty(g.wallet);
        const pen = Array.isArray(opt) ? opt[0] : null;
        if (!pen) continue;
        const until = tsToMs(pen.surchargeUntil);
        out.push({
          wallet: g.wallet,
          username: g.username,
          surchargeUntil: until,
          multiplier: Number(pen.multiplier),
          active: until > now,
        });
      } catch {
        /* skip */
      }
    }
    return out;
  } catch (e) {
    console.warn("[moderator-service] listPenalties", e);
    return [];
  }
}

export function roleLabel(role: ModeratorRoleName): string {
  switch (role) {
    case "BaseReferee":
      return "Base Referee";
    case "VettedMod":
      return "Vetted Moderator";
    case "SuperMod":
      return "Super Moderator";
    case "AdminMod":
      return "Admin Moderator";
    default:
      return role;
  }
}

export function shortAddr(a: string, n = 8) {
  if (!a) return "—";
  if (a.length <= n * 2) return a;
  return `${a.slice(0, n)}…${a.slice(-4)}`;
}
