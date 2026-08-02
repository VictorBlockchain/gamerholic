-- Community chat: message insert RPC + unique community rooms
-- Run in Supabase SQL Editor

-- Messages: allow insert via security definer (RLS is select-only)
create or replace function public.insert_gh_message(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text := coalesce(nullif(p->>'id', ''), 'msg_' || replace(gen_random_uuid()::text, '-', ''));
  v_thread text := nullif(trim(p->>'thread_id'), '');
  v_sender text := nullif(trim(p->>'sender_id'), '');
  v_body text := left(trim(coalesce(p->>'body', '')), 500);
  v_at timestamptz := now();
begin
  if v_thread is null or v_sender is null or length(v_body) < 1 then
    return jsonb_build_object('ok', false, 'error', 'thread_id, sender_id, body required');
  end if;
  insert into public.gh_messages (id, thread_id, sender_id, body, created_at)
  values (v_id, v_thread, v_sender, v_body, v_at);
  return jsonb_build_object(
    'ok', true,
    'id', v_id,
    'thread_id', v_thread,
    'sender_id', v_sender,
    'body', v_body,
    'created_at', v_at
  );
end;
$$;

grant execute on function public.insert_gh_message(jsonb) to anon, authenticated;

-- Community rooms
create table if not exists public.gh_community_rooms (
  id text primary key,
  name text not null,
  slug text not null,
  topic text not null default '',
  kind text not null default 'community',
  game text,
  creator text,
  member_count int not null default 1,
  created_at timestamptz not null default now()
);

create unique index if not exists gh_community_rooms_name_ci
  on public.gh_community_rooms (lower(name));
create unique index if not exists gh_community_rooms_slug_ci
  on public.gh_community_rooms (lower(slug));

alter table public.gh_community_rooms enable row level security;

do $$ begin
  create policy gh_community_rooms_select on public.gh_community_rooms
    for select using (true);
exception when duplicate_object then null; end $$;

create or replace function public.upsert_gh_community_room(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text := coalesce(nullif(p->>'id', ''), 'comm_' || replace(gen_random_uuid()::text, '-', ''));
  v_name text := trim(coalesce(p->>'name', ''));
  v_slug text := trim(coalesce(p->>'slug', ''));
begin
  if length(v_name) < 3 then
    return jsonb_build_object('ok', false, 'error', 'name too short');
  end if;
  if length(v_slug) < 2 then
    return jsonb_build_object('ok', false, 'error', 'invalid slug');
  end if;
  if exists (
    select 1 from public.gh_community_rooms
    where lower(name) = lower(v_name) or lower(slug) = lower(v_slug)
  ) then
    return jsonb_build_object('ok', false, 'error', 'That chatroom name is already taken');
  end if;

  insert into public.gh_community_rooms (
    id, name, slug, topic, kind, game, creator, member_count, created_at
  ) values (
    v_id,
    v_name,
    v_slug,
    coalesce(p->>'topic', ''),
    coalesce(nullif(p->>'kind', ''), 'community'),
    nullif(p->>'game', ''),
    nullif(p->>'creator', ''),
    coalesce((p->>'member_count')::int, 1),
    now()
  );

  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

grant execute on function public.upsert_gh_community_room(jsonb) to anon, authenticated;

do $$ begin
  alter publication supabase_realtime add table public.gh_community_rooms;
exception when duplicate_object then null; when undefined_object then null; end $$;

-- Seed global + LFG + watch if missing
insert into public.gh_community_rooms (id, name, slug, topic, kind, member_count)
values
  ('global', 'Gamerholic Lounge', 'global', 'Global community chat — everyone welcome', 'global', 0),
  ('lfg', 'LFG / Looking for group', 'lfg', 'Find duo, squad, or team', 'lfg', 0),
  ('watch', 'Watch party', 'watch', 'Live brackets and streams', 'watch', 0)
on conflict (id) do nothing;
