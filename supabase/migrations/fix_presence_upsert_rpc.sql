-- Fix: online presence heartbeats fail with RLS (anon cannot INSERT/UPDATE gh_presence).
-- Run in Supabase SQL Editor.

create table if not exists public.gh_presence (
  principal text primary key,
  username text,
  status text not null default 'online',
  game text,
  updated_at timestamptz not null default now()
);

alter table public.gh_presence enable row level security;

do $$ begin
  create policy gh_presence_select on public.gh_presence for select using (true);
exception when duplicate_object then null; end $$;

-- Security-definer upsert so browser anon key can heartbeat
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

-- Realtime so dashboard online list updates without full reload
do $$ begin
  alter publication supabase_realtime add table public.gh_presence;
exception when duplicate_object then null; when undefined_object then null; end $$;
