-- Paid arcade leaderboard (dashboard "my boards" + per-game scores).
-- Fixes: GET .../rest/v1/gh_arcade_scores → 404 (table not in this project)
--
-- Supabase Dashboard → SQL Editor → paste + Run.
-- Idempotent.

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
create index if not exists gh_arcade_scores_principal_idx
  on public.gh_arcade_scores (principal, paid, score desc)
  where principal <> '';

alter table public.gh_arcade_scores enable row level security;

do $$ begin
  create policy gh_arcade_scores_select on public.gh_arcade_scores
    for select using (true);
exception when duplicate_object then null; end $$;

-- Writes go through security-definer RPC (anon clients cannot insert directly).
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

do $$ begin
  alter publication supabase_realtime add table public.gh_arcade_scores;
exception when duplicate_object then null; when undefined_object then null; end $$;
