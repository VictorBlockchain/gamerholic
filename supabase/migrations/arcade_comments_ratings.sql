-- Arcade play page: testing/live comments (bug|feedback), 5★ ratings, approval date.
-- Apply in Supabase SQL Editor after schema.sql (or re-run full-bundle if you cat migrations).

-- ── Approval timestamp when testing → live ──
alter table public.gh_arcade_games
  add column if not exists approved_at timestamptz;

create index if not exists gh_arcade_games_approved_idx
  on public.gh_arcade_games (approved_at desc nulls last);

-- ── Comments (Live + Testing channels) ──
create table if not exists public.gh_arcade_comments (
  id text primary key,
  game_id text not null,
  channel text not null
    check (channel in ('testing', 'live')),
  kind text not null
    check (kind in ('bug', 'feedback')),
  body text not null,
  author_principal text not null default '',
  author_username text not null default '',
  -- bugs default unresolved; feedback always treated as n/a (resolved=false)
  resolved boolean not null default false,
  resolved_by text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gh_arcade_comments_game_channel_idx
  on public.gh_arcade_comments (game_id, channel, created_at desc);

create index if not exists gh_arcade_comments_game_bugs_idx
  on public.gh_arcade_comments (game_id, kind, resolved)
  where kind = 'bug';

alter table public.gh_arcade_comments enable row level security;

do $$ begin
  create policy gh_arcade_comments_select
    on public.gh_arcade_comments for select using (true);
exception when duplicate_object then null; end $$;

-- Insert comment (anon-friendly demo path, same pattern as score upsert)
create or replace function public.gh_arcade_add_comment(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text := coalesce(nullif(p->>'id', ''), 'cmt_' || replace(gen_random_uuid()::text, '-', ''));
  v_channel text := coalesce(nullif(p->>'channel', ''), 'testing');
  v_kind text := coalesce(nullif(p->>'kind', ''), 'feedback');
  v_body text := trim(coalesce(p->>'body', ''));
  v_principal text := trim(coalesce(p->>'author_principal', p->>'principal', ''));
begin
  if v_channel not in ('testing', 'live') then
    return jsonb_build_object('ok', false, 'error', 'invalid channel');
  end if;
  if v_kind not in ('bug', 'feedback') then
    return jsonb_build_object('ok', false, 'error', 'invalid kind');
  end if;
  if length(v_body) < 2 then
    return jsonb_build_object('ok', false, 'error', 'comment too short');
  end if;
  if length(v_body) > 4000 then
    return jsonb_build_object('ok', false, 'error', 'comment too long');
  end if;
  if v_principal = '' then
    return jsonb_build_object('ok', false, 'error', 'sign in required');
  end if;

  insert into public.gh_arcade_comments (
    id, game_id, channel, kind, body,
    author_principal, author_username,
    resolved, created_at, updated_at
  ) values (
    v_id,
    coalesce(p->>'game_id', ''),
    v_channel,
    v_kind,
    v_body,
    v_principal,
    coalesce(p->>'author_username', p->>'username', 'player'),
    false,
    now(),
    now()
  );

  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

grant execute on function public.gh_arcade_add_comment(jsonb) to anon, authenticated;

-- Creator resolves / reopens a bug
create or replace function public.gh_arcade_set_comment_resolved(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text := coalesce(p->>'id', p->>'comment_id', '');
  v_principal text := trim(coalesce(p->>'creator_principal', p->>'principal', ''));
  v_resolved boolean := coalesce((p->>'resolved')::boolean, true);
  v_c public.gh_arcade_comments%rowtype;
  v_creator text;
begin
  if v_id = '' then
    return jsonb_build_object('ok', false, 'error', 'missing comment id');
  end if;
  if v_principal = '' then
    return jsonb_build_object('ok', false, 'error', 'sign in required');
  end if;

  select * into v_c from public.gh_arcade_comments where id = v_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'comment not found');
  end if;
  if v_c.kind <> 'bug' then
    return jsonb_build_object('ok', false, 'error', 'only bugs can be resolved');
  end if;

  select creator_principal into v_creator
  from public.gh_arcade_games
  where id = v_c.game_id;

  if coalesce(v_creator, '') <> '' and v_creator <> v_principal then
    return jsonb_build_object('ok', false, 'error', 'only the game creator can resolve bugs');
  end if;

  update public.gh_arcade_comments set
    resolved = v_resolved,
    resolved_by = case when v_resolved then v_principal else null end,
    resolved_at = case when v_resolved then now() else null end,
    updated_at = now()
  where id = v_id;

  return jsonb_build_object('ok', true, 'id', v_id, 'resolved', v_resolved);
end;
$$;

grant execute on function public.gh_arcade_set_comment_resolved(jsonb) to anon, authenticated;

-- ── 5-star ratings (one per principal per game; used during testing) ──
create table if not exists public.gh_arcade_ratings (
  id text primary key,
  game_id text not null,
  principal text not null,
  username text not null default '',
  stars int not null check (stars >= 1 and stars <= 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (game_id, principal)
);

create index if not exists gh_arcade_ratings_game_idx
  on public.gh_arcade_ratings (game_id, stars);

alter table public.gh_arcade_ratings enable row level security;

do $$ begin
  create policy gh_arcade_ratings_select
    on public.gh_arcade_ratings for select using (true);
exception when duplicate_object then null; end $$;

create or replace function public.gh_arcade_upsert_rating(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_principal text := trim(coalesce(p->>'principal', ''));
  v_game text := coalesce(p->>'game_id', '');
  v_stars int := coalesce((p->>'stars')::int, 0);
  v_id text;
begin
  if v_game = '' then
    return jsonb_build_object('ok', false, 'error', 'missing game_id');
  end if;
  if v_principal = '' then
    return jsonb_build_object('ok', false, 'error', 'sign in required');
  end if;
  if v_stars < 1 or v_stars > 5 then
    return jsonb_build_object('ok', false, 'error', 'stars must be 1–5');
  end if;

  v_id := coalesce(
    nullif(p->>'id', ''),
    'rt_' || md5(v_game || ':' || v_principal)
  );

  insert into public.gh_arcade_ratings as r (
    id, game_id, principal, username, stars, created_at, updated_at
  ) values (
    v_id,
    v_game,
    v_principal,
    coalesce(p->>'username', 'player'),
    v_stars,
    now(),
    now()
  )
  on conflict (game_id, principal) do update set
    stars = excluded.stars,
    username = excluded.username,
    updated_at = now();

  return jsonb_build_object('ok', true, 'id', v_id, 'stars', v_stars);
end;
$$;

grant execute on function public.gh_arcade_upsert_rating(jsonb) to anon, authenticated;

-- Patch upsert game to accept approved_at when promoting to live
create or replace function public.gh_arcade_upsert_game(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text := coalesce(p->>'id', 'game_' || replace(gen_random_uuid()::text, '-', ''));
  v_status text := coalesce(nullif(p->>'status', ''), 'testing');
  v_approved timestamptz := null;
begin
  if v_status not in ('testing', 'live') then
    v_status := 'testing';
  end if;

  if p ? 'approved_at' and nullif(p->>'approved_at', '') is not null then
    v_approved := (p->>'approved_at')::timestamptz;
  elsif v_status = 'live' then
    -- keep existing approved_at if already set; set now only when first going live
    v_approved := null;
  end if;

  insert into public.gh_arcade_games as g (
    id, title, description, rules, image_url, css, game_code, engine,
    play_fee, play_fee_token, payout_top_n, play_time_sec,
    creator, creator_principal, escrow_id, linked_label_id,
    accepted_game_assets, plays, high_score, high_score_by, published,
    status, upvotes, upvoted_by, approved_at,
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
    case
      when v_status = 'live' then coalesce(v_approved, now())
      else null
    end,
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
    approved_at = case
      when excluded.status = 'live' then
        coalesce(g.approved_at, excluded.approved_at, now())
      else null
    end,
    updated_at = now();

  return jsonb_build_object('ok', true, 'id', v_id, 'status', v_status);
end;
$$;

grant execute on function public.gh_arcade_upsert_game(jsonb) to anon, authenticated;
