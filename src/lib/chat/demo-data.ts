/**
 * Shared types + small static constants only (game name seeds when canister empty).
 * No DEMO catalogs for online users, rooms, tournaments, or arena stats.
 */

import type { ChatRoom, ChatUser } from "./types";

export type { ChatUser, ChatRoom };

/** Fallback game list when `listGames` canister is empty / offline */
export const FALLBACK_GAMES = [
  "Street Fighter 6",
  "Tekken 8",
  "Apex Legends",
  "Call of Duty",
  "Rocket League",
  "Smash Ultimate",
  "Valorant",
  "Madden",
  "NBA 2K",
  "Fight Night",
  "Fortnite",
  "Time Attack",
] as const;

/** @deprecated use FALLBACK_GAMES or listOfficialGameNames() */
export const DEMO_GAMES = [...FALLBACK_GAMES];
