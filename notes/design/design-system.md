# Gamerholic design system

**Status:** active — UI-first scaffold (`gamerholic_new`)  
**Updated:** 2026-07-30  
**Stack:** Next.js 15 · React 19 · Chakra UI v3 · Lucide · next-themes (dark fixed)  
**Live gallery:** [`/ui-kit`](http://localhost:3020/ui-kit)

This document is the **source of truth** for visual language, tokens, component primitives, and product-mapping rules. Prefer it over ad-hoc styling when adding screens.

Related:

- [`ui-theme.md`](./ui-theme.md) — shorter theme cheatsheet  
- [`concept.md`](./concept.md) — product pillars  
- Theme code: `src/theme/gamerholic-system.ts`  
- Primitives: `src/components/ui/*`  
- Product cards: `src/components/cards/match-card.tsx`

---

## 1. Design intent

Gamerholic is **fun web3 esports** — not a generic DeFi dashboard and not “neon candy casino.”

| Intent | What it means in UI |
|--------|---------------------|
| **Arena energy** | Deep night canvas, glass cards, electric accents, HUD labels |
| **Operator economy** | Prize magenta for money paths (host fee, pots, markets) |
| **Skill as product** | Arcade / attribute violet for high-score banks and loadouts |
| **Play clarity** | Volt lime for primary play actions and 1v1 |
| **Trust / chain** | Mono for principals & amounts; non-custodial copy near money |

**Do**

- Dark-first, glass over art, φ spacing rhythm  
- Product **role colors** (brand / prize / attr / live) consistently  
- Gaming typefaces (Orbitron / Rajdhani / Share Tech Mono)  
- Show empty seats as **Open slot** placeholders  
- Floating **Betable** chip when an esports market exists  

**Don’t**

- Default to system Arial / pure gray Material  
- Use steel-blue / bronze “masculine” palette (retired)  
- Mix prize magenta for primary “Play” CTAs (keep prize = money)  
- Hide empty challenger seats  
- Full-bleed desktop content (cap at **84rem**)

---

## 2. Product → color map

Every control and surface should answer: *which product pillar owns this?*

| Role | Token prefix | Hex anchor | Use for |
|------|--------------|------------|---------|
| **Play / brand** | `brand.*` | `#a3ff3d` volt | Primary CTA, 1v1, wallet connect, selection |
| **Money / host** | `prize.*` | `#f43fa8` magenta | Host earn, prize pots, betable markets, tournament rails |
| **Attributes** | `attr.*` | `#8b5cf6` violet | Attribute tokens, Multi Pass, battle loadouts, arcade API accents |
| **Live / room** | `live.*` | `#22d3ee` cyan | Live badges, rooms, console chips, tickers |
| **Success** | `success.*` | `#22c55e` | Settled, claimed |
| **Danger** | `danger.*` | `#f43f5e` | Dispute, destructive confirm |
| **Canvas** | `night.*` / `bg.*` | `#0d0b1a` | App background, elevated panels, glass |

Semantic layers:

```
brand.solid / .fg / .muted / .contrast
prize.solid / .fg / .muted
attr.solid  / .fg / .muted
live.solid  / .fg / .muted
bg.canvas · bg.surface · bg.elevated · bg.muted · bg.glass · bg.glass-strong
fg.default · fg.muted · fg.subtle
border.default · border.strong · border.brand
```

Shadows: `card`, `glow`, `glow-prize`, `glow-attr`, `glow-live`, `nav-fab`.

---

## 3. Typography

Loaded via `next/font` in `src/app/layout.tsx`:

| Face | CSS var | Role |
|------|---------|------|
| **Orbitron** | `--font-display` | Headings, buttons, kickers, HUD labels |
| **Rajdhani** | `--font-body` | Body UI, long copy, form values |
| **Share Tech Mono** | `--font-mono` | Principals, ICP amounts, odds, codes |

Rules:

1. **Headings & buttons** always `fontFamily="heading"` (Orbitron).  
2. Prefer **uppercase + letterSpacing** on kickers (`0.12em`–`0.2em`, `2xs`/`xs`).  
3. Body stays title case; avoid wall-of-text on cards.  
4. Tabular numbers for money: `fontVariantNumeric="tabular-nums"` or mono.

Scale (`fontSizes` tokens): `2xs` → `4xl` (see `/ui-kit` Typography section).

---

## 4. Spacing & layout

### Golden-ratio ladder (φ ≈ 1.618)

From 8px base:

| Token | rem | ~px | Typical use |
|-------|-----|-----|-------------|
| `phi1` | 0.5 | 8 | Tight icon gaps |
| `phi2` | 0.8125 | 13 | Badge / control gaps |
| `phi3` | 1.3125 | 21 | Card padding, stack |
| `phi4` | 2.125 | 34 | Section blocks |
| `phi5` | 3.4375 | 55 | Home “level” gaps |
| `phi6` | 5.5625 | 89 | Rare hero breathing |

Use as Chakra props: `gap="phi3"`, `p="phi4"`, `mb="phi5"`.

### Content chrome

| Token | Value |
|-------|-------|
| Content max | **84rem** (wider storefront; not full viewport) |
| Header height | 56px + safe area |
| Bottom nav | 72px + safe area (mobile) |
| FAB | 56px, center Create |

Home sections use `.gh-home-section` + `.gh-stack-phi-lg` for scannable Dexsta-like rhythm.

### Radii

`sm` → `3xl` + `full`. Cards and modals favor **`2xl` / `3xl`**. Controls favor **`xl`**.

---

## 5. Component inventory

All packaged under `@/components/ui`.

### Foundations

| Component | Purpose |
|-----------|---------|
| `GhButton` | Product variants: primary, prize, attr, live, outline, soft, ghost, danger · sizes xs–lg · left/right icons |
| `GhBadge` | Status + product tones · optional `pulse` for live |
| `GhSurface` | panel · elevated · muted · **glass** · brand · prize · attr · live |
| `SectionDivider` | Gradient rail + gem · tones brand/prize/attr/live/neutral |

### Overlays & navigation

| Component | Purpose |
|-----------|---------|
| `GhModal` | Centered dialog · tone rail · sizes sm–full · `GhModalActions` |
| `GhTooltip` | Glass HUD tooltip + arrow |
| `GhTabs` | Segmented tabs · product tones · fitted/sm |
| `GhToaster` / `ghToast` / `toaster` | App-mounted toasts (success/error/warning/info + action) |

### Forms

| Component | Purpose |
|-----------|---------|
| `GhField` | Label · helper · error · required |
| `GhInput` / `GhTextarea` | Night inputs · focus ring by tone |
| `GhInputShell` | Leading/trailing adornments |
| `GhSwitch` | Toggles · product tones |
| `GhCheckbox` | Rules accept · stakes options |

### Feedback & data display

| Component | Purpose |
|-----------|---------|
| `GhAlert` | Inline policy / error / live banners |
| `GhProgress` / `GhMeter` | Bracket fill, vault %, banks |
| `GhSpinner` | Async settle / load |
| `GhSkeleton` / `GhSkeletonCard` | Loading placeholders |
| `GhAvatar` / `GhAvatarGroup` | Players · online/live status |
| `GhStat` | HUD stat tiles (host bank, volume) |
| `GhKbd` | Shortcut hints |
| `GhEmptyState` | Zero-data boards |

### Product composites (outside `/ui` but design-critical)

| Component | Purpose |
|-----------|---------|
| `MatchCard` | challenge · tournament · room · arcade · seats · betable market chip |
| `FreeTournamentVault` | Community vault art panel |
| `AttributesCurrencyRow` | Assets As Attributes tiles with BG art |
| `FeaturePanel` | Deep-dive sell blocks |
| `HeroSlider` | Logged-out hero product story |
| `ModeHeader` | Route mode skins (host / arcade / battle / play) |
| `LiveTicker` | Marquee live feed |
| `CreateSheet` | Mobile FAB bottom sheet |

---

## 6. Patterns

### 6.1 Kind differentiation (live board)

Never mix tournament and 1v1 styling:

| Kind | Accent | CTA | Economics labels |
|------|--------|-----|------------------|
| `challenge` | Volt / brand | Accept 1v1 | Stake · Winner takes |
| `tournament` | Prize magenta | Join bracket | Entry fee · Prize pool · Host earns |
| `room` | Live cyan | Join room | Buy-in · Room pot |
| `arcade` | Attr violet | Challenge score | Try fee · Fail bank · claim escrow |

Arcade product design: [`high-score-arcade.md`](./high-score-arcade.md).

Live board **sections** (home): Heads-up · Tournaments · Rooms & arcade.

### 6.2 Betable markets (esports)

When `betable` / `market` is set on a match:

1. Floating **Betable** chip (candlestick) top-right → `/markets/{id}`  
2. Market badge in card meta  
3. Footer link “Open betable market”  

Markets are a **spectator / prediction** layer — they do not replace escrow play.

### 6.3 Glass over art

Hero, vault, final CTA, attribute tiles:

1. Full-bleed image  
2. Dark gradient scrim (`brightness` + linear gradient)  
3. `bg.glass` / `bg.glass-strong` content  
4. Product border + optional glow  

### 6.4 Forms near money

- Always show **ICP units** next to stakes  
- Confirm dialogs for cancel / dispute  
- Toast on success/fail of wallet actions  
- Mono for principals  

### 6.5 Toasts

```ts
import { ghToast } from "@/components/ui";

ghToast({
  title: "Host fee credited",
  description: "+2.4 ICP settled.",
  type: "success", // success | error | warning | info
  action: { label: "View host", onClick: () => router.push("/host") },
});
```

`GhToaster` is mounted once in `GamerholicProvider`.

### 6.6 Modals

```tsx
<GhModal
  open={open}
  onOpenChange={setOpen}
  title="Create challenge"
  description="…"
  tone="brand" // brand | prize | attr | live
  footer={
    <GhModalActions
      onCancel={() => setOpen(false)}
      onConfirm={submit}
      confirmLabel="Continue"
    />
  }
>
  {/* fields */}
</GhModal>
```

Mobile create uses **bottom sheet** (`CreateSheet`), not center modal.

---

## 7. Motion & micro-interaction

| Name | Where |
|------|--------|
| `gh-pulse-soft` | FAB glow, live pulse badges |
| `gh-betable-bob` | Floating betable chip |
| `gh-spin` | Spinners |
| `gh-shimmer` | Skeletons |
| `gh-ticker` | Live ticker marquee |
| Card hover | `translateY(-2px)` + role glow |

Keep motion **short** (0.15–0.3s) and optional — never block copy.

---

## 8. Accessibility

- Dialogs use Chakra/Ark `Dialog` (focus trap, Esc, backdrop)  
- Tooltips: delay ~200ms; don’t put essential info only in tooltips  
- `role="alert"` on `GhAlert`  
- Status colors paired with **text labels** (not color alone)  
- Touch targets ≥ ~36–40px (`GhButton` sm height 9 / 36px)  
- `prefers-reduced-motion`: respect later if expanding animation  

---

## 9. File map

```
src/
  theme/gamerholic-system.ts     # tokens + semantic colors
  app/globals.css                # chrome, text utilities, keyframes
  app/ui-kit/page.tsx            # living gallery
  components/ui/                 # Gh* primitives
  components/cards/match-card.tsx
  components/home/*              # storefront sections
  components/shell/*             # header, bottom nav, FAB
  components/spectacle/*         # mode skins, ticker, radar
  components/dashboard/*         # discovery dashboard
  components/chat/*              # Gmail-style dock + windows
  lib/chat/* · lib/supabase/*    # realtime chat service
notes/design/
  design-system.md               # this file
  ui-theme.md                    # short cheatsheet
  dashboard-chat.md              # logged-in discovery + Supabase chat
  concept.md                     # product concept
```

---

## 10. Logged-in product shell

| Surface | Route | Notes |
|---------|-------|-------|
| Guest storefront | `/` | Marketing / conversion |
| **Discovery dashboard** | `/dashboard` | Tournaments · online · rooms · quick challenge |
| Chat dock | global (session) | Gmail-style multi-window · Supabase or demo bus |

Full spec: [`dashboard-chat.md`](./dashboard-chat.md).

**Session:** `SessionProvider` demo login → replace with Internet Identity.  
**Chat:** `ChatProvider` + `ChatDock` in `GamerholicProvider`.

---

## 11. Implementation checklist (new screen)

1. Pick **pillar color** (brand / prize / attr / live).  
2. Use `PageHeader` or `ModeHeader` for route chrome.  
3. Surfaces: prefer `GhSurface variant="glass"` for cards on busy BGs.  
4. Actions: `GhButton` with Lucide icons.  
5. Money: mono or tabular + ICP unit.  
6. Empty: `GhEmptyState` or Open slot placeholders.  
7. Feedback: `ghToast` + `GhAlert` for durable messages.  
8. Document any new primitive on `/ui-kit` and in §5.  
9. Discovery/chat: follow dashboard + dock patterns.

---

## 12. Open UI work

- [x] UI kit overlays (modal · tooltip · toast · tabs · forms)  
- [x] Logged-in dashboard discovery scaffold  
- [x] Gmail-style chat dock + Supabase-ready service  
- [ ] Multi-step host wizard (fee slider + preview `GhStat`)  
- [ ] Wire challenge create to canister  
- [ ] Drawer / menu primitives  
- [ ] Reduced-motion media query on keyframes  

---

## Dev

```bash
cd gamerholic_new
npm run dev          # http://localhost:3020
# open /ui-kit
```
