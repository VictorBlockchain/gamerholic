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
# Stable principal across gamerholic.fun + canister URL (required)
NEXT_PUBLIC_APP_URL=https://gamerholic.fun
NEXT_PUBLIC_II_DERIVATION_ORIGIN=https://gamerholic.fun
NEXT_PUBLIC_SUPABASE_URL=…
NEXT_PUBLIC_SUPABASE_ANON_KEY=…
```

### Internet Identity — stable principal

| Piece | Purpose |
|-------|---------|
| `derivationOrigin=https://gamerholic.fun` | Same II anchor → same principal on every host |
| `public/.well-known/ii-alternative-origins` | Allows `u5jll-….icp0.io`, raw, `www` to use that derivation |
| `public/.well-known/ic-domains` | Custom domain registration on the assets canister |

**Not caused by redeploy:** Motoko/assets upgrades never change II principals.  
**Caused by:** logging in from different hostnames without a fixed derivation origin, **or** a static FE build that baked `NEXT_PUBLIC_IC_HOST=http://127.0.0.1:4943` (agent hits local dfx → “Cannot reach the IC HOST”).

**Runtime guard (required):** on `gamerholic.fun` / `*.icp0.io`, always use `https://icp0.io` + mainnet canister IDs even if env was wrong at build time. See **[ii-principal-stability.md](./ii-principal-stability.md)**.

Prefer opening **https://gamerholic.fun**. Users who deposited under an older principal still have funds under that principal until they use it again or migrate.

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
export CI=1 TERM=xterm-256color DFX_WARNING=-mainnet_plaintext_identity
dfx identity use mainnet   # or controller identity
dfx deploy gh_backend --network ic --identity mainnet --yes
dfx deploy gh_media --network ic --identity mainnet --yes   # when media changed
```

If `dfx deploy` wants to create canisters: set `canister_ids.json` under the project with `"ic"` keys filled so dfx upgrades in place.

### Last successful upgrade (2026-08-04)

| Canister | ID | Notes |
|----------|-----|--------|
| gh_backend | `u2in7-tiaaa-aaaab-qc2jq-cai` | ICRC-1 TransferError, arcade submit fee, stable `listAdmins` / `setAdmin` |
| gh_assets | `u5jll-6qaaa-aaaab-qc2ja-cai` | II derivation `gamerholic.fun`, runtime mainnet host, admin nav |

Ledger check: `getIcpLedgerPrincipal` → `ryjl3-tyaaa-aaaaa-aaaba-cai`.  
Details: [icrc1-transfers-and-errors.md](./icrc1-transfers-and-errors.md) · [ii-principal-stability.md](./ii-principal-stability.md).

## Supabase

1. SQL Editor → paste full `supabase/schema.sql` (includes arcade + `gh_arcade_scores`).
2. Realtime publication includes `gh_arcade_*` tables.
3. Prefer security-definer RPCs: `upsert_gh_profile`, `gh_arcade_upsert_game`, `gh_arcade_upsert_score`, session RPCs.
4. **Session start:** do **not** rely on `gen_random_bytes` / pgcrypto. Current RPC uses client seed + `gen_random_uuid()` fallback.  
   Hotfix file: `supabase/migrations/fix_start_session_no_pgcrypto.sql`  
   (Symptom: Free play → “Could not start session” / `function gen_random_bytes(integer) does not exist`.)

## FE static env note

Next.js only inlines `process.env.NEXT_PUBLIC_*` with **static** property access.  
`canisters.ts` must not use `process.env[dynamicKey]` or the browser sees empty canister IDs.

**Build for IC:** export mainnet `NEXT_PUBLIC_*` in the shell (`.env.local` has local canister IDs and can override `.env.production`).

```bash
export CI=1 TERM=xterm-256color
export NEXT_EXPORT=1
export NEXT_PUBLIC_IC_NETWORK=ic
export NEXT_PUBLIC_IC_HOST=https://icp0.io
export NEXT_PUBLIC_GH_BACKEND_CANISTER_ID=u2in7-tiaaa-aaaab-qc2jq-cai
export NEXT_PUBLIC_GH_MEDIA_CANISTER_ID=ubnr2-jqaaa-aaaab-qc2la-cai
export NEXT_PUBLIC_II_URL=https://identity.ic0.app
# plus Supabase URL + anon from .env.local
npm run build:ic && dfx deploy gh_assets --network ic
```

Or: `npm run deploy:ic:assets` after ensuring production env wins.

## Deep links on `gh_assets`

- `trailingSlash: true` static export.
- `generateStaticParams` prebuilds `/arcade/play/{id}/` from `gh_arcade_games` at build time.
- Fallback: `/arcade/play/?id=…` always works without a prebuilt path.
- Unknown path assets may return root `index.html` (visitor home) — rebuild after new games.

Live: https://gamerholic.fun · assets `u5jll-6qaaa-aaaab-qc2ja-cai`.

## Compatibility

- Same II production provider (`identity.ic0.app`) for stable principals when `derivationOrigin` matches production host.
- Local: omit derivationOrigin; use local canister IDs from `dfx canister id`.
