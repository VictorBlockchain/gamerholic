# Logged-in dashboard · discovery & chat

**Status:** UI-first scaffold  
**Updated:** 2026-07-30  
**Route:** `/dashboard`  
**Chat backend:** Supabase Realtime (optional) · local demo bus fallback  

---

## 1. Purpose

After login, Gamerholic is a **discovery surface** — not a blank wallet page:

| Panel | Job |
|-------|-----|
| **My arena** | Subaccount balance · overall / heads-up / tournament W–L · win & loss streaks · registered · 1v1 · monitor · **betable markets** |
| **My betable markets** | Positions / sides the user is in (`gh_markets` + wagers) · link to `/markets/[id]` |
| **Discover tournaments** | Search game/host · sort by date/game/name/pot · betable chips |
| **Online users** | Who’s live; chat · profile · quick challenge |
| **Chatrooms** | Join topic rooms; opens dock window |
| **Quick challenge** | Direct 1v1 create (legacy form fields + schedule + betable rules) |
| **Chat dock** | Gmail-style multi-window DMs / rooms at bottom of viewport |

**Spacing:** section stack uses `phi4`–`phi5`; page top padding under fixed header so “Dashboard · Discovery” is not flush with the chrome.

Guest storefront stays on `/` (includes **Monitor challenges · earn $$** sell). Demo session: **Enter app** or **Enter demo dashboard**.

---

## 2. Information architecture

```
/                    → logged-out marketing (HomeView)
/dashboard           → logged-in discovery
/challenges          → challenge list
/tournaments         → brackets
/markets             → betable esports markets
```

Nav:

- Desktop: **Dashboard** first in header  
- Mobile bottom: **Home** → `/dashboard`  
- Chat dock is **global** when session active (any route)

---

## 3. Online users row

Each row:

- Avatar + status (online / away)  
- Username · game · W–L  
- Actions: **Challenge** · **Chat** · **Profile**

Chat opens a dock window (`dm:{userId}`). Profile → `/profile?u=…` (placeholder).

---

## 4. Gmail-style chat dock

**UX**

- Fixed bottom-right (desktop) / above bottom nav (mobile)  
- Up to **3** concurrent windows  
- Per window: title bar (minimize / close), scrollable messages, composer  
- Minimized → pill tab; click restores  
- Rooms use same chrome (`room:{roomId}`)

**Stack**

| File | Role |
|------|------|
| `components/chat/chat-context.tsx` | Open / close / minimize threads |
| `components/chat/chat-window.tsx` | Single window UI |
| `components/chat/chat-dock.tsx` | Stack layout |
| `lib/chat/chat-service.ts` | fetch / send / subscribe |
| `lib/supabase/client.ts` | Browser Supabase client |
| `lib/chat/sanitize.ts` | Message length + strip tags |

---

## 5. Supabase realtime

### Env

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ…
```

Without env, chat uses an **in-memory bus** + demo auto-replies so UI remains usable.

### Table prefix: `gh_`

All Gamerholic tables use the **`gh_` prefix** (shared Supabase projects, betable markets included).  
Source of truth: `src/lib/supabase/tables.ts`.

| Constant | Table |
|----------|--------|
| `GH_TABLES.messages` | `gh_messages` |
| `GH_TABLES.markets` | `gh_markets` |
| `GH_TABLES.marketWagers` | `gh_market_wagers` |
| `GH_TABLES.presence` | `gh_presence` |
| `GH_TABLES.monitors` | `gh_monitors` |
| `GH_TABLES.attributeBalances` | `gh_attribute_balances` |

### Suggested schema

```sql
-- Chat (thread_id = dm:userId | room:roomId)
create table public.gh_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id text not null,
  sender_id text not null,
  body text not null check (char_length(body) <= 500),
  created_at timestamptz not null default now()
);
create index gh_messages_thread_created on public.gh_messages (thread_id, created_at);
alter table public.gh_messages enable row level security;
create policy "gh_messages_read" on public.gh_messages for select using (true);
create policy "gh_messages_insert" on public.gh_messages for insert with check (true);
alter publication supabase_realtime add table public.gh_messages;

-- Betable markets (link challenge/tournament/room)
create table public.gh_markets (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  event_kind text not null check (event_kind in ('challenge','tournament','room')),
  title text not null,
  status text not null default 'open',
  opens_at timestamptz not null,
  settles_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.gh_market_wagers (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.gh_markets(id),
  principal text not null,
  side text not null,
  amount_e8s bigint not null,
  created_at timestamptz not null default now()
);
```

### Client flow

1. `fetchMessages(threadId)` — history from `gh_messages`  
2. `subscribeMessages(threadId, cb)` — Realtime on `gh_messages`  
3. `sendMessage({ threadId, senderId, body })` — insert  

Presence (online list) can later use `gh_presence` / Supabase Presence; currently demo list.

### Create forms · no modals (Internet Identity)

II / wallet connect breaks inside modal focus traps. Rule:

- **Challenge create** = show/hide in-page panel (`ChallengeQuickForm`)  
- **Mobile Create FAB** = bottom show/hide picker → routes to `/create?type=`  
- **`/create`** = type picker + expandable form body (never `Dialog`/`GhModal` for auth steps)

---

## 6. Quick challenge form

Inspired by legacy `gamerholic/app/challenge/create/page.tsx`:

| Field | Legacy | Dashboard quick form |
|-------|--------|----------------------|
| Opponent | address | username / principal |
| Game | listGames | select |
| Title / description | metadata | inputs |
| Entry fee | ICP e8s | ICP number |
| Console | — | text |
| Schedule | tournament had startDate/Time | optional date+time |
| Betable | new | switch + policy |

### Betable schedule rule

- **Betable off:** schedule optional; if set, must be in the future.  
- **Betable on:** schedule **required**, start **≥ 1 hour from now**.  
- Turning betable on forces schedule switch on.  
- Turning schedule off while betable is blocked.

Submit is UI-first (toast) until ICP createHeadsUpChallenge is wired.

Tournament create remains full path: `/create?type=tournament` (legacy fields: entry, max participants, host fee bps, start date/time, rules presets).

---

## 7. Session (demo)

`SessionProvider` · localStorage `gh_demo_session`

| API | Behavior |
|-----|----------|
| `loginDemo()` | Sets session · unlocks dashboard + dock |
| `logout()` | Clears session |
| `user` | Demo principal placeholder |

Replace with Internet Identity + principal as gamer ID.

---

## 8. Design system notes (update)

- Discovery uses **glass surfaces**, prize for tournaments, live for online, brand for challenges.  
- Chat dock z-index **55** (above main, below mobile nav chrome if needed — dock sits above bottom nav with offset).  
- Mobile dashboard: online list under main content sticky on `lg+`.  
- Scrollbars hidden globally (`.gh-scroll-hide` / global CSS).  

See also: [`design-system.md`](./design-system.md) · [`ui-theme.md`](./ui-theme.md).

---

## 9. Next implementation

- [ ] Wire create challenge to canister (`createHeadsUpChallenge`)  
- [ ] Supabase presence for real online set  
- [ ] RLS tied to authenticated principal  
- [ ] Push/notification when dock closed  
- [ ] Profile deep-link pages for `?u=`  
- [ ] Tournament create multi-step wizard on dashboard  

## Dev

```bash
cd gamerholic_new
npm run dev   # :3020 → Enter app → /dashboard
```
