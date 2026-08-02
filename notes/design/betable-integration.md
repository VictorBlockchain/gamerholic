# Betable ↔ Gamerholic integration

## Product rules

1. **Mint Esports label on dexsta** → used as the Esports category on betable.
2. **Host** must be a **betable member** with category access (XFT / license). Teams do **not** need accounts.
3. **Multi-outcome markets** use free-text labels (`Team Alpha`, …) via `external_outcomes=true`.
4. **Winner fee split** always pays the **tournament/challenge escrow** (`fixed_split_recipient` + subaccount), no matter which outcome wins.
5. **Creator fee = 1%** (`0.01`) paid to the market creator = tournament host.
6. **Prize claim** on gamerholic is blocked until the betable market is **`#resolved`** (not merely closed).
7. **`stop_bets`** closes trading early without finalizing/resolving.

## Betable API changes

### `market_factory.create_market` (new trailing args)

| Arg | Type | Meaning |
|-----|------|---------|
| `external_outcomes` | `Bool` | Free-text outcomes (teams); no `username\|principal` required |
| `fixed_split_recipient` | `?Principal` | Always receive winner-fee split (escrow owner) |
| `fixed_split_subaccount` | `?Blob` | ICRC-1 subaccount (32 bytes) for pot |

When `external_outcomes && split_with_winner`, `fixed_split_recipient` is **required**.

### `market_factory.stop_bets(market_id)`

- Sets status → `#closed` without resolving.
- Creator may call anytime while `#active`.
- After `close_date`, anyone may call (same gate as `close_market`).
- Does **not** pay out or void.

### Resolution

`fixed_split_recipient` overrides per-outcome principal parsing. Transfers support optional subaccount (escrow pot).

## Gamerholic wiring

| Piece | Path |
|-------|------|
| Client IDL | `src/lib/ic/betable-idl.ts` |
| Service | `src/lib/ic/betable-service.ts` |
| Open market | `openTournamentBetableMarket` in `tournament-service.ts` |
| Claim gate UI | `claim-payout-panel.tsx` |
| Claim gate canister | `markBetableSettled` / `requireBetableSettled` in `main.mo` |
| Stop bets UI | Host controls on tournament detail |

### Env

```bash
NEXT_PUBLIC_BETABLE_MARKET_FACTORY_ID=<market_factory canister id>
NEXT_PUBLIC_BETABLE_APP_URL=https://betable.fun   # optional
NEXT_PUBLIC_BETABLE_ESCROW_SPLIT_PCT=100          # optional; % of 1% creator fee → escrow
```

### Flow

```
Host (betable member) opens betable on tournament
  → create_market(
       category=Esports,
       multi_outcome,
       external_outcomes=true,
       outcomes=["Team A","Team B",…],
       creator_fee=0.01,
       split_with_winner=true,
       fixed_split_recipient=gh_backend,
       fixed_split_subaccount=tournament_sub
     )
  → setTournamentBetable(id, host, true, marketId)
  → betableSettled flag = false

Match/tournament starts
  → stop_bets(marketId)   // optional early close

Market resolves on betable (#resolved)
  → winner fee → escrow; host keeps remainder of creator fee

Host claims prize pot on gamerholic
  → FE checks market.status === resolved
  → markBetableSettled(id, host, true)
  → claimTournament / claimTournamentTeam
```

## Multi-outcome roster updates (join / leave)

Outcomes can change while the market is **`pending` or `active`** (Esports + `external_outcomes` only):

| Event | API | Effect |
|-------|-----|--------|
| Join tournament/match | `POST /api/esports/outcomes` `action=add` | Append outcome with **label, avatar_url, source_id**, `entity_id` (tournament/match) |
| Leave / withdraw (not loss) | `action=remove` | Soft-deactivate (`active=false`); index stays stable for open bets |
| Create market | `action=link` | Seed outcomes + bind `entity_id` / `entity_kind` |

Canister methods (same rules): `esports_add_outcome`, `esports_remove_outcome`, `link_esports_market`.

**Not** updated on match loss — only registration withdraw.

## Settle on finalize

| Event | Call |
|-------|------|
| Tournament claim (solo/team) | `POST /api/esports/settle` then `claimTournament*` |
| Heads-up score confirm | `settle` with winner `source_id` |

Route: `market_resolution.settle_esports` (stop bets + resolve multi).

## Security (gamerholic only)

```
# betable server
GAMERHOLIC_API_SECRET=<shared secret>

# gamerholic server (never NEXT_PUBLIC_)
GAMERHOLIC_API_SECRET=<same>
BETABLE_API_URL=https://betable.fun   # or local
```

Headers: `x-gamerholic-secret: <secret>`

In production, missing secret → **503** on betable. Local dev allows open if unset.

Auth on-chain for outcome mutations: market **creator** | **esports operator** | **admin**.  
Register operators: `market_factory.add_esports_operator(principal)`.

## Fee model note

Betable routes **split_with_winner** as a **percentage of creator fee**, not of total volume.

- Default: `creator_fee=0.01`, `escrow_split=100` → entire 1% of volume goes to escrow; host earns **0** from market fees (host still earns entry-pot host fee %).
- To give host a full 1% **and** grow the pot, raise creator fee (e.g. 0.09) and set split so escrow gets ~8% of volume and host ~1% — or set `NEXT_PUBLIC_BETABLE_ESCROW_SPLIT_PCT=0` so host keeps the full 1% and no escrow fee share.

## Upgrade note (betable)

Adding fields to `Market` changes the stable type. Redeploy market_factory with care (migration / reinstall on local). Crypto engine and create UI callers updated for new `create_market` args.
