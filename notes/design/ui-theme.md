# Gamerholic UI · fun web3 esports (`gamerholic_new`)

**Status:** active — UI-first  
**Updated:** 2026-07-30  
**Stack:** Next.js · Chakra UI v3 · dark-first  
**Deep dive:** [`design-system.md`](./design-system.md) · **Gallery:** `/ui-kit`

> Electric **volt** · prize **magenta** · attribute **violet** · live **cyan**. Glass cards on night canvas. Not the retired steel/bronze “masculine” pass.

---

## 1. Product pillars

| Pillar | User value | UI tone |
|--------|------------|---------|
| **Host tournaments & rooms** | Host fee bps / room take | `prize` |
| **Play (heads-up)** | 1v1 escrow challenges | `brand` |
| **High Score Arcade** | Try fee · fails bank · Phaser cabinets | `attr` / arcade |
| **Attributes as assets** | Equip stats on Dexsta XFTs | `attr` |
| **Betable markets** | Esports prediction on events | `prize` chip |
| **Free tournaments** | Community vault funded | `attr` vault |

---

## 2. Visual system (current)

| Role | Token / feel |
|------|----------------|
| Canvas | Night purple-black (`night.900` / `bg.canvas`) |
| Primary / play | **Volt lime** `brand.*` `#a3ff3d` |
| Money / host / markets | **Prize magenta** `prize.*` `#f43fa8` |
| Attributes / pass / loadout | **Violet** `attr.*` `#8b5cf6` |
| Live / rooms / console | **Cyan** `live.*` `#22d3ee` |

**Fonts:** Orbitron (display / buttons) · Rajdhani (body) · Share Tech Mono  
**Spacing:** golden-ratio ladder `phi1…phi6`  
**Content max:** **84rem**  
**Under header:** `.gh-main` uses `--gh-content-gap` / `--gh-content-gap-md` (header + safe + φ gap) — standard on **all** pages; don’t re-pad per route  
**Dividers:** `SectionDivider` — volt/prize/attr/live rails + gem  

### Cards

`MatchCard` differentiates **heads-up vs tournament vs room vs arcade** (badge, rail, CTA, economics labels). Empty seats render **Open slot** placeholders. Optional floating **Betable** market chip → `/markets/{id}`.

### Surfaces

Prefer `GhSurface variant="glass"` for storefront cards (hero-like translucency). Solid `panel` / `elevated` for dense forms.

---

## 3. Layout chrome

| Breakpoint | Behavior |
|------------|----------|
| Mobile | Fixed header + bottom tabs (Play · Host · **Create FAB** · Arcade · You) |
| Desktop | Header nav · content max 84rem · footer · no bottom nav |

---

## 4. Key routes

| Route | Role |
|-------|------|
| `/` | Guest storefront: hero, vault, pillars, attributes, live board |
| `/dashboard` | **Logged-in discovery**: tournaments, online users, chatrooms, quick challenge |
| `/host` · `/tournaments` · `/rooms` | Operator / join |
| `/challenges` | Heads-up |
| `/arcade` · `/attributes` · `/battle` | Skill + XFT |
| `/markets` · `/markets/[id]` | Esports betable markets |
| `/create` | Type picker |
| `/ui-kit` | **Full primitive gallery** |

Chat dock (Gmail-style) mounts when session is active — see [`dashboard-chat.md`](./dashboard-chat.md).

---

## 5. Primitives (summary)

| Group | Exports |
|-------|---------|
| Core | `GhButton` `GhBadge` `GhSurface` `SectionDivider` |
| Overlay | `GhModal` `GhModalActions` `GhTooltip` `GhTabs` `ghToast` `GhToaster` |
| Form | `GhField` `GhInput` `GhTextarea` `GhSwitch` `GhCheckbox` |
| Feedback | `GhAlert` `GhProgress` `GhMeter` `GhSpinner` `GhSkeleton` |
| Display | `GhAvatar` `GhStat` `GhKbd` `GhEmptyState` |

Theme: `src/theme/gamerholic-system.ts`  
Attributes: `src/lib/attributes.ts`

---

## 6. Spectacle (fun layer)

| Piece | Path |
|-------|------|
| Mode skins | `ModeHeader` |
| Live ticker | `LiveTicker` |
| Count-up | `CountUp` |
| Money strips | host / arcade formula strips |
| Battle HUD | `StatRadar` · loadout ring |

---

## 7. Next UI

- [ ] Multi-step host tournament / room wizards with fee sliders  
- [x] Arcade create (inline form, white on-dark fields, mock preview)  
- [x] Arcade play (host SCORE/TIME, claim/retry, equip strip)  
- [ ] Arcade Motoko settle (still demo adapter)  

See [`high-score-arcade.md`](./high-score-arcade.md).  

- [ ] Attribute equip onto XFT picker  
- [ ] Drawer / menu primitives on ui-kit  
- [ ] Moderator table kit  

## Dev

```bash
cd gamerholic_new && npm run dev   # :3020 → /ui-kit
```
