-- Platform roles on gh_profiles (Supabase-side admin / moderator).
-- On-chain moderator ladder remains separate (canister AdminMod / setAdmin).
-- Console UI accepts either source of truth for access gates.
--
-- Apply in Supabase SQL Editor after base schema.sql.
--
-- Bootstrap first admin (pick one):
--   update public.gh_profiles set role = 'admin' where principal = '<II principal>';
-- Or: connect once so a row exists, then from the app with zero admins
--   the first self-assign to admin is allowed (see admin_set_gh_profile_role).

-- ── Column ──────────────────────────────────────────────────
alter table public.gh_profiles
  add column if not exists role text not null default 'user';

do $$ begin
  alter table public.gh_profiles
    drop constraint if exists gh_profiles_role_check;
  alter table public.gh_profiles
    add constraint gh_profiles_role_check
    check (role in ('user', 'moderator', 'admin'));
exception when others then null;
end $$;

create index if not exists gh_profiles_role_idx on public.gh_profiles (role);

comment on column public.gh_profiles.role is
  'Platform role: user | moderator | admin. Not writable via upsert_gh_profile.';

-- ── Upsert must never accept client-supplied role (preserve existing) ──
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
    principal, username, avatar_url, bio, console, games, metadata, role, updated_at
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
    'user', -- always user on insert; promotions only via admin_set_gh_profile_role
    now()
  )
  on conflict (principal) do update set
    username = coalesce(excluded.username, g.username),
    avatar_url = coalesce(excluded.avatar_url, g.avatar_url),
    bio = coalesce(excluded.bio, g.bio),
    console = coalesce(excluded.console, g.console),
    games = excluded.games,
    metadata = g.metadata || excluded.metadata,
    -- role intentionally NOT updated from client payload
    updated_at = now();

  return jsonb_build_object('ok', true, 'principal', v_principal);
end;
$$;

grant execute on function public.upsert_gh_profile(jsonb) to anon, authenticated;

-- ── Admin assigns platform role ─────────────────────────────
-- caller_principal must be admin, OR no admin exists yet and
-- caller is promoting themselves to admin (bootstrap).
create or replace function public.admin_set_gh_profile_role(
  p_caller text,
  p_target text,
  p_role text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller text := nullif(trim(coalesce(p_caller, '')), '');
  v_target text := nullif(trim(coalesce(p_target, '')), '');
  v_role text := lower(nullif(trim(coalesce(p_role, '')), ''));
  v_caller_role text;
  v_admin_count int;
  v_username text;
begin
  if v_caller is null or v_caller = '2vxsx-fae' then
    return jsonb_build_object('ok', false, 'error', 'caller_required');
  end if;
  if v_target is null or v_target = '2vxsx-fae' then
    return jsonb_build_object('ok', false, 'error', 'target_required');
  end if;
  if v_role is null or v_role not in ('user', 'moderator', 'admin') then
    return jsonb_build_object('ok', false, 'error', 'invalid_role');
  end if;

  select role into v_caller_role
  from public.gh_profiles
  where principal = v_caller;

  select count(*)::int into v_admin_count
  from public.gh_profiles
  where role = 'admin';

  if coalesce(v_caller_role, 'user') = 'admin' then
    null; -- ok
  elsif v_admin_count = 0 and v_caller = v_target and v_role = 'admin' then
    null; -- bootstrap: first admin may self-assign
  else
    return jsonb_build_object(
      'ok', false,
      'error', 'forbidden',
      'hint', 'Only platform admins can assign roles. Bootstrap: set role=admin in SQL or self-assign when no admin exists.'
    );
  end if;

  -- Ensure target row exists (create shell if needed)
  insert into public.gh_profiles (principal, role, updated_at)
  values (v_target, v_role, now())
  on conflict (principal) do update set
    role = excluded.role,
    updated_at = now();

  select username into v_username
  from public.gh_profiles
  where principal = v_target;

  return jsonb_build_object(
    'ok', true,
    'principal', v_target,
    'username', v_username,
    'role', v_role
  );
end;
$$;

grant execute on function public.admin_set_gh_profile_role(text, text, text)
  to anon, authenticated;

-- Optional: list profiles with roles (public SELECT already exists; this is convenience)
create or replace function public.list_gh_profiles_for_roles(p_limit int default 100)
returns table (
  principal text,
  username text,
  role text,
  avatar_url text,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    g.principal,
    g.username,
    g.role,
    g.avatar_url,
    g.updated_at
  from public.gh_profiles g
  order by
    case g.role when 'admin' then 0 when 'moderator' then 1 else 2 end,
    g.updated_at desc nulls last
  limit greatest(1, least(coalesce(p_limit, 100), 500));
$$;

grant execute on function public.list_gh_profiles_for_roles(int)
  to anon, authenticated;
