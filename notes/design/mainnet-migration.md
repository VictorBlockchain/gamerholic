# Mainnet migration — legacy gamerholic → gamerholic_new

**Date:** 2026-08-02  
**Git:** https://github.com/VictorBlockchain/gamerholic  
**Supabase:** shared yoinx project (`gh_*` schema in `supabase/schema.sql`)

## Already-deployed mainnet canisters (legacy)

From `gamerholic/canister_ids.json`:

| Canister   | Mainnet ID                         |
|------------|------------------------------------|
| gh_backend | `u2in7-tiaaa-aaaab-qc2jq-cai`      |
| gh_media   | `ubnr2-jqaaa-aaaab-qc2la-cai`      |
| gh_assets  | `u5jll-6qaaa-aaaab-qc2ja-cai`      |

**Do not create new mainnet canisters.** Upgrade/redeploy WASM to these IDs.

## Frontend env (production)

```bash
NEXT_PUBLIC_IC_NETWORK=ic
NEXT_PUBLIC_IC_HOST=https://icp0.io
NEXT_PUBLIC_GH_BACKEND_CANISTER_ID=u2in7-tiaaa-aaaab-qc2jq-cai
NEXT_PUBLIC_GH_MEDIA_CANISTER_ID=ubnr2-jqaaa-aaaab-qc2la-cai
NEXT_PUBLIC_II_URL=https://identity.ic0.app
NEXT_PUBLIC_SUPABASE_URL=…
NEXT_PUBLIC_SUPABASE_ANON_KEY=…
```

## What migrates where

| Data | Source of truth | Notes |
|------|-----------------|-------|
| Challenges, tournaments, rooms, escrow | **ICP `gh_backend`** | Upgrade Motoko from `canisters/backend/main.mo` |
| Media covers / uploads | **ICP `gh_media`** | Upgrade from `canisters/media/media.mo` |
| Profiles, chat mirror, markets index | **Supabase `gh_*`** | Apply `supabase/schema.sql` once |
| Arcade catalog (CSS + gameCode) | **Supabase `gh_arcade_games`** | Not Motoko |
| Arcade sessions / score events / leaderboard | **Supabase** | `gh_arcade_sessions`, `gh_arcade_score_events`, `gh_arcade_scores` |
| Play balances (demo) | local until ledger fully wired | Canister has `getUserICPBalance` |

## Deploy steps (mainnet)

```bash
cd gamerholic_new
# Write mainnet IDs (repo canister_ids.json)
# identity with controller rights on u2in7 / ubnr2
export CI=1 TERM=xterm-256color
dfx identity use mainnet   # or controller identity
dfx deploy gh_backend --network ic --argument '(null)'   # if ctor needs args
dfx deploy gh_media --network ic
```

If `dfx deploy` wants to create canisters: set `canister_ids.json` under the project with `"ic"` keys filled so dfx upgrades in place.

## Supabase

1. SQL Editor → paste full `supabase/schema.sql` (includes arcade + `gh_arcade_scores`).
2. Realtime publication includes `gh_arcade_*` tables.
3. Prefer security-definer RPCs: `upsert_gh_profile`, `gh_arcade_upsert_game`, `gh_arcade_upsert_score`, session RPCs.

## FE static env note

Next.js only inlines `process.env.NEXT_PUBLIC_*` with **static** property access.  
`canisters.ts` must not use `process.env[dynamicKey]` or the browser sees empty canister IDs.

## Compatibility

- Same II production provider (`identity.ic0.app`) for stable principals when `derivationOrigin` matches production host.
- Local: omit derivationOrigin; use local canister IDs from `dfx canister id`.
