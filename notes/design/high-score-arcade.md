# High Score Arcade — design notes

**Status:** active (product scaffold + hybrid timer/settle + community approval)  
**Updated:** 2026-08-01  
**Routes:** `/arcade`, `/arcade/play/[gameId]`  
**Code:** `src/lib/arcade/*`, `src/components/arcade/*`, `supabase/schema.sql` (arcade section)

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
| **1. Submit** | Creator ships CSS + gameCode via Add Game → `status: "testing"`, catalog-visible |
| **2. Playtest** | Anyone can **insert real coins**; paid runs hit the **same leaderboard** as live will use |
| **3. Creator fix** | While `testing`, creator may edit **CSS + gameCode** (and other fields) |
| **4. Upvote** | Logged-in testers cast **one upvote each** (principal unique) |
| **5. Go live** | **10 upvotes** → `status: "live"`. **Leaderboard is not reset** — tester scores stay |

Constants: `ARCADE_LIVE_UPVOTE_THRESHOLD = 10` in `src/lib/arcade/types.ts`.  
Store helpers: `upvoteArcadeGame` / `updateArcadeGameWhileTesting` in `store.ts`.

---

## 2. Architecture split

| Layer | Responsibility |
|-------|----------------|
| **Phaser host (iframe)** | Load engine once; run creator **CSS + gameCode** only — **no full HTML** |
| **Supabase** | Catalog (`gh_arcade_games`: title, cover, CSS, gameCode), session clock (`t_start`/`t_end`), score events, chain-job status |
| **ICP / canisters** | Play fee, per-game escrow, prize settle, claim (demo adapter today; Motoko later) |
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
Insert fee (client debit demo / future ICP)
  → gh_arcade_start_session (Supabase now() → t_start, t_end)
  → play (tick + score events)
  → finalize (final_score on session)
  → async canister settle
  → gh_arcade_confirm_canister
```

| Concern | Approach |
|---------|----------|
| Clock authority | Supabase `now()`, not client wall clock |
| Canister lag | Supabase keeps final score; UI can show “pending chain” |
| Resubmit / retry | Idempotent on `sessionId` — `retryCanisterSettle` reuses score, no double fee |
| Free play | No ranked board / no prize path |

Client: `src/lib/arcade/secure-session.ts`.  
SQL: `supabase/schema.sql` (arcade section) · apply notes in `supabase/README.md`.

---

## 8. UI / UX notes

| Surface | Notes |
|---------|--------|
| Arcade home | Empty catalog OK (no mock seed cabinets); Add Game toggle; All/Testing/Live filters; AI prompt section |
| Add form | Dark elevated panel, **white** labels/inputs; **Submit for testing** (not instant live) |
| Preview | Auto-reload on CSS/code change; bridge log; mock ranked/free |
| Play (testing) | Banner + upvote CTA; creator CSS/code editor; insert coins = real board |
| Play (live) | Host SCORE/TIME top-left; expand full-screen; equip strip; claim/retry |
| ModeHeader | Arcade uses attr / volt accents |

---

## 9. Key files

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
| Dexsta label auth | `src/lib/ic/dexsta-xft-service.ts` → `checkLabelAuthority` |
| Add / preview / play | `src/components/arcade/*` |
| SQL catalog + status/upvotes | `supabase/schema.sql` (`gh_arcade_games`) |

---

## 10. Open / next

- [ ] Real Motoko arcade settle (replace demo adapter)  
- [ ] Internet Identity identity pass-through for Dexsta actor calls  
- [ ] Bag power enrichment on equip (full Dexsta bag read)  
- [ ] Apply Supabase arcade SQL in all environments (incl. status/upvotes columns)  
- [ ] Platform claim path for 1.5% rake  
- [ ] Optional: server-side upvote RPC (principal auth) instead of client upsert  

---

## 11. Related docs

- Concept money loop: [`concept.md`](./concept.md)  
- Supabase hybrid: [`canister-supabase-realtime.md`](./canister-supabase-realtime.md), [`../../supabase/README.md`](../../supabase/README.md)  
- UI tokens: [`design-system.md`](./design-system.md), [`ui-theme.md`](./ui-theme.md)  
- Dexsta partners (avatars / labels): Dexsta `notes/design/cross-app-xft-partners.md`  
