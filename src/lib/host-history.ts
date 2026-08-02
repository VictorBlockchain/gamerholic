/**
 * Host history types — data loads from canister (tournament-service / room-service).
 * No mock seed lists.
 */

export type PastTournament = {
  id: string;
  title: string;
  game: string;
  console: string;
  entryFee: string;
  maxPlayers: number;
  /** Host fee as percent of prize pot (e.g. 2.5 = 2.5%) */
  hostFeePct: number;
  finishedAt: string;
  prizePot: string;
  status: "completed" | "cancelled";
};

export type HostedRoom = {
  id: string;
  name: string;
  game: string;
  console: string;
  members: number;
  maxMembers: number;
  hasGroupPot: boolean;
  potIcp?: string;
  status: "open" | "live" | "closed";
  lastActive: string;
};

/** @deprecated Empty — use listTournaments / listRoomsFromCanister */
export const DEMO_PAST_TOURNAMENTS: PastTournament[] = [];

/** @deprecated Empty — use listRoomsFromCanister */
export const DEMO_HOSTED_ROOMS: HostedRoom[] = [];
