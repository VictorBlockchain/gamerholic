# Gamerholic — Canisters + Supabase Realtime

**Updated:** 2026-07-30  
**Pattern source:** `../afta.cash` (`notes/design/supabase-canister-sync.md`, `use-event-stream.ts`)

## Architecture

```
┌────────────────────┐   II / identity write    ┌──────────────────┐
│  Next FE (3020)    │ ───────────────────────► │ gh_backend       │
│  Challenge UI      │ ◄── query (optional) ─── │ gh_media (Motoko)│
└─────────┬──────────┘                          └────────┬─────────┘
          │ Realtime SELECT                               │
          │ + RPC upsert_gh_*                             │ (future HTTPS outcall)
          ▼                                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  Supabase (gh_* tables)                                          │
│  · Read-optimized index                                          │
│  · postgres_changes → useGhEventStream → GhEventProvider bus     │
└──────────────────────────────────────────────────────────────────┘
```

| Layer | Role |
|-------|------|
| **Canisters** | Source of truth for escrow, scores, settlement, disputes |
| **Supabase** | Mirror + Realtime for snappy UI (never spend against mirror alone) |
| **Demo store** | `lib/challenges.ts` when canister/env missing |

## Migrated canisters (from `../gamerholic`)

| Canister | Source | FE |
|----------|--------|-----|
| `gh_backend` | `canisters/backend/main.mo` (~7.7k lines) | `src/lib/ic/idl.ts` + `createBackendActor` |
| `gh_media` | `canisters/media/media.mo` | `src/lib/ic/media-idl.ts` |

```bash
# From gamerholic_new
dfx start --background --clean
dfx deploy gh_backend
dfx deploy gh_media
# Set NEXT_PUBLIC_GH_BACKEND_CANISTER_ID from dfx canister id gh_backend
```

## Supabase apply

1. SQL Editor → paste `supabase/schema.sql` (single file: mirrors + profiles + arcade)
3. Dashboard → Database → Publications → ensure `gh_challenges`, `gh_tournaments`, `gh_markets`, `gh_messages`, `gh_challenge_events`, `gh_arcade_sessions` are in **supabase_realtime**
4. Env:

```bash
NEXT_PUBLIC_SUPABASE_URL=…
NEXT_PUBLIC_SUPABASE_ANON_KEY=…
NEXT_PUBLIC_IC_HOST=http://127.0.0.1:4943
NEXT_PUBLIC_DFX_NETWORK=local
NEXT_PUBLIC_GH_BACKEND_CANISTER_ID=<dfx id>
NEXT_PUBLIC_GH_MEDIA_CANISTER_ID=<dfx id>
```

## FE modules

| Path | Purpose |
|------|---------|
| `src/lib/ic/canisters.ts` | Agent + actor factory (dexsta-style) |
| `src/lib/ic/challenge-service.ts` | load/submit/confirm + mirror after write |
| `src/lib/supabase/mirror.ts` | `upsert_gh_challenge_mirror` / tournament |
| `src/hooks/use-gh-event-stream.ts` | postgres_changes → bus |
| `src/context/event-context.tsx` | App-wide `GhEventProvider` |
| `src/lib/events/*` | Typed domain events |

## Write path (example: score confirm)

1. UI action (demo or canister `submitScore` / `confirmScore`)
2. `syncLocalChallenge` → updates demo map + `mirrorChallenge` RPC
3. Supabase row UPDATE fires Realtime
4. Other clients' `useChallengeRealtime(id)` merges scores/status

## Wired (2026-07-30)

- [x] Challenge create (`createChallengeEx`) — dashboard form
- [x] Challenge list / detail load from canister (no DEMO catalog)
- [x] Accept join (`joinChallengeEx` + stream)
- [x] Score submit/confirm (`submitScoreEx` / `confirmScore`)
- [x] Mutual cancel + video dispute on-chain
- [x] Open betable on standalone challenge (`openChallengeBetable`)
- [x] Tournament create (`createTournamentEx` — schedule, betable, host fee, team entry)
- [x] Tournament list / detail from canister
- [x] Host open betable (`setTournamentBetable`)

## Wired (dashboard / rooms — 2026-07-30)

- [x] Dashboard discovery: tournaments, rooms, online (presence), arena stats from canister/Supabase
- [x] Rooms list + `/chat/[id]` from `listRooms` / `getRoomInfo` + `gh_rooms` Realtime
- [x] Presence heartbeat → `gh_presence`
- [x] Host create room → `createRoom` on-chain
- [x] Host edit room → `updateRoom`
- [x] My markets from `gh_markets` / `gh_market_wagers` (no DEMO_MY_MARKETS)

## High Score Arcade (hybrid)

Design: [`high-score-arcade.md`](./high-score-arcade.md) · SQL: `supabase/schema.sql` (arcade section)

| Layer | Role |
|-------|------|
| **Supabase** | `gh_arcade_games` (CSS/gameCode catalog — **not on-chain**), session `t_start`/`t_end`, score events, chain confirm |
| **Canister** | Play fee, per-game escrow, prize settle, claim (demo adapter until Motoko) |
| **Idempotency** | Settle keyed by `session_id` — retry cannot double-pay |
| **Session seed** | Client hex seed preferred; RPC must **not** call `gen_random_bytes` (pgcrypto optional / often absent) |

- [x] Client secure session + retry settle  
- [x] Catalog local / Supabase upsert  
- [x] `gh_arcade_start_session` without `gen_random_bytes` (migration + client seed)  
- [ ] Motoko arcade settle + claim  

## Still incremental

- [ ] Internet Identity identity object (currently Address = username/principal text)
- [ ] Escrow deposit QR from `getChallengeDepositAddressICP` (currently synthetic text)
- [ ] Teams still local demo store (`lib/teams.ts`)
- [ ] Profile history / wallet ledger (partial — stats from canister, history still demo in profile)
- [ ] Battle page DEMO_FIGHTERS attribute showcase
- [ ] Optional canister HTTPS outcall → `upsert_gh_challenge_mirror`
- [ ] Dispute video blob → `gh_media.addDisputeVideo`
- [ ] Arcade Motoko settle (see high-score-arcade open items)
- [ ] Dexsta label auth via real II principal (not demo)

## Status codes (Motoko)

| Nat | Meaning |
|-----|---------|
| 0 | cancelled (legacy) |
| 1 | open |
| 2 | live / in progress |
| 3 | score submitted (pending confirm) |
| 4 | settled (confirmed) |
| 5 | disputed |
| 6 | mutual cancel |

## New challenge fields

`title`, `console`, `scheduledAt` (ns), `betable`, `marketId`, `monitor`, `creatorStream`, `opponentStream`, `scoreIsFinal`, `cancelRequester`, `disputeVideo`, …

## Deploy

```bash
dfx start --background --clean
dfx deploy gh_backend gh_media
export NEXT_PUBLIC_GH_BACKEND_CANISTER_ID=$(dfx canister id gh_backend)
export NEXT_PUBLIC_IC_HOST=http://127.0.0.1:4943
export NEXT_PUBLIC_DFX_NETWORK=local
```
