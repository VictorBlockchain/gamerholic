-- Fix: free play "Could not start session" — gen_random_bytes requires pgcrypto.
-- Run in Supabase SQL Editor (safe replace of existing RPC).

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

  select count(*) into v_open from public.gh_arcade_sessions
  where player_principal = v_player and game_id = v_game and status = 'open';
  if v_open > 0 then
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
