# Gamerholic concept — UI-first

**Updated:** 2026-07-30

## Positioning

**Fun web3 esports on ICP** where:

1. **Hosts make money** running tournaments and game rooms (host fees / room take).  
2. **Arcade kings print** — High Score boards pay you every time challengers fail.  
3. **Dexsta XFTs become fighters** — equip Gamerholic Attribute tokens (Power, Speed, Attack, Defense, …) for Pokémon-style battles.  
4. **Label-linked game assets** — cabinets bind a Dexsta Lead Label; players equip type-8 `game_asset` XFTs nested under that label.

Not “another stake site.” The platform rewards **community operators** and **skill-as-content** (scores, rooms, brackets).

## Money loops

| Loop | Who earns | Mechanism (product) |
|------|-----------|---------------------|
| Tournament host | Host | Host fee bps of pot on finalize |
| Game room host | Host | Room take on settle |
| Arcade holder / top board | Players ranked above a fail | Share of try fee (top 3/5 weights) after creator 3% + platform 1.5% |
| Arcade high-score | New #1 | Play fee **refunded** (not distributed) |
| Arcade creator | Cabinet author | 3% of non-record paid fees (claim from escrow) |
| Fighter owner | Optional | Staked attribute duels |

Platform rake still funds cycles / free pools — orthogonal to host cut.  
**Claim model:** arcade winnings accrue in **per-game escrow** until the user claims to their play subaccount.

## High Score Arcade (summary)

- Creators publish **Phaser 3** cabinets (CSS + `gameCode` only; host owns timer).  
- Content stored **off-chain** (Supabase / local); ICP for fees, escrow, settle.  
- Hybrid session: Supabase clock → finalize → async canister settle (idempotent `sessionId`).  
- Linking a Lead Label requires Dexsta **owner or operator**.  
- Input: `bridge.keyDown` + on-screen controls (iframe keyboard is unreliable alone).  

Full design: [`high-score-arcade.md`](./high-score-arcade.md).

## Attributes as assets

Tokens (tradeable / equippable):

- **Power** · **Speed** · **Attack** · **Defense**  
- **Luck** · **Focus** · **Vitality** · **Crit** (and extensible)

Attach to Dexsta XFTs (Lead Labels, media, 1-of-1s) → battle loadouts.  
Arcade equip path: game-asset media XFTs with `linkedTo` = cabinet Lead Label.

## Mobile app feel

Fixed header + bottom Create FAB + safe areas. Desktop uses a **wide** stage (90rem) for dashboards and multi-column feeds.

## Implementation status (high level)

| Area | Status |
|------|--------|
| UI shell / arcade play + create | Active scaffold |
| Supabase session clock + catalog | Schema + client |
| Motoko arcade settle | Demo adapter → real canister TBD |
| Internet Identity for Dexsta auth | Demo principal still common |

## Out of scope (historical UI-first note)

Original “UI kit locks first” freeze is lifted for arcade hybrid + Dexsta label gates; full Motoko settle and II remain follow-ups.
