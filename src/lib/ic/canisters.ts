/**
 * Gamerholic ICP canister IDs + actor factory.
 * Canisters = source of truth; Supabase = Realtime mirror.
 */

import {
  Actor,
  HttpAgent,
  type Identity,
  AnonymousIdentity,
} from "@dfinity/agent";
import { idlFactory as backendIdlFactory } from "./idl";
import mediaIdlFactory from "./media-idl";

/**
 * Next.js only inlines `process.env.NEXT_PUBLIC_*` when the key is a
 * **static** property access. `process.env[dynamicKey]` is always undefined
 * in the browser bundle — which made isCanisterConfigured() false despite
 * a valid .env.local.
 */
function pub(v: string | undefined, fallback = ""): string {
  const s = (v ?? "").trim();
  return s.length > 0 ? s : fallback;
}

const GH_BACKEND_ID = pub(
  process.env.NEXT_PUBLIC_GH_BACKEND_CANISTER_ID,
  pub(process.env.NEXT_PUBLIC_GAMERHOLIC_CANISTER_ID),
);
const GH_MEDIA_ID = pub(process.env.NEXT_PUBLIC_GH_MEDIA_CANISTER_ID);
const IC_HOST = pub(process.env.NEXT_PUBLIC_IC_HOST);
const IC_NETWORK = pub(process.env.NEXT_PUBLIC_IC_NETWORK);

const useMainnet =
  IC_NETWORK === "ic" ||
  IC_HOST.includes("icp0.io") ||
  IC_HOST.includes("ic0.app");

const LOCAL_IDS = {
  gh_backend: GH_BACKEND_ID,
  gh_media: GH_MEDIA_ID,
};

const MAINNET_IDS = {
  gh_backend: GH_BACKEND_ID,
  gh_media: GH_MEDIA_ID,
};

export const CANISTER_IDS = useMainnet ? MAINNET_IDS : LOCAL_IDS;

export function getIcHost(): string {
  return IC_HOST || (useMainnet ? "https://icp0.io" : "http://127.0.0.1:4943");
}

export function isLocalHost(host = getIcHost()): boolean {
  return host.includes("localhost") || host.includes("127.0.0.1");
}

export function isCanisterConfigured(): boolean {
  return Boolean(CANISTER_IDS.gh_backend && CANISTER_IDS.gh_backend.length > 5);
}

export async function createAgent(
  identity?: Identity | null,
): Promise<HttpAgent> {
  const host = getIcHost();
  const local = isLocalHost(host);
  const agent = new HttpAgent({
    host,
    identity: identity ?? new AnonymousIdentity(),
  });
  if (local) {
    try {
      await agent.fetchRootKey();
    } catch {
      /* replica not up */
    }
  }
  return agent;
}

export type ChallengeInfoCanister = {
  challengeType: bigint;
  status: bigint;
  creator: string;
  opponent: string;
  entryFee: bigint;
  totalPrizePool: bigint;
  createdAt: bigint;
  currentParticipants: bigint;
  player1score: bigint;
  player2score: bigint;
  scoreReporter: string;
  timeScored: bigint;
  timeScoreConfirmed: bigint;
  gameType: string;
  metadata: string;
  tournament: string;
  payToken: string;
  contractBalance: bigint;
  expiresAt: bigint;
  autoResolveThreshold: bigint;
  title: string;
  console: string;
  scheduledAt: bigint;
  betable: boolean;
  marketId: string;
  monitor: string;
  creatorStream: string;
  opponentStream: string;
  scoreIsFinal: boolean;
  cancelRequester: string;
  cancelRequestedAt: bigint;
  disputeVideo: string;
  disputeReason: string;
  disputeBy: string;
};

export type TournamentInfoCanister = {
  creator: string;
  entryFee: bigint;
  maxParticipants: bigint;
  xftToJoin: bigint;
  createdAt: bigint;
  deadline: bigint;
  gameType: string;
  metadata: string;
  payToken: string;
  isFFA: boolean;
  status: bigint;
  totalPrizePool: bigint;
  hostFeeBps: bigint;
  title: string;
  console: string;
  scheduledAt: bigint;
  betable: boolean;
  marketId: string;
  teamEntry: boolean;
  registrationOpen: boolean;
  streamUrl: string;
  coverUrl: string;
};

export type GamerholicBackend = {
  createChallengeEx: (
    creator: string,
    challengeType: bigint,
    opponent: string,
    gameType: string,
    tournamentId: string,
    payToken: string,
    metadata: string,
    entryFee: bigint,
    title: string,
    console: string,
    scheduledAt: bigint,
    betable: boolean,
    marketId: string,
    monitor: string,
    creatorStream: string,
    reserved: string,
  ) => Promise<string>;
  createHeadsUpChallenge: (
    creator: string,
    challengeType: bigint,
    opponent: string,
    gameType: string,
    tournamentId: string,
    payToken: string,
    metadata: string,
  ) => Promise<string>;
  getChallengeInfo: (
    id: string,
  ) => Promise<[] | [ChallengeInfoCanister]>;
  listChallenges: () => Promise<[string, ChallengeInfoCanister][]>;
  joinChallengeEx: (
    id: string,
    player: string,
    opponentStream: string,
  ) => Promise<boolean>;
  submitScoreEx: (
    id: string,
    p1: bigint,
    p2: bigint,
    reporter: string,
    isFinal: boolean,
  ) => Promise<boolean>;
  confirmScore: (id: string, confirmer: string) => Promise<boolean>;
  requestMutualCancel: (
    id: string,
    who: string,
    serviceFee: bigint,
  ) => Promise<boolean>;
  withdrawMutualCancel: (id: string, who: string) => Promise<boolean>;
  acceptMutualCancel: (id: string, who: string) => Promise<boolean>;
  disputeMutualCancel: (
    id: string,
    who: string,
    video: string,
    reason: string,
  ) => Promise<boolean>;
  openChallengeBetable: (
    id: string,
    who: string,
    marketId: string,
    scheduledAt: bigint,
    monitor: string,
  ) => Promise<boolean>;
  setPlayerStream: (
    id: string,
    who: string,
    streamUrl: string,
  ) => Promise<boolean>;
  setChallengeMonitor: (
    id: string,
    who: string,
    monitor: string,
  ) => Promise<boolean>;
  getChallengeDepositAddressICP: (id: string) => Promise<string>;
  getChallengeSubaccount: (id: string) => Promise<number[] | Uint8Array>;
  getTournamentDepositAddressICP: (id: string) => Promise<string>;
  getTournamentSubaccount: (id: string) => Promise<number[] | Uint8Array>;
  getBackendPrincipal: () => Promise<string>;
  markBetableSettled: (
    entityId: string,
    who: string,
    settled: boolean,
  ) => Promise<boolean>;
  isBetableSettled: (entityId: string) => Promise<boolean>;
  createTournamentEx: (
    creator: string,
    entryFee: bigint,
    payToken: string,
    maxParticipants: bigint,
    xftToJoin: bigint,
    isFFA: boolean,
    gameType: string,
    metadata: string,
    title: string,
    console: string,
    scheduledAt: bigint,
    betable: boolean,
    marketId: string,
    hostFeeBps: bigint,
    teamEntry: boolean,
    streamUrl: string,
  ) => Promise<string>;
  getTournamentInfo: (
    id: string,
  ) => Promise<[] | [TournamentInfoCanister]>;
  listTournaments: () => Promise<[string, TournamentInfoCanister][]>;
  joinTournament: (id: string, player: string) => Promise<boolean>;
  setTournamentBetable: (
    id: string,
    who: string,
    betable: boolean,
    marketId: string,
  ) => Promise<boolean>;
  upsertGamer: (
    wallet: string,
    username: string,
    avatarUrl: string,
  ) => Promise<void>;
  getTeamWinSplits: (
    teamId: string,
  ) => Promise<{ member: string; winSplitBps: bigint }[]>;
  previewTeamTournamentClaim: (
    tournamentId: string,
    pot: bigint,
    winningTeamId: string,
  ) => Promise<
    | []
    | [
        {
          pot: bigint;
          hostFeeBps: bigint;
          hostCut: bigint;
          platformRake: bigint;
          teamPrizePool: bigint;
          teamId: string;
          lines: { member: string; winSplitBps: bigint; amount: bigint }[];
          splitsValid: boolean;
          splitsTotalBps: bigint;
        },
      ]
  >;
  claimTournamentTeam: (
    tournamentId: string,
    pot: bigint,
    winningTeamId: string,
    serviceFee: bigint,
  ) => Promise<boolean>;
  claimTournament: (
    tournamentId: string,
    pot: bigint,
    winner: string,
    serviceFee: bigint,
  ) => Promise<boolean>;
  getTournamentSettlement: (
    id: string,
  ) => Promise<
    | []
    | [{ pot: bigint; rakePercent: bigint; rake: bigint; winner: string; claimed: boolean }]
  >;
  [key: string]: unknown;
};

export async function createBackendActor(
  identity?: Identity | null,
): Promise<GamerholicBackend | null> {
  if (!isCanisterConfigured()) return null;
  const agent = await createAgent(identity);
  return Actor.createActor(backendIdlFactory as never, {
    agent,
    canisterId: CANISTER_IDS.gh_backend,
  }) as unknown as GamerholicBackend;
}

export async function createMediaActor(identity?: Identity | null) {
  if (!CANISTER_IDS.gh_media) return null;
  const agent = await createAgent(identity);
  return Actor.createActor(mediaIdlFactory as never, {
    agent,
    canisterId: CANISTER_IDS.gh_media,
  });
}

export function icpToE8s(icp: number): bigint {
  if (!Number.isFinite(icp) || icp < 0) return BigInt(0);
  return BigInt(Math.round(icp * 1e8));
}

export function e8sToIcp(e8s: bigint | number): number {
  const n = typeof e8s === "bigint" ? Number(e8s) : e8s;
  return n / 1e8;
}

/** JS Date → Motoko Time.now units (nanoseconds since epoch) */
export function dateToNs(d: Date | null | undefined): bigint {
  if (!d || Number.isNaN(d.getTime())) return BigInt(0);
  return BigInt(d.getTime()) * BigInt(1_000_000);
}

export function nsToIso(ns: bigint | number): string | null {
  const n = typeof ns === "bigint" ? Number(ns) : ns;
  if (!n) return null;
  try {
    return new Date(n / 1e6).toISOString();
  } catch {
    return null;
  }
}

/** Unwrap candid Opt: [] | [T] */
export function unwrapOpt<T>(v: [] | [T] | T | null | undefined): T | null {
  if (v == null) return null;
  if (Array.isArray(v)) return v.length ? (v[0] as T) : null;
  return v as T;
}
