# High Score Arcade — design notes

**Status:** active (product scaffold + hybrid timer/settle + community approval + mainnet ICP insert)  
**Updated:** 2026-08-04  
**Routes:** `/arcade`, `/arcade/play/[id]`, `/arcade/play/?id=` (static-export fallback)  
**Code:** `src/lib/arcade/*`, `src/components/arcade/*`, `supabase/schema.sql` (arcade section)  
**ICP money path:** [icrc1-transfers-and-errors.md](./icrc1-transfers-and-errors.md)

---

## 1. Product

Players run short **Phaser 3** cabinets. Paid inserts rank on a per-game board; fees enter **per-game escrow**. Prizes / refunds / creator cuts **accrue in escrow** and are **claimed** to the player subaccount (not auto-credited).

| Mode | Fee | Board | Settlement |
|------|-----|-------|------------|
| **Free** | 0 | Practice only | No prize path |
| **Ranked** | `playFee` (ICP or GAMER) | Official leaderboard | HS refund **or** distribute prize pool |

**Positioning:** skill-as-content — kings print when challengers fail; creators earn a cut of non-record plays.

### 1.1 Community approval (testing → live)

New cabinets do **not** go live immediately. They enter a **testing** phase so the community can verify score/board registration and catch bugs with real money.

| Step | What happens |
|------|----------------|
| **1. Submit** | Creator ships CSS + gameCode via Add Game → **admin-set submit fee** debited from play sub → platform (`debitArcadeSubmitFeeNativeICP`) → Supabase `status: "testing"`, catalog-visible |
| **2. Playtest** | Anyone can **insert real coins**; paid runs hit the **same leaderboard** as live will use |
| **3. Creator fix** | While `testing`, creator may edit **CSS + gameCode** (and other fields) — **no re-charge** |
| **4. Upvote** | Logged-in testers cast **one upvote each** (principal unique) |
| **5. Go live** | **10 upvotes** → `status: "live"`. **Leaderboard is not reset** — tester scores stay |

**Submit fee (platform):**

| Item | Detail |
|------|--------|
| Policy | `arcadeSubmitFeeE8s` on `gh_backend` (default **0.01 ICP**). Admin: `setArcadeSubmitFeeE8s` / Moderator console → Fees |
| Query | `getArcadeSubmitFeeE8s` · FE: `getArcadeSubmitFeeIcp` |
| Debit | Play sub → `platformFeePrincipal` · amount fixed on-chain (not client-supplied) · + 10_000 e8s ledger fee |
| Idempotency | Same `gameId` + same principal: second debit returns ok (retry after fee if Supabase save failed) |
| Free | Admin sets fee to **0** |

Constants: `ARCADE_LIVE_UPVOTE_THRESHOLD = 10` in `src/lib/arcade/types.ts`.  
Store helpers: `upvoteArcadeGame` / `updateArcadeGameWhileTesting` in `store.ts`.

---

## 2. Architecture split

| Layer | Responsibility |
|-------|----------------|
| **Phaser host (iframe)** | Load engine once; run creator **CSS + gameCode** only — **no full HTML** |
| **Supabase** | Catalog (`gh_arcade_games`: title, cover, CSS, gameCode), session clock (`t_start`/`t_end`), score events, chain-job status |
| **ICP / canisters** | **Submit fee** (`debitArcadeSubmitFeeNativeICP` → platform) when shipping for testing; play fee (`debitArcadePlayFeeNativeICP` → `{ ok, err }`), per-game escrow, prize settle, claim via `gh_backend` + native ICP ledger `ryjl3-…`. FE pre-checks play-sub balance before submit (fee + 1× ledger) and insert (fee + 2× ledger). |
| **Dexsta XFT** | Label-linked **game assets** (type-8 `game_asset`); owner/operator gate on publish |

**Never on-chain:** full game CSS / JS (too large). Storage is off-chain (Supabase when configured, else localStorage).

```
Parent React (score/time HUD, fee UI, leaderboard)
    │  postMessage gamerholic:*
    ▼
Sandboxed iframe  ← Phaser CDN + GamerholicBridge + creator gameCode
```

---

## 3. Game packaging (creator)

Creators submit **two artifacts only**:

1. **CSS** — prefer `#gh-arcade-root { … }`. Do **not** force `canvas { width/height: 100% !important }` (breaks Scale Manager).
2. **gameCode** — must register:

```js
window.GamerholicArcadeGame = {
  boot: function (Phaser, bridge, parentEl) {
    // return new Phaser.Game({ parent: parentEl, ... })
  }
};
```

**Engine:** Phaser **3.80.1** (host CDN). AI prompt: `src/lib/arcade/ai-prompt.ts` (`GAMERHOLIC_ARCADE_AI_PROMPT`).

### Host timer (required)

Host owns the run clock. Games **must not** end on a local countdown.

| Message | Direction | Role |
|---------|-----------|------|
| `gamerholic:init` | parent → game | paid, assets, remainingSec, linkedLabelId |
| `gamerholic:start` | parent → game | begin input / scoring |
| `gamerholic:tick` | parent → game | remainingSec (cosmetic) |
| `gamerholic:stop` | parent → game | host ends run |
| `gamerholic:ready` | game → parent | boot complete |
| `gamerholic:score` | game → parent | live score |
| `gamerholic:end` | game → parent | final score |
| `gamerholic:key` | parent → game | forwarded keyboard |
| `gamerholic:focus` | parent → game | focus / rewire keys |

On `stop` / death: always `bridge.end(score)`.

### Input (required)

Iframe often **lacks keyboard focus**. Pure `createCursorKeys()` is unreliable.

**Source of truth:**

```js
bridge.keyDown("left" | "right" | "up" | "down" | "fire")
// aliases: thrust/jump → up; shoot/space/action → fire
// also: bridge.keys.left, .fire, …
```

Also ship **on-screen touch controls** and OR them with `bridge.keyDown`. Parent captures arrows/WASD/space during a run, blocks page scroll, and posts `gamerholic:key`. Host rebinds Phaser `Key.isDown` getters and soft-patches legacy `cursors.*.isDown` / `wasd.*.isDown` to include `bridge.keyDown`.

---

## 4. Create / approval flow

**UI:** inline show/hide panel on `/arcade` (not a modal) — `AddGamePanel`.

1. Metadata: title, cover, description, rules, fee, token, play time, payout top N (3 or 5).
2. Optional **Dexsta Lead Label id**.
3. Optional accepted game-asset **hints** (ids/roles for AI + UI).
4. CSS + gameCode (empty → Neon Tap starter).
5. **Preview & mock play** — same host + bridge; free or ranked mock; integration checklist:
   - Boot + `ready`
   - Score events
   - Session end  
   Soft gate: submit without verification requires a second confirm.
6. **Submit for testing** → catalog with `status: "testing"`, `upvotes: 0` (Supabase and/or local).
7. Community **inserts real coins**, ranks on board, **upvotes**s.
8. At **10 upvotes** → `status: "live"`; board rows from testing remain.
9. Creator may **edit CSS/gameCode** only while `status === "testing"` (play page editor).

Hub filters: All · Testing · Live. Cards show Testing · N/10 or Live.

### Lead Label authorization (hard gate)

If `linkedLabelId > 0`, creator must be **owner or operator** of that Lead Label on Dexsta:

| Check | Dexsta API |
|-------|------------|
| Owner | `getCardLight` / `getXFT` owner principal |
| Operator | `isOperator(user, labelId)` |
| Name | `getLabelTextById` (display) |

- Demo / anon principals → **blocked**
- Dexsta not configured / label missing → **blocked**
- Form: Verify button + blur re-check; green/red status before publish  

Implementation: `checkLabelAuthority` in `src/lib/ic/dexsta-xft-service.ts`.

Empty label → no equip pipeline (`assets = []` at play time).

---

## 5. Dexsta game assets (play time)

When cabinet has `linkedLabelId > 0`:

1. Host calls `getUserGameAssetXfts(owner)`.
2. Keep assets whose `linkedTo` / `linkedLabelOf` equals cabinet label.
3. Inject as `msg.assets[]` on init (`tokenId`, `role`, `effectivePower`, `bagPowerTokens`, wraps, …).

Wraps + bag power raise `effectivePower`. Empty list → game uses defaults (must not crash).

---

## 6. Prizes & escrow

**Per-game escrow** (demo subaccount id on cabinet). Fees in; claims out.

Non-record paid run (simplified):

1. Creator cut **3%** of fee  
2. Platform **1.5%**  
3. Remainder → prize pool shared by players **strictly above** the run’s score, top **N** (3 or 5) by configured weights  

**New high score:** play fee **refunded** to player (not distributed as prize).

**Claim:** winnings / creator fees sit in `PlayerGameEarnings` until **Claim** to play subaccount.

Leaderboard rows show **score + earnings** where available.

---

## 7. Secure session (hybrid)

```
Insert fee (client debit demo / future ICP)  OR free practice
  → gh_arcade_start_session (Supabase now() → t_start, t_end; client may send seed)
  → play (tick + score events)
  → finalize (final_score on session)
  → async canister settle (paid only)
  → gh_arcade_confirm_canister
```

| Concern | Approach |
|---------|----------|
| Clock authority | Supabase `now()`, not client wall clock |
| Canister lag | Supabase keeps final score; UI can show “pending chain” |
| Resubmit / retry | Idempotent on `sessionId` — `retryCanisterSettle` reuses score, no double fee |
| Free play | Session still opened on Supabase (timer + practice); no ranked board / no prize path |
| Session seed | Client sends hex seed via `crypto.getRandomValues`; RPC fallback is `gen_random_uuid()` **not** `gen_random_bytes` (needs pgcrypto — often missing) |

**Hotfix (2026-08-02):** Free play failed with `function gen_random_bytes(integer) does not exist`.  
Apply `supabase/migrations/fix_start_session_no_pgcrypto.sql` (or full `schema.sql` refresh of `gh_arcade_start_session`).

Client: `src/lib/arcade/secure-session.ts`.  
SQL: `supabase/schema.sql` (arcade section) · apply notes in `supabase/README.md`.

---

## 8. Deep links (static export / IC assets)

Next `output: 'export'` only emits HTML for paths known at build time.

| Path | Role |
|------|------|
| `/arcade/play/{id}/` | Prebuilt via `generateStaticParams` → `arcadePlayStaticParams()` loads published `gh_arcade_games.id` at build |
| `/arcade/play/?id={id}` | Always-available shell (`src/app/arcade/play/page.tsx`) when path not prebuilt |
| Client resolve | `ArcadePlayClient` reads `?id=`, route param, then pathname segment |

**Gotcha:** unknown `/arcade/play/new_id` on the assets canister may fall through to **home** `index.html` (IC SPA-style fallback). After publishing a new cabinet, rebuild + redeploy `gh_assets`, or share `?id=` links.

Build helper: `src/lib/static-params.ts`.

---

## 9. UI / UX notes

| Surface | Notes |
|---------|--------|
| Arcade home | Empty catalog OK (no mock seed cabinets); Add Game toggle; All/Testing/Live filters; AI prompt section |
| Add form | Dark elevated panel, **white** labels/inputs; **Submit for testing** (not instant live) |
| Preview | Auto-reload on CSS/code change; bridge log; mock ranked/free |
| Play (testing) | Banner + upvote CTA; creator CSS/code editor; insert coins = real board |
| Play (live) | Host SCORE/TIME top-left; expand full-screen; equip strip; claim/retry |
| About this cabinet | **Stacked rows** (Overview, then How to play) — not a 2-column grid |
| ModeHeader | Arcade uses attr / volt accents |

---

## 10. Key files

| Area | Path |
|------|------|
| Types (`status`, upvotes, threshold) | `src/lib/arcade/types.ts` |
| Catalog / escrow / upvote / edit | `src/lib/arcade/store.ts` |
| Host document | `src/lib/arcade/engine.ts` |
| Keyboard capture | `src/lib/arcade/keyboard.ts` |
| Prize math | `src/lib/arcade/prize.ts` |
| Secure session | `src/lib/arcade/secure-session.ts` |
| Assets | `src/lib/arcade/assets.ts` |
| AI prompt | `src/lib/arcade/ai-prompt.ts` |
| Static play params | `src/lib/static-params.ts` |
| Play client (id resolve) | `src/components/arcade/arcade-play-client.tsx` |
| Dexsta label auth | `src/lib/ic/dexsta-xft-service.ts` → `checkLabelAuthority` |
| Add / preview / play | `src/components/arcade/*` |
| SQL catalog + status/upvotes | `supabase/schema.sql` (`gh_arcade_games`) |
| Session RPC hotfixes | `supabase/migrations/*` |

---

## 11. Open / next

- [ ] Real Motoko arcade settle (replace demo adapter)  
- [ ] Internet Identity identity pass-through for Dexsta actor calls  
- [ ] Bag power enrichment on equip (full Dexsta bag read)  
- [x] Apply Supabase arcade SQL + session RPC (no `gen_random_bytes`)  
- [x] Arcade platform rake in bps (admin-set; default 150 = 1.5%) — see [`platform-fees-and-dexsta-bag.md`](./platform-fees-and-dexsta-bag.md)  
- [x] Admin platform XFT id · 50% platform fees → Dexsta bag when set  
- [x] Play page: Live/Testing comments (bug|feedback), creator resolve bugs, 5★ testing ratings, overview testers/dates  
- [ ] Apply Supabase `migrations/arcade_comments_ratings.sql` (ops)  
- [ ] Deploy gh_backend + set live platform XFT id  
- [ ] Optional: SPA fallback HTML for unknown play ids (serve play shell, not home)
- [ ] Optional: server-side upvote RPC (principal auth) instead of client upsert  

---

## 11. Related docs

- Concept money loop: [`concept.md`](./concept.md)  
- Fee model + Dexsta bag: [`platform-fees-and-dexsta-bag.md`](./platform-fees-and-dexsta-bag.md)  
- Supabase hybrid: [`canister-supabase-realtime.md`](./canister-supabase-realtime.md), [`../../supabase/README.md`](../../supabase/README.md)  
- UI tokens: [`design-system.md`](./design-system.md), [`ui-theme.md`](./ui-theme.md)  
- Dexsta partners (avatars / labels): Dexsta `notes/design/cross-app-xft-partners.md`  

