/**
 * Gamerholic Supabase table names — always `gh_` prefix
 * (shared projects with dexsta / others).
 *
 * Canisters = SoT. These tables are a read-optimized mirror + Realtime.
 */

export const GH_TABLES = {
  /** DM + room messages (Realtime) */
  messages: "gh_messages",
  /** Esports prediction markets linked to matches */
  markets: "gh_markets",
  /** Market positions / wagers */
  marketWagers: "gh_market_wagers",
  /** Optional presence heartbeat */
  presence: "gh_presence",
  /** Monitor / referee assignments */
  monitors: "gh_monitors",
  /**
   * Assets As Attributes balances — mirrored from on-chain ICRC tokens.
   * Source of truth: chain; DB is cache/index for wallet UI + equip.
   */
  attributeBalances: "gh_attribute_balances",
  /** Heads-up challenges (mirror of canister) */
  challenges: "gh_challenges",
  /** Challenge domain events / activity feed */
  challengeEvents: "gh_challenge_events",
  /** Tournaments (mirror) */
  tournaments: "gh_tournaments",
  /** Tournament entrants / seeds */
  tournamentEntrants: "gh_tournament_entrants",
  /** Teams */
  teams: "gh_teams",
  /** Esports chatrooms / group rooms */
  rooms: "gh_rooms",
  /** Gamer profiles (username / avatar cache) */
  profiles: "gh_profiles",
  /** Sync cursor / health log */
  syncLog: "gh_sync_log",
  /** Arcade secure sessions (Supabase clock + chain confirm) */
  arcadeSessions: "gh_arcade_sessions",
  arcadeScoreEvents: "gh_arcade_score_events",
  arcadeChainJobs: "gh_arcade_chain_jobs",
  /** Arcade game catalog (CSS + gameCode off-chain) */
  arcadeGames: "gh_arcade_games",
} as const;

export type GhTableName = (typeof GH_TABLES)[keyof typeof GH_TABLES];

/** Tables that must be in supabase_realtime publication */
export const GH_REALTIME_TABLES: GhTableName[] = [
  GH_TABLES.messages,
  GH_TABLES.markets,
  GH_TABLES.marketWagers,
  GH_TABLES.challenges,
  GH_TABLES.challengeEvents,
  GH_TABLES.tournaments,
  GH_TABLES.presence,
  GH_TABLES.rooms,
  GH_TABLES.arcadeSessions,
];
