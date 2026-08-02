# Gamerholic Supabase (`gh_*`)

Read-optimized **mirror** of ICP canisters for Realtime frontend display, plus High Score Arcade session clock / catalog.

**Canisters = source of truth** for escrow, scores, settlement.  
**Supabase = index + Realtime** (+ arcade timers) — never settle funds from mirror alone.

Design: [`../notes/design/canister-supabase-realtime.md`](../notes/design/canister-supabase-realtime.md)

## Apply (one file)

1. Supabase Dashboard → **SQL Editor**
2. Paste + run **[`schema.sql`](./schema.sql)** — full stack (mirrors, profiles, rooms, arcade catalog, sessions, **leaderboard scores**)
3. **Database → Publications** (`supabase_realtime`): confirm these tables are included  
   `gh_challenges`, `gh_challenge_events`, `gh_tournaments`, `gh_markets`, `gh_messages`,  
   `gh_arcade_sessions`, `gh_arcade_games`, `gh_arcade_score_events`, `gh_arcade_scores`  
   (the script also tries to add them)

### Hotfix: Free play “Could not start session” / `gen_random_bytes`

If free play fails with `function gen_random_bytes(integer) does not exist`, run:

**[`migrations/fix_start_session_no_pgcrypto.sql`](./migrations/fix_start_session_no_pgcrypto.sql)**

That replaces `gh_arcade_start_session` so it no longer needs the `pgcrypto` extension.

### Arcade storage (no localStorage for content)

| Data | Table / RPC |
|------|-------------|
| Game CSS + gameCode | `gh_arcade_games` / `gh_arcade_upsert_game` |
| Play sessions (testing + live) | `gh_arcade_sessions` + score event RPCs |
| Paid leaderboard | `gh_arcade_scores` / `gh_arcade_upsert_score` |

> `arcade_schema.sql` is a **deprecated stub**. All arcade DDL/RPCs live in `schema.sql`.

### Arcade hybrid security

| Layer | Role |
|-------|------|
| **Supabase `now()`** | Session `t_start` / `t_end`, remaining clock, score events |
| **RPC** | `gh_arcade_start_session`, `gh_arcade_session_clock`, `gh_arcade_submit_score_event`, `gh_arcade_finalize_session`, `gh_arcade_confirm_canister` |
| **ICP canister** | Escrow + prize settle (async; may lag) |
| **Confirm** | After canister: `gh_arcade_confirm_canister` updates session status |

Client: `src/lib/arcade/secure-session.ts` · catalog: `src/lib/arcade/store.ts`

**Game content storage:** `gh_arcade_games` holds title, cover, **CSS**, and **gameCode** (Phaser JS).  
**Not on-chain** — too large for Motoko. ICP/canisters handle fees, escrow, settlement only.

**Approval columns:** `status` (`testing` \| `live`), `upvotes`, `upvoted_by` (jsonb principal list).  
New rows start as **testing**; **10 unique upvotes** → **live**. Re-run `schema.sql` (idempotent `IF NOT EXISTS` / `create or replace`) to upgrade existing projects.

**Canister lag / failed confirm:** Supabase keeps `final_score` on the session.  
Retry with `retryCanisterSettle(sessionId)` — reuses that score only (no new fee).  
Settlement is idempotent on `session_id` so a second success cannot double-pay.

## Env

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Profiles (`gh_profiles`)

II login loads/saves the gamer row by **principal** via `upsert_gh_profile` RPC (see `schema.sql`).  
No profile localStorage in production — session identity is AuthClient only.

Client: `src/lib/supabase/client.ts`  
Mirror RPCs: `upsert_gh_challenge_mirror`, `upsert_gh_tournament_mirror`, `insert_gh_challenge_event`
