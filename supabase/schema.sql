-- Gamerholic Supabase mirror (gh_*) — single source of truth
-- Canisters = source of truth for escrow/settlement.
-- Supabase = index + Realtime for FE + arcade session clock/catalog.
-- Pattern: dexsta/supabase (upsert RPCs + public SELECT RLS).
--
-- Apply once in Supabase SQL Editor (includes High Score Arcade).
-- Realtime tables are added at the bottom of this file.
--
-- Formerly: schema.sql + arcade_schema.sql (merged).

-- Optional (Supabase usually has gen_random_uuid; we avoid gen_random_bytes).
create extension if not exists pgcrypto with schema extensions;

-- ── Challenges ──────────────────────────────────────────────
create table if not exists public.gh_challenges (
  id text primary key,
  title text,
  game text,
  console text,
  status text not null default 'open',
  creator text not null,
  opponent text,
  entry_fee_e8s bigint not null default 0,
  pot_extra_e8s bigint not null default 0,
  score_creator int not null default 0,
  score_opponent int not null default 0,
  score_is_final boolean not null default false,
  betable boolean not null default false,
  market_id text,
  tournament_id text,
  tournament_match_label text,
  monitor_username text,
  escrow_subaccount text,
  metadata jsonb not null default '{}'::jsonb,
  cancel_request jsonb,
  dispute jsonb,
  canister_synced_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists gh_challenges_status_idx on public.gh_challenges (status);
create index if not exists gh_challenges_tournament_idx on public.gh_challenges (tournament_id);
create index if not exists gh_challenges_creator_idx on public.gh_challenges (creator);

-- ── Challenge events (activity / feed) ──────────────────────
create table if not exists public.gh_challenge_events (
  id bigserial primary key,
  challenge_id text not null references public.gh_challenges (id) on delete cascade,
  event_type text not null,
  actor text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists gh_challenge_events_chal_idx
  on public.gh_challenge_events (challenge_id, created_at desc);

-- ── Tournaments ─────────────────────────────────────────────
create table if not exists public.gh_tournaments (
  id text primary key,
  title text,
  game text,
  console text,
  status text not null default 'open',
  host_username text not null,
  entry_fee_e8s bigint not null default 0,
  host_fee_bps int not null default 0,
  max_players int not null default 16,
  prize_pot_e8s bigint not null default 0,
  betable boolean not null default false,
  market_id text,
  market_volume_e8s bigint not null default 0,
  team_entry boolean not null default false,
  registration_open boolean not null default true,
  scheduled_at timestamptz,
  cover_url text,
  description text,
  stream_url text,
  metadata jsonb not null default '{}'::jsonb,
  canister_synced_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.gh_tournament_entrants (
  tournament_id text not null references public.gh_tournaments (id) on delete cascade,
  username text not null,
  seed int,
  paid boolean not null default false,
  checked_in boolean not null default false,
  primary key (tournament_id, username)
);

-- ── Markets (betable) ───────────────────────────────────────
create table if not exists public.gh_markets (
  id text primary key,
  title text,
  game text,
  kind text not null default 'challenge', -- challenge | tournament
  status text not null default 'open',
  challenge_id text,
  tournament_id text,
  volume_e8s bigint not null default 0,
  liquidity_e8s bigint not null default 0,
  lines jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.gh_market_wagers (
  id bigserial primary key,
  market_id text not null references public.gh_markets (id) on delete cascade,
  principal text not null,
  side_label text not null,
  amount_e8s bigint not null,
  created_at timestamptz not null default now()
);

-- ── Messages / presence (chat) ──────────────────────────────
create table if not exists public.gh_messages (
  id text primary key,
  thread_id text not null,
  sender_id text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists gh_messages_thread_idx
  on public.gh_messages (thread_id, created_at);

create table if not exists public.gh_presence (
  principal text primary key,
  username text,
  status text not null default 'online',
  game text,
  updated_at timestamptz not null default now()
);

-- ── Monitors / profiles / attributes ────────────────────────
create table if not exists public.gh_monitors (
  username text primary key,
  games_monitored int not null default 0,
  disputes int not null default 0,
  earnings_e8s bigint not null default 0,
  note text,
  updated_at timestamptz not null default now()
);

create table if not exists public.gh_profiles (
  principal text primary key,
  username text unique,
  avatar_url text,
  bio text,
  console text,
  games text[] default '{}',
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.gh_attribute_balances (
  principal text not null,
  attribute_id text not null,
  balance numeric not null default 0,
  updated_at timestamptz not null default now(),
  primary key (principal, attribute_id)
);

create table if not exists public.gh_teams (
  id text primary key,
  name text not null,
  tag text,
  captain text not null,
  game text,
  console text,
  cover_url text,
  avatar_url text,
  members jsonb not null default '[]'::jsonb,
  wins int not null default 0,
  losses int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.gh_sync_log (
  id bigserial primary key,
  source text not null,
  entity_type text,
  entity_id text,
  ok boolean not null default true,
  detail text,
  created_at timestamptz not null default now()
);

-- ── RLS: public read for demo; writes via security definer RPCs ──
alter table public.gh_challenges enable row level security;
alter table public.gh_challenge_events enable row level security;
alter table public.gh_tournaments enable row level security;
alter table public.gh_tournament_entrants enable row level security;
alter table public.gh_markets enable row level security;
alter table public.gh_market_wagers enable row level security;
alter table public.gh_messages enable row level security;
alter table public.gh_presence enable row level security;
alter table public.gh_monitors enable row level security;
alter table public.gh_profiles enable row level security;
alter table public.gh_attribute_balances enable row level security;
alter table public.gh_teams enable row level security;
alter table public.gh_sync_log enable row level security;

do $$ begin
  create policy gh_challenges_select on public.gh_challenges for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy gh_challenge_events_select on public.gh_challenge_events for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy gh_tournaments_select on public.gh_tournaments for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy gh_markets_select on public.gh_markets for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy gh_messages_select on public.gh_messages for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy gh_presence_select on public.gh_presence for select using (true);
exception when duplicate_object then null; end $$;
-- Presence writes go through upsert_gh_presence (security definer) — no direct insert policy.
do $$ begin
  create policy gh_profiles_select on public.gh_profiles for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy gh_teams_select on public.gh_teams for select using (true);
exception when duplicate_object then null; end $$;

-- ── Presence heartbeat (browser anon → security definer; RLS blocks direct write) ──
create or replace function public.upsert_gh_presence(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_principal text := nullif(trim(coalesce(p->>'principal', '')), '');
  v_username text := coalesce(nullif(trim(p->>'username'), ''), v_principal, 'player');
  v_status text := coalesce(nullif(trim(p->>'status'), ''), 'online');
  v_game text := nullif(trim(p->>'game'), '');
begin
  if v_principal is null or length(v_principal) < 3 then
    raise exception 'principal required';
  end if;
  if v_status not in ('online', 'away', 'offline') then
    v_status := 'online';
  end if;

  insert into public.gh_presence as pr (principal, username, status, game, updated_at)
  values (v_principal, v_username, v_status, v_game, now())
  on conflict (principal) do update set
    username = excluded.username,
    status = excluded.status,
    game = excluded.game,
    updated_at = now();

  return jsonb_build_object(
    'ok', true,
    'principal', v_principal,
    'status', v_status,
    'updated_at', now()
  );
end;
$$;

grant execute on function public.upsert_gh_presence(jsonb) to anon, authenticated;

do $$ begin
  alter publication supabase_realtime add table public.gh_presence;
exception when duplicate_object then null; when undefined_object then null; end $$;

-- ── Upsert challenge mirror (browser anon → security definer) ──
create or replace function public.upsert_gh_challenge_mirror(p jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.gh_challenges as c (
    id, title, game, console, status, creator, opponent,
    entry_fee_e8s, pot_extra_e8s, score_creator, score_opponent, score_is_final,
    betable, market_id, tournament_id, tournament_match_label, monitor_username,
    escrow_subaccount, metadata, cancel_request, dispute,
    canister_synced_at, updated_at
  ) values (
    p->>'id',
    p->>'title',
    p->>'game',
    p->>'console',
    coalesce(p->>'status', 'open'),
    coalesce(p->>'creator', ''),
    p->>'opponent',
    coalesce((p->>'entry_fee_e8s')::bigint, 0),
    coalesce((p->>'pot_extra_e8s')::bigint, 0),
    coalesce((p->>'score_creator')::int, 0),
    coalesce((p->>'score_opponent')::int, 0),
    coalesce((p->>'score_is_final')::boolean, false),
    coalesce((p->>'betable')::boolean, false),
    p->>'market_id',
    p->>'tournament_id',
    p->>'tournament_match_label',
    p->>'monitor_username',
    p->>'escrow_subaccount',
    coalesce(p->'metadata', '{}'::jsonb),
    p->'cancel_request',
    p->'dispute',
    now(),
    now()
  )
  on conflict (id) do update set
    title = excluded.title,
    game = excluded.game,
    console = excluded.console,
    status = excluded.status,
    creator = excluded.creator,
    opponent = excluded.opponent,
    entry_fee_e8s = excluded.entry_fee_e8s,
    pot_extra_e8s = excluded.pot_extra_e8s,
    score_creator = excluded.score_creator,
    score_opponent = excluded.score_opponent,
    score_is_final = excluded.score_is_final,
    betable = excluded.betable,
    market_id = excluded.market_id,
    tournament_id = excluded.tournament_id,
    tournament_match_label = excluded.tournament_match_label,
    monitor_username = excluded.monitor_username,
    escrow_subaccount = excluded.escrow_subaccount,
    metadata = excluded.metadata,
    cancel_request = excluded.cancel_request,
    dispute = excluded.dispute,
    canister_synced_at = now(),
    updated_at = now();
end;
$$;

create or replace function public.insert_gh_challenge_event(
  p_challenge_id text,
  p_event_type text,
  p_actor text default null,
  p_payload jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.gh_challenge_events (challenge_id, event_type, actor, payload)
  values (p_challenge_id, p_event_type, p_actor, coalesce(p_payload, '{}'::jsonb));
end;
$$;

create or replace function public.upsert_gh_tournament_mirror(p jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.gh_tournaments as t (
    id, title, game, console, status, host_username,
    entry_fee_e8s, host_fee_bps, max_players, prize_pot_e8s,
    betable, market_id, market_volume_e8s, team_entry, registration_open,
    scheduled_at, cover_url, description, stream_url, metadata,
    canister_synced_at, updated_at
  ) values (
    p->>'id',
    p->>'title',
    p->>'game',
    p->>'console',
    coalesce(p->>'status', 'open'),
    coalesce(p->>'host_username', ''),
    coalesce((p->>'entry_fee_e8s')::bigint, 0),
    coalesce((p->>'host_fee_bps')::int, 0),
    coalesce((p->>'max_players')::int, 16),
    coalesce((p->>'prize_pot_e8s')::bigint, 0),
    coalesce((p->>'betable')::boolean, false),
    p->>'market_id',
    coalesce((p->>'market_volume_e8s')::bigint, 0),
    coalesce((p->>'team_entry')::boolean, false),
    coalesce((p->>'registration_open')::boolean, true),
    nullif(p->>'scheduled_at', '')::timestamptz,
    p->>'cover_url',
    p->>'description',
    p->>'stream_url',
    coalesce(p->'metadata', '{}'::jsonb),
    now(),
    now()
  )
  on conflict (id) do update set
    title = excluded.title,
    game = excluded.game,
    console = excluded.console,
    status = excluded.status,
    host_username = excluded.host_username,
    entry_fee_e8s = excluded.entry_fee_e8s,
    host_fee_bps = excluded.host_fee_bps,
    max_players = excluded.max_players,
    prize_pot_e8s = excluded.prize_pot_e8s,
    betable = excluded.betable,
    market_id = excluded.market_id,
    market_volume_e8s = excluded.market_volume_e8s,
    team_entry = excluded.team_entry,
    registration_open = excluded.registration_open,
    scheduled_at = excluded.scheduled_at,
    cover_url = excluded.cover_url,
    description = excluded.description,
    stream_url = excluded.stream_url,
    metadata = excluded.metadata,
    canister_synced_at = now(),
    updated_at = now();
end;
$$;

grant execute on function public.upsert_gh_challenge_mirror(jsonb) to anon, authenticated;
grant execute on function public.insert_gh_challenge_event(text, text, text, jsonb) to anon, authenticated;
grant execute on function public.upsert_gh_tournament_mirror(jsonb) to anon, authenticated;

-- Realtime publication (run once; ignore errors if already added)
do $$ begin
  alter publication supabase_realtime add table public.gh_challenges;
exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.gh_challenge_events;
exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.gh_tournaments;
exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.gh_markets;
exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.gh_messages;
exception when duplicate_object then null; when undefined_object then null; end $$;

-- ── Rooms (esports chatrooms) ───────────────────────────────
create table if not exists public.gh_rooms (
  id text primary key,
  name text not null,
  description text,
  creator text not null,
  game text,
  games text[] default '{}',
  console text,
  image_url text,
  cover_url text,
  member_count int not null default 0,
  members jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  total_winnings_e8s bigint not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  canister_synced_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists gh_rooms_active_idx on public.gh_rooms (is_active, updated_at desc);

alter table public.gh_rooms enable row level security;
do $$ begin
  create policy gh_rooms_select on public.gh_rooms for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy gh_rooms_insert on public.gh_rooms for insert with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy gh_rooms_update on public.gh_rooms for update using (true);
exception when duplicate_object then null; end $$;

create or replace function public.upsert_gh_room_mirror(p jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.gh_rooms as r (
    id, name, description, creator, game, games, console,
    image_url, cover_url, member_count, members, is_active,
    total_winnings_e8s, metadata, canister_synced_at, updated_at
  ) values (
    p->>'id',
    coalesce(p->>'name', p->>'id'),
    p->>'description',
    coalesce(p->>'creator', ''),
    p->>'game',
    coalesce(
      (select array_agg(x) from jsonb_array_elements_text(coalesce(p->'games', '[]'::jsonb)) as t(x)),
      '{}'::text[]
    ),
    p->>'console',
    p->>'image_url',
    p->>'cover_url',
    coalesce((p->>'member_count')::int, 0),
    coalesce(p->'members', '[]'::jsonb),
    coalesce((p->>'is_active')::boolean, true),
    coalesce((p->>'total_winnings_e8s')::bigint, 0),
    coalesce(p->'metadata', '{}'::jsonb),
    now(),
    now()
  )
  on conflict (id) do update set
    name = excluded.name,
    description = excluded.description,
    creator = excluded.creator,
    game = excluded.game,
    games = excluded.games,
    console = excluded.console,
    image_url = excluded.image_url,
    cover_url = excluded.cover_url,
    member_count = excluded.member_count,
    members = excluded.members,
    is_active = excluded.is_active,
    total_winnings_e8s = excluded.total_winnings_e8s,
    metadata = excluded.metadata,
    canister_synced_at = now(),
    updated_at = now();
end;
$$;

-- ── Upsert gamer profile by II principal (browser → security definer) ──
create or replace function public.upsert_gh_profile(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_principal text := coalesce(nullif(p->>'principal', ''), '');
begin
  if v_principal = '' or v_principal = '2vxsx-fae' then
    return jsonb_build_object('ok', false, 'error', 'principal_required');
  end if;

  insert into public.gh_profiles as g (
    principal, username, avatar_url, bio, console, games, metadata, updated_at
  ) values (
    v_principal,
    nullif(p->>'username', ''),
    nullif(p->>'avatar_url', ''),
    nullif(p->>'bio', ''),
    nullif(p->>'console', ''),
    coalesce(
      (select array_agg(x) from jsonb_array_elements_text(coalesce(p->'games', '[]'::jsonb)) as t(x)),
      '{}'::text[]
    ),
    coalesce(p->'metadata', '{}'::jsonb),
    now()
  )
  on conflict (principal) do update set
    username = coalesce(excluded.username, g.username),
    avatar_url = coalesce(excluded.avatar_url, g.avatar_url),
    bio = coalesce(excluded.bio, g.bio),
    console = coalesce(excluded.console, g.console),
    games = excluded.games,
    metadata = g.metadata || excluded.metadata,
    updated_at = now();

  return jsonb_build_object('ok', true, 'principal', v_principal);
end;
$$;

grant execute on function public.upsert_gh_profile(jsonb) to anon, authenticated;

-- ══════════════════════════════════════════════════════════════════
-- High Score Arcade (hybrid: Supabase clock/scores + ICP settlement)
-- Catalog, sessions, score events, chain jobs, RPCs — was arcade_schema.sql
-- ══════════════════════════════════════════════════════════════════

-- ── Sessions (authoritative play window for ranked + free) ──
create table if not exists public.gh_arcade_sessions (
  id text primary key,
  game_id text not null,
  player_principal text not null,
  username text not null,
  paid boolean not null default false,
  play_fee_e8s bigint not null default 0,
  play_fee_token text not null default 'ICP', -- ICP | GAMER
  play_time_sec int not null,
  -- Server-side clock (never trust browser for t_end)
  t_start timestamptz not null default now(),
  t_end timestamptz not null,
  grace_sec int not null default 3,
  seed text not null default '',
  status text not null default 'open',
  -- open | finalized_pending_chain | confirmed | rejected | refunded
  running_score bigint not null default 0,
  final_score bigint,
  end_reason text,
  event_count int not null default 0,
  last_event_at timestamptz,
  max_score_per_sec numeric not null default 500,
  canister_tx text,
  canister_confirmed_at timestamptz,
  settlement jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gh_arcade_sessions_player_idx
  on public.gh_arcade_sessions (player_principal, created_at desc);
create index if not exists gh_arcade_sessions_game_idx
  on public.gh_arcade_sessions (game_id, status);
create index if not exists gh_arcade_sessions_status_idx
  on public.gh_arcade_sessions (status) where status in ('open', 'finalized_pending_chain');

-- ── Score events (staged; anti-cheat rate limits on insert) ──
create table if not exists public.gh_arcade_score_events (
  id bigserial primary key,
  session_id text not null references public.gh_arcade_sessions (id) on delete cascade,
  seq int not null,
  score bigint not null,
  delta bigint not null default 0,
  client_ts_ms bigint,
  server_ts timestamptz not null default now(),
  unique (session_id, seq)
);

create index if not exists gh_arcade_score_events_sess_idx
  on public.gh_arcade_score_events (session_id, seq);

-- ── Canister settle queue / log ──
create table if not exists public.gh_arcade_chain_jobs (
  id bigserial primary key,
  session_id text not null references public.gh_arcade_sessions (id) on delete cascade,
  job_type text not null default 'settle', -- settle | refund
  status text not null default 'queued', -- queued | sent | confirmed | failed
  payload jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  attempts int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gh_arcade_chain_jobs_status_idx
  on public.gh_arcade_chain_jobs (status, created_at);

alter table public.gh_arcade_sessions enable row level security;
alter table public.gh_arcade_score_events enable row level security;
alter table public.gh_arcade_chain_jobs enable row level security;

do $$ begin
  create policy gh_arcade_sessions_select on public.gh_arcade_sessions for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy gh_arcade_score_events_select on public.gh_arcade_score_events for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy gh_arcade_chain_jobs_select on public.gh_arcade_chain_jobs for select using (true);
exception when duplicate_object then null; end $$;

-- ── Server time ──
create or replace function public.gh_arcade_server_now()
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$
  select now();
$$;

grant execute on function public.gh_arcade_server_now() to anon, authenticated;

-- ── Start session (Supabase clocks the run) ──
create or replace function public.gh_arcade_start_session(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text := coalesce(p->>'id', 'sess_' || replace(gen_random_uuid()::text, '-', ''));
  v_game text := p->>'game_id';
  v_player text := coalesce(p->>'player_principal', '');
  v_user text := coalesce(p->>'username', 'player');
  v_paid boolean := coalesce((p->>'paid')::boolean, false);
  v_fee bigint := coalesce((p->>'play_fee_e8s')::bigint, 0);
  v_token text := coalesce(p->>'play_fee_token', 'ICP');
  v_secs int := greatest(10, least(coalesce((p->>'play_time_sec')::int, 180), 900));
  -- Prefer client seed; fallback uses gen_random_uuid (no pgcrypto gen_random_bytes).
  v_seed text := coalesce(
    nullif(p->>'seed', ''),
    replace(gen_random_uuid()::text, '-', '') || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)
  );
  v_grace int := coalesce((p->>'grace_sec')::int, 3);
  v_max_rate numeric := coalesce((p->>'max_score_per_sec')::numeric, 500);
  v_start timestamptz := now();
  v_end timestamptz := v_start + make_interval(secs => v_secs);
  v_open int;
begin
  if v_game is null or length(v_game) < 1 then
    raise exception 'game_id required';
  end if;
  if length(v_player) < 3 then
    raise exception 'player_principal required';
  end if;

  -- One open ranked/free session per player per game
  select count(*) into v_open from public.gh_arcade_sessions
  where player_principal = v_player and game_id = v_game and status = 'open';
  if v_open > 0 then
    -- auto-close stale opens past grace
    update public.gh_arcade_sessions
    set status = 'rejected', end_reason = 'stale_replaced', updated_at = now()
    where player_principal = v_player and game_id = v_game and status = 'open'
      and now() > t_end + make_interval(secs => grace_sec + 30);
  end if;

  select count(*) into v_open from public.gh_arcade_sessions
  where player_principal = v_player and game_id = v_game and status = 'open';
  if v_open > 0 then
    raise exception 'open session already exists for this game';
  end if;

  insert into public.gh_arcade_sessions (
    id, game_id, player_principal, username, paid, play_fee_e8s, play_fee_token,
    play_time_sec, t_start, t_end, grace_sec, seed, status, max_score_per_sec
  ) values (
    v_id, v_game, v_player, v_user, v_paid, v_fee, v_token,
    v_secs, v_start, v_end, v_grace, v_seed, 'open', v_max_rate
  );

  return jsonb_build_object(
    'ok', true,
    'session_id', v_id,
    'game_id', v_game,
    'paid', v_paid,
    't_start', v_start,
    't_end', v_end,
    'play_time_sec', v_secs,
    'remaining_sec', v_secs,
    'server_now', v_start,
    'seed', v_seed,
    'grace_sec', v_grace,
    'status', 'open'
  );
end;
$$;

grant execute on function public.gh_arcade_start_session(jsonb) to anon, authenticated;

-- ── Session clock (re-sync UI; never use client clock as authority) ──
create or replace function public.gh_arcade_session_clock(p_session_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.gh_arcade_sessions%rowtype;
  v_now timestamptz := now();
  v_rem numeric;
begin
  select * into s from public.gh_arcade_sessions where id = p_session_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'session_not_found');
  end if;

  v_rem := extract(epoch from (s.t_end - v_now));
  if v_rem < 0 then v_rem := 0; end if;

  return jsonb_build_object(
    'ok', true,
    'session_id', s.id,
    'status', s.status,
    'paid', s.paid,
    'server_now', v_now,
    't_start', s.t_start,
    't_end', s.t_end,
    'remaining_sec', floor(v_rem)::int,
    'expired', v_now > s.t_end,
    'within_grace', v_now <= s.t_end + make_interval(secs => s.grace_sec),
    'running_score', s.running_score,
    'final_score', s.final_score,
    'seed', s.seed
  );
end;
$$;

grant execute on function public.gh_arcade_session_clock(text) to anon, authenticated;

-- ── Score event (rate-limited; score must be monotonic non-decreasing) ──
create or replace function public.gh_arcade_submit_score_event(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sid text := p->>'session_id';
  v_score bigint := coalesce((p->>'score')::bigint, 0);
  v_seq int := coalesce((p->>'seq')::int, 0);
  v_client_ts bigint := (p->>'client_ts_ms')::bigint;
  s public.gh_arcade_sessions%rowtype;
  v_now timestamptz := now();
  v_delta bigint;
  v_elapsed numeric;
  v_max_allowed bigint;
begin
  select * into s from public.gh_arcade_sessions where id = v_sid for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'session_not_found');
  end if;
  if s.status <> 'open' then
    return jsonb_build_object('ok', false, 'error', 'session_not_open', 'status', s.status);
  end if;
  -- Accept events until grace after t_end
  if v_now > s.t_end + make_interval(secs => s.grace_sec) then
    return jsonb_build_object('ok', false, 'error', 'session_expired');
  end if;
  if v_score < s.running_score then
    return jsonb_build_object('ok', false, 'error', 'score_decreased', 'running_score', s.running_score);
  end if;
  if v_seq <= s.event_count then
    return jsonb_build_object('ok', false, 'error', 'seq_stale', 'event_count', s.event_count);
  end if;

  v_delta := v_score - s.running_score;
  v_elapsed := greatest(1.0, extract(epoch from (v_now - s.t_start)));
  v_max_allowed := ceil(v_elapsed * s.max_score_per_sec)::bigint + 1000;
  if v_score > v_max_allowed then
    return jsonb_build_object(
      'ok', false,
      'error', 'score_rate_exceeded',
      'max_allowed', v_max_allowed,
      'score', v_score
    );
  end if;

  -- Min interval ~40ms between events (anti spam)
  if s.last_event_at is not null
     and v_now < s.last_event_at + interval '40 milliseconds' then
    return jsonb_build_object('ok', false, 'error', 'event_too_fast');
  end if;

  insert into public.gh_arcade_score_events (session_id, seq, score, delta, client_ts_ms)
  values (v_sid, v_seq, v_score, v_delta, v_client_ts);

  update public.gh_arcade_sessions set
    running_score = v_score,
    event_count = v_seq,
    last_event_at = v_now,
    updated_at = v_now
  where id = v_sid;

  return jsonb_build_object(
    'ok', true,
    'session_id', v_sid,
    'running_score', v_score,
    'seq', v_seq,
    'server_now', v_now,
    'remaining_sec', greatest(0, floor(extract(epoch from (s.t_end - v_now)))::int)
  );
end;
$$;

grant execute on function public.gh_arcade_submit_score_event(jsonb) to anon, authenticated;

-- ── Finalize (Supabase stage) → queues canister job ──
create or replace function public.gh_arcade_finalize_session(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sid text := p->>'session_id';
  v_score bigint := coalesce((p->>'final_score')::bigint, 0);
  v_reason text := coalesce(p->>'end_reason', 'timer');
  s public.gh_arcade_sessions%rowtype;
  v_now timestamptz := now();
  v_job_id bigint;
begin
  select * into s from public.gh_arcade_sessions where id = v_sid for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'session_not_found');
  end if;
  if s.status in ('confirmed', 'refunded') then
    return jsonb_build_object('ok', true, 'already', true, 'status', s.status, 'final_score', s.final_score);
  end if;
  -- Already staged for chain — safe for client to call settle/retry without re-scoring
  if s.status in ('finalized_pending_chain', 'chain_failed') then
    return jsonb_build_object(
      'ok', true,
      'already', true,
      'status', s.status,
      'final_score', s.final_score,
      'paid', s.paid,
      'needs_canister', s.paid,
      'retryable', true
    );
  end if;
  if s.status <> 'open' then
    return jsonb_build_object('ok', false, 'error', 'bad_status', 'status', s.status);
  end if;

  -- Prefer server running_score if higher / if client under-reports
  if s.running_score > v_score then
    v_score := s.running_score;
  end if;
  if v_score < 0 then v_score := 0; end if;

  -- Allow early end (game over / manual) or at/after t_end; reject far-future finalize
  if v_now < s.t_start then
    return jsonb_build_object('ok', false, 'error', 'not_started');
  end if;

  update public.gh_arcade_sessions set
    status = 'finalized_pending_chain',
    final_score = v_score,
    running_score = greatest(running_score, v_score),
    end_reason = v_reason,
    updated_at = v_now
  where id = v_sid;

  insert into public.gh_arcade_chain_jobs (session_id, job_type, status, payload)
  values (
    v_sid,
    case when s.paid then 'settle' else 'practice_noop' end,
    'queued',
    jsonb_build_object(
      'game_id', s.game_id,
      'player', s.player_principal,
      'username', s.username,
      'paid', s.paid,
      'play_fee_e8s', s.play_fee_e8s,
      'play_fee_token', s.play_fee_token,
      'final_score', v_score,
      'end_reason', v_reason,
      't_start', s.t_start,
      't_end', s.t_end,
      'seed', s.seed
    )
  )
  returning id into v_job_id;

  return jsonb_build_object(
    'ok', true,
    'session_id', v_sid,
    'status', 'finalized_pending_chain',
    'final_score', v_score,
    'paid', s.paid,
    'chain_job_id', v_job_id,
    'server_now', v_now,
    'needs_canister', s.paid
  );
end;
$$;

grant execute on function public.gh_arcade_finalize_session(jsonb) to anon, authenticated;

-- ── Confirm after canister responds ──
create or replace function public.gh_arcade_confirm_canister(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sid text := p->>'session_id';
  v_ok boolean := coalesce((p->>'ok')::boolean, false);
  v_tx text := p->>'canister_tx';
  v_settlement jsonb := coalesce(p->'settlement', '{}'::jsonb);
  v_err text := p->>'error';
  s public.gh_arcade_sessions%rowtype;
  v_now timestamptz := now();
begin
  select * into s from public.gh_arcade_sessions where id = v_sid for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'session_not_found');
  end if;
  if s.status = 'confirmed' then
    return jsonb_build_object('ok', true, 'already', true, 'status', 'confirmed');
  end if;

  if v_ok then
    update public.gh_arcade_sessions set
      status = case
        when (v_settlement->>'kind') = 'new_high_score_refund' then 'refunded'
        else 'confirmed'
      end,
      canister_tx = v_tx,
      canister_confirmed_at = v_now,
      settlement = v_settlement,
      updated_at = v_now
    where id = v_sid;

    update public.gh_arcade_chain_jobs set
      status = 'confirmed',
      result = v_settlement,
      updated_at = v_now,
      attempts = attempts + 1
    where session_id = v_sid and status in ('queued', 'sent', 'failed');

    return jsonb_build_object(
      'ok', true,
      'session_id', v_sid,
      'status', case
        when (v_settlement->>'kind') = 'new_high_score_refund' then 'refunded'
        else 'confirmed'
      end,
      'settlement', v_settlement,
      'canister_tx', v_tx
    );
  else
    -- Keep final_score + leave retryable status (do NOT wipe staged score)
    update public.gh_arcade_sessions set
      status = 'chain_failed',
      settlement = jsonb_build_object('error', v_err, 'retryable', true),
      updated_at = v_now
    where id = v_sid
      and status in ('finalized_pending_chain', 'chain_failed', 'open');

    update public.gh_arcade_chain_jobs set
      status = 'failed',
      result = jsonb_build_object('error', v_err, 'retryable', true),
      updated_at = v_now,
      attempts = attempts + 1
    where session_id = v_sid and status in ('queued', 'sent', 'failed');

    return jsonb_build_object(
      'ok', false,
      'session_id', v_sid,
      'status', 'chain_failed',
      'error', v_err,
      'retryable', true,
      'final_score', s.final_score
    );
  end if;
end;
$$;

grant execute on function public.gh_arcade_confirm_canister(jsonb) to anon, authenticated;

-- Mark job sent when client/worker dispatches to canister
create or replace function public.gh_arcade_mark_chain_sent(p_session_id text, p_tx text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.gh_arcade_chain_jobs set
    status = 'sent',
    updated_at = now(),
    attempts = attempts + 1,
    result = case when p_tx is not null then jsonb_build_object('tx', p_tx) else result end
  where session_id = p_session_id and status in ('queued', 'failed');
end;
$$;

grant execute on function public.gh_arcade_mark_chain_sent(text, text) to anon, authenticated;

-- Re-queue a failed/pending job for safe resubmit (score stays on session row)
create or replace function public.gh_arcade_requeue_chain_job(p_session_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.gh_arcade_sessions%rowtype;
  v_job_id bigint;
begin
  select * into s from public.gh_arcade_sessions where id = p_session_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'session_not_found');
  end if;
  if s.status in ('confirmed', 'refunded') then
    return jsonb_build_object('ok', true, 'already', true, 'status', s.status, 'final_score', s.final_score);
  end if;
  if s.final_score is null and s.running_score is null then
    return jsonb_build_object('ok', false, 'error', 'no_score_staged');
  end if;

  update public.gh_arcade_sessions set
    status = 'finalized_pending_chain',
    updated_at = now()
  where id = p_session_id;

  update public.gh_arcade_chain_jobs set
    status = 'queued',
    updated_at = now()
  where session_id = p_session_id and status in ('failed', 'sent', 'queued');

  if not found then
    insert into public.gh_arcade_chain_jobs (session_id, job_type, status, payload)
    values (
      p_session_id,
      'settle',
      'queued',
      jsonb_build_object(
        'game_id', s.game_id,
        'player', s.player_principal,
        'final_score', coalesce(s.final_score, s.running_score),
        'retry', true
      )
    )
    returning id into v_job_id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'session_id', p_session_id,
    'status', 'finalized_pending_chain',
    'final_score', coalesce(s.final_score, s.running_score),
    'retryable', true
  );
end;
$$;

grant execute on function public.gh_arcade_requeue_chain_job(text) to anon, authenticated;

-- ── Arcade game catalog (CSS + gameCode off-chain; NOT Motoko) ──
-- Lifecycle: published catalog rows start as status='testing' (community playtests
-- with real insert coins + leaderboard). 10 unique upvotes → status='live'.
-- Tester scores are NOT wiped on go-live (same game_id board).
create table if not exists public.gh_arcade_games (
  id text primary key,
  title text not null,
  description text not null default '',
  rules text not null default '',
  image_url text not null default '',
  css text not null default '',
  game_code text not null default '',
  engine text not null default 'phaser3',
  play_fee double precision not null default 0.003,
  play_fee_token text not null default 'ICP',
  payout_top_n int not null default 3,
  play_time_sec int not null default 180,
  creator text not null default '',
  creator_principal text not null default '',
  escrow_id text not null default '',
  linked_label_id bigint not null default 0,
  accepted_game_assets jsonb not null default '[]'::jsonb,
  plays int not null default 0,
  high_score bigint not null default 0,
  high_score_by text,
  published boolean not null default true,
  -- testing | live (legacy rows without column treated as live after migration)
  status text not null default 'testing'
    check (status in ('testing', 'live')),
  upvotes int not null default 0,
  upvoted_by jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Safe upgrade for existing deployments
alter table public.gh_arcade_games
  add column if not exists status text;
alter table public.gh_arcade_games
  add column if not exists upvotes int;
alter table public.gh_arcade_games
  add column if not exists upvoted_by jsonb;

update public.gh_arcade_games
set status = 'live'
where status is null or status = '';

update public.gh_arcade_games
set upvotes = coalesce(upvotes, 0)
where upvotes is null;

update public.gh_arcade_games
set upvoted_by = '[]'::jsonb
where upvoted_by is null;

alter table public.gh_arcade_games
  alter column status set default 'testing';
alter table public.gh_arcade_games
  alter column upvotes set default 0;
alter table public.gh_arcade_games
  alter column upvoted_by set default '[]'::jsonb;

create index if not exists gh_arcade_games_pub_idx
  on public.gh_arcade_games (published, created_at desc);

create index if not exists gh_arcade_games_status_idx
  on public.gh_arcade_games (status, created_at desc);

alter table public.gh_arcade_games enable row level security;

do $$ begin
  create policy gh_arcade_games_select on public.gh_arcade_games for select using (true);
exception when duplicate_object then null; end $$;

-- Public read; writes via security definer RPC (anon publish for demo)
create or replace function public.gh_arcade_upsert_game(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text := coalesce(p->>'id', 'game_' || replace(gen_random_uuid()::text, '-', ''));
  v_status text := coalesce(nullif(p->>'status', ''), 'testing');
begin
  if v_status not in ('testing', 'live') then
    v_status := 'testing';
  end if;

  insert into public.gh_arcade_games as g (
    id, title, description, rules, image_url, css, game_code, engine,
    play_fee, play_fee_token, payout_top_n, play_time_sec,
    creator, creator_principal, escrow_id, linked_label_id,
    accepted_game_assets, plays, high_score, high_score_by, published,
    status, upvotes, upvoted_by,
    created_at, updated_at
  ) values (
    v_id,
    coalesce(p->>'title', 'Untitled'),
    coalesce(p->>'description', ''),
    coalesce(p->>'rules', ''),
    coalesce(p->>'image_url', ''),
    coalesce(p->>'css', ''),
    coalesce(p->>'game_code', ''),
    coalesce(p->>'engine', 'phaser3'),
    coalesce((p->>'play_fee')::double precision, 0.003),
    coalesce(p->>'play_fee_token', 'ICP'),
    least(10, greatest(1, coalesce((p->>'payout_top_n')::int, 3))),
    greatest(10, least(coalesce((p->>'play_time_sec')::int, 180), 900)),
    coalesce(p->>'creator', ''),
    coalesce(p->>'creator_principal', ''),
    coalesce(p->>'escrow_id', 'gh-arcade-escrow-' || v_id),
    coalesce((p->>'linked_label_id')::bigint, 0),
    coalesce(p->'accepted_game_assets', '[]'::jsonb),
    coalesce((p->>'plays')::int, 0),
    coalesce((p->>'high_score')::bigint, 0),
    p->>'high_score_by',
    coalesce((p->>'published')::boolean, true),
    v_status,
    greatest(0, coalesce((p->>'upvotes')::int, 0)),
    coalesce(p->'upvoted_by', '[]'::jsonb),
    coalesce((p->>'created_at')::timestamptz, now()),
    now()
  )
  on conflict (id) do update set
    title = excluded.title,
    description = excluded.description,
    rules = excluded.rules,
    image_url = excluded.image_url,
    css = excluded.css,
    game_code = excluded.game_code,
    engine = excluded.engine,
    play_fee = excluded.play_fee,
    play_fee_token = excluded.play_fee_token,
    payout_top_n = excluded.payout_top_n,
    play_time_sec = excluded.play_time_sec,
    creator = excluded.creator,
    creator_principal = excluded.creator_principal,
    escrow_id = excluded.escrow_id,
    linked_label_id = excluded.linked_label_id,
    accepted_game_assets = excluded.accepted_game_assets,
    plays = excluded.plays,
    high_score = excluded.high_score,
    high_score_by = excluded.high_score_by,
    published = excluded.published,
    status = excluded.status,
    upvotes = excluded.upvotes,
    upvoted_by = excluded.upvoted_by,
    updated_at = now();

  return jsonb_build_object('ok', true, 'id', v_id, 'status', v_status);
end;
$$;

grant execute on function public.gh_arcade_upsert_game(jsonb) to anon, authenticated;

-- ── Paid leaderboard rows (testing + live) — not localStorage ──
create table if not exists public.gh_arcade_scores (
  id text primary key,
  game_id text not null,
  username text not null,
  principal text not null default '',
  score bigint not null,
  paid boolean not null default true,
  play_fee double precision not null default 0,
  play_fee_token text not null default 'ICP',
  session_id text,
  end_reason text,
  settlement_kind text,
  settlement_note text,
  at timestamptz not null default now()
);

create index if not exists gh_arcade_scores_game_idx
  on public.gh_arcade_scores (game_id, score desc, at desc);
create index if not exists gh_arcade_scores_session_idx
  on public.gh_arcade_scores (session_id) where session_id is not null;

alter table public.gh_arcade_scores enable row level security;
do $$ begin
  create policy gh_arcade_scores_select on public.gh_arcade_scores for select using (true);
exception when duplicate_object then null; end $$;

create or replace function public.gh_arcade_upsert_score(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text := coalesce(nullif(p->>'id', ''), 'scr_' || replace(gen_random_uuid()::text, '-', ''));
begin
  insert into public.gh_arcade_scores as s (
    id, game_id, username, principal, score, paid,
    play_fee, play_fee_token, session_id, end_reason,
    settlement_kind, settlement_note, at
  ) values (
    v_id,
    coalesce(p->>'game_id', ''),
    coalesce(p->>'username', 'player'),
    coalesce(p->>'principal', ''),
    coalesce((p->>'score')::bigint, 0),
    coalesce((p->>'paid')::boolean, true),
    coalesce((p->>'play_fee')::double precision, 0),
    coalesce(p->>'play_fee_token', 'ICP'),
    nullif(p->>'session_id', ''),
    p->>'end_reason',
    p->>'settlement_kind',
    p->>'settlement_note',
    coalesce((p->>'at')::timestamptz, now())
  )
  on conflict (id) do update set
    score = excluded.score,
    settlement_kind = excluded.settlement_kind,
    settlement_note = excluded.settlement_note,
    at = excluded.at;

  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

grant execute on function public.gh_arcade_upsert_score(jsonb) to anon, authenticated;

-- Arcade realtime publication
do $$ begin
  alter publication supabase_realtime add table public.gh_arcade_sessions;
exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.gh_arcade_games;
exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.gh_arcade_score_events;
exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.gh_arcade_scores;
exception when duplicate_object then null; when undefined_object then null; end $$;
