-- Combined Supabase schema: gamers, challenges, tournaments, games, teams, triggers
-- Includes: games catalog, teams table, gamers.tournaments jsonb, gamers.cover_url,
-- and trigger to update gamer game stats when a challenge is SCORE_CONFIRMED.

BEGIN;

-- Extensions for UUID generation (Supabase supports pgcrypto)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  logo_url text,
  cover_url text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Games catalog
CREATE TABLE IF NOT EXISTS public.games (
  id bigserial PRIMARY KEY,
  title text UNIQUE NOT NULL,
  platform text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Gamers table (normalized + jsonb fields)
CREATE TABLE IF NOT EXISTS public.gamers (
  wallet text PRIMARY KEY,
  username text NOT NULL,
  avatar_url text,
  cover_url text, -- new
  xft integer DEFAULT 0,
  bio text,
  team text, -- legacy textual team name
  team_id uuid, -- optional FK to teams
  role text,
  region text,
  -- Games per gamer as JSONB array of entries: { game_id, title, console, rank, mmr, main, win_loss_record: {wins, losses}, win_streak, loss_streak, last_played_at }
  games jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Completed tournaments for the gamer
  tournaments jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Socials as JSONB object: { twitter, discord, twitch, youtube }
  socials jsonb NOT NULL DEFAULT '{}'::jsonb,
  streaming boolean NOT NULL DEFAULT false,
  achievements jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Optional FK from gamers.team_id to teams
ALTER TABLE public.gamers
  ADD CONSTRAINT gamers_team_fk
  FOREIGN KEY (team_id) REFERENCES public.teams(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

-- Team members pivot table
CREATE TABLE IF NOT EXISTS public.team_players (
  id bigserial PRIMARY KEY,
  team_id uuid NOT NULL,
  wallet text NOT NULL,
  role text,
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, wallet)
);

ALTER TABLE public.team_players
  ADD CONSTRAINT team_players_team_fk
  FOREIGN KEY (team_id) REFERENCES public.teams(id)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.team_players
  ADD CONSTRAINT team_players_gamer_fk
  FOREIGN KEY (wallet) REFERENCES public.gamers(wallet)
  ON UPDATE CASCADE ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS team_players_team_idx ON public.team_players (team_id);
CREATE INDEX IF NOT EXISTS team_players_gamer_idx ON public.team_players (wallet);

-- Challenges table (includes streaming fields)
CREATE TABLE IF NOT EXISTS public.challenges (
  -- Primary identifiers
  contract_address text PRIMARY KEY,
  onchain_id numeric,

  -- Core metadata
  creator text NOT NULL,
  opponent text,
  challenge_type smallint NOT NULL DEFAULT 0, -- 0 HEADS_UP, 1 TOURNAMENT
  status smallint NOT NULL DEFAULT 1,         -- 0 CANCELLED, 1 ACTIVE, 2 ACCEPTED, 3 SCORE_REPORTED, 4 SCORE_CONFIRMED, 5 DISPUTED
  game_type text,
  metadata jsonb,

  -- Financials
  entry_fee numeric,
  total_prize_pool numeric DEFAULT 0,
  pay_token text,
  contract_balance numeric DEFAULT 0,

  -- Participants
  max_participants integer,
  current_participants integer DEFAULT 0,
  participants jsonb,

  -- Scoring & lifecycle
  player1score numeric,
  score_reporter text,
  time_scored timestamptz,
  time_score_confirmed timestamptz,
  winner text,
  funds_distributed boolean DEFAULT false,

  -- Links
  tournament_address text,

  -- Streaming
  is_streaming boolean NOT NULL DEFAULT false,
  stream_embed_code text,

  -- Timestamps
  created_at timestamptz DEFAULT now()
);

-- Tournaments table
CREATE TABLE IF NOT EXISTS public.tournaments (
  contract_address text PRIMARY KEY,

  -- Core metadata
  creator text NOT NULL,
  entry_fee numeric,
  max_participants integer,
  created_at timestamptz DEFAULT now(),
  game_type text,
  metadata jsonb,
  pay_token text,
  is_ffa boolean DEFAULT false,
  status smallint DEFAULT 0,   -- TournamentStatus { ACTIVE(0), COMPLETED(1), DISPUTED(2), CANCELLED(3) }

  -- Financials
  total_prize_pool numeric DEFAULT 0,
  fee_recipient text,
  platform_fee_amount numeric DEFAULT 0,

  -- Factory links
  factory text,
  tournament_factory text,

  -- Participants and matches
  participants jsonb,
  active_participants jsonb,
  current_round_matches jsonb,
  round_matches jsonb,
  challenges jsonb,
  match_to_challenge jsonb,

  -- Bracket & placements
  final_match text,
  third_place_match text,
  semifinal_losers jsonb,
  first_place text,
  second_place text,
  third_place text,
  reported_first text,
  reported_second text,
  reported_third text,
  reported_ffa_winner text
);

-- Indexes
CREATE INDEX IF NOT EXISTS challenges_creator_idx ON public.challenges (creator);
CREATE INDEX IF NOT EXISTS challenges_opponent_idx ON public.challenges (opponent);
CREATE INDEX IF NOT EXISTS challenges_status_idx ON public.challenges (status);
CREATE INDEX IF NOT EXISTS challenges_created_at_idx ON public.challenges (created_at);
CREATE INDEX IF NOT EXISTS challenges_game_type_idx ON public.challenges (game_type);

CREATE INDEX IF NOT EXISTS tournaments_creator_idx ON public.tournaments (creator);
CREATE INDEX IF NOT EXISTS tournaments_status_idx ON public.tournaments (status);
CREATE INDEX IF NOT EXISTS tournaments_created_at_idx ON public.tournaments (created_at);
CREATE INDEX IF NOT EXISTS tournaments_game_type_idx ON public.tournaments (game_type);
CREATE INDEX IF NOT EXISTS tournaments_is_ffa_idx ON public.tournaments (is_ffa);

-- Foreign keys
ALTER TABLE public.challenges
  ADD CONSTRAINT challenges_creator_fk
  FOREIGN KEY (creator) REFERENCES public.gamers(wallet)
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE public.challenges
  ADD CONSTRAINT challenges_opponent_fk
  FOREIGN KEY (opponent) REFERENCES public.gamers(wallet)
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE public.challenges
  ADD CONSTRAINT challenges_tournament_fk
  FOREIGN KEY (tournament_address) REFERENCES public.tournaments(contract_address)
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE public.tournaments
  ADD CONSTRAINT tournaments_creator_fk
  FOREIGN KEY (creator) REFERENCES public.gamers(wallet)
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE public.tournaments
  ADD CONSTRAINT tournaments_first_place_fk
  FOREIGN KEY (first_place) REFERENCES public.gamers(wallet)
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE public.tournaments
  ADD CONSTRAINT tournaments_second_place_fk
  FOREIGN KEY (second_place) REFERENCES public.gamers(wallet)
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE public.tournaments
  ADD CONSTRAINT tournaments_third_place_fk
  FOREIGN KEY (third_place) REFERENCES public.gamers(wallet)
  ON UPDATE CASCADE ON DELETE SET NULL;

-- Chats table: supports challenge and tournament scoped chat messages
CREATE TABLE IF NOT EXISTS public.chats (
  id bigserial PRIMARY KEY,
  chat_address text NOT NULL, -- canonical chat scope (challenge or tournament address)
  challenge_address text, -- FK to challenges.contract_address
  tournament_address text, -- FK to tournaments.contract_address
  sender_wallet text NOT NULL, -- FK to gamers.wallet
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Optional foreign keys for referential integrity
ALTER TABLE public.chats
  ADD CONSTRAINT chats_challenge_fk
  FOREIGN KEY (challenge_address) REFERENCES public.challenges(contract_address)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.chats
  ADD CONSTRAINT chats_tournament_fk
  FOREIGN KEY (tournament_address) REFERENCES public.tournaments(contract_address)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.chats
  ADD CONSTRAINT chats_sender_fk
  FOREIGN KEY (sender_wallet) REFERENCES public.gamers(wallet)
  ON UPDATE CASCADE ON DELETE SET NULL;

-- Indexes for efficient querying by scope and time
CREATE INDEX IF NOT EXISTS chats_chat_address_idx ON public.chats (chat_address);
CREATE INDEX IF NOT EXISTS chats_challenge_idx ON public.chats (challenge_address);
CREATE INDEX IF NOT EXISTS chats_tournament_idx ON public.chats (tournament_address);
CREATE INDEX IF NOT EXISTS chats_sender_idx ON public.chats (sender_wallet);
CREATE INDEX IF NOT EXISTS chats_created_at_idx ON public.chats (created_at);

-- Helper function: upsert a single game record in gamers.games JSONB
CREATE OR REPLACE FUNCTION public.upsert_gamer_game_record(
  p_wallet text,
  p_game_id bigint,
  p_title text,
  p_is_win boolean
) RETURNS void AS $$
DECLARE
  v_games jsonb;
  v_new_array jsonb := '[]'::jsonb;
  v_elem jsonb;
  v_found boolean := false;
  v_wins int;
  v_losses int;
  v_win_streak int;
  v_loss_streak int;
BEGIN
  SELECT games INTO v_games FROM public.gamers WHERE wallet = p_wallet FOR UPDATE;
  IF v_games IS NULL THEN
    v_games := '[]'::jsonb;
  END IF;

  FOR v_elem IN SELECT elem FROM jsonb_array_elements(v_games) AS t(elem) LOOP
    IF (COALESCE((v_elem->>'game_id')::bigint, NULL) = p_game_id)
       OR lower(COALESCE(v_elem->>'title','')) = lower(COALESCE(p_title,'')) THEN
      v_found := true;
      v_wins := COALESCE((v_elem->'win_loss_record'->>'wins')::int, 0) + CASE WHEN p_is_win THEN 1 ELSE 0 END;
      v_losses := COALESCE((v_elem->'win_loss_record'->>'losses')::int, 0) + CASE WHEN p_is_win THEN 0 ELSE 1 END;
      v_win_streak := CASE WHEN p_is_win THEN COALESCE((v_elem->>'win_streak')::int, 0) + 1 ELSE 0 END;
      v_loss_streak := CASE WHEN p_is_win THEN 0 ELSE COALESCE((v_elem->>'loss_streak')::int, 0) + 1 END;

      v_elem := jsonb_set(v_elem, '{game_id}', to_jsonb(p_game_id), true);
      v_elem := jsonb_set(v_elem, '{title}', to_jsonb(p_title), true);
      v_elem := jsonb_set(v_elem, '{win_loss_record}', jsonb_build_object('wins', v_wins, 'losses', v_losses), true);
      v_elem := jsonb_set(v_elem, '{win_streak}', to_jsonb(v_win_streak), true);
      v_elem := jsonb_set(v_elem, '{loss_streak}', to_jsonb(v_loss_streak), true);
      v_elem := jsonb_set(v_elem, '{last_played_at}', to_jsonb(now()), true);
    END IF;
    v_new_array := v_new_array || jsonb_build_array(v_elem);
  END LOOP;

  IF NOT v_found THEN
    v_new_array := v_new_array || jsonb_build_array(jsonb_build_object(
      'game_id', p_game_id,
      'title', p_title,
      'win_loss_record', jsonb_build_object('wins', CASE WHEN p_is_win THEN 1 ELSE 0 END, 'losses', CASE WHEN p_is_win THEN 0 ELSE 1 END),
      'win_streak', CASE WHEN p_is_win THEN 1 ELSE 0 END,
      'loss_streak', CASE WHEN p_is_win THEN 0 ELSE 1 END,
      'last_played_at', now()
    ));
  END IF;

  UPDATE public.gamers
  SET games = v_new_array,
      updated_at = now()
  WHERE wallet = p_wallet;
END;
$$ LANGUAGE plpgsql;

-- Trigger function: on challenges status change to SCORE_CONFIRMED (4), update gamer records
CREATE OR REPLACE FUNCTION public.trg_challenges_on_score_confirmed()
RETURNS trigger AS $$
DECLARE
  v_game_id bigint;
  v_title text;
  v_winner text;
  v_loser text;
BEGIN
  -- Only proceed when status transitions to SCORE_CONFIRMED (4)
  IF TG_OP = 'UPDATE' AND NEW.status = 4 AND COALESCE(OLD.status, -1) <> 4 THEN
    v_title := NEW.game_type;
    -- Resolve/ensure game_id in catalog
    SELECT id INTO v_game_id FROM public.games WHERE lower(title) = lower(v_title);
    IF v_game_id IS NULL THEN
      INSERT INTO public.games (title) VALUES (v_title)
      ON CONFLICT (title) DO UPDATE SET updated_at = now()
      RETURNING id INTO v_game_id;
    END IF;

    v_winner := NEW.winner;
    IF v_winner IS NULL THEN
      -- If winner not set, do nothing
      RETURN NEW;
    END IF;

    -- Determine loser from creator/opponent when available
    IF NEW.opponent IS NOT NULL THEN
      v_loser := CASE WHEN v_winner = NEW.creator THEN NEW.opponent ELSE NEW.creator END;
    ELSE
      -- Fallback: skip loser update if opponent unknown
      v_loser := NULL;
    END IF;

    -- Update winner record
    PERFORM public.upsert_gamer_game_record(v_winner, v_game_id, v_title, true);

    -- Update loser record if resolvable
    IF v_loser IS NOT NULL THEN
      PERFORM public.upsert_gamer_game_record(v_loser, v_game_id, v_title, false);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to challenges table
DROP TRIGGER IF EXISTS trg_challenges_score_confirmed ON public.challenges;
CREATE TRIGGER trg_challenges_score_confirmed
AFTER UPDATE OF status ON public.challenges
FOR EACH ROW EXECUTE FUNCTION public.trg_challenges_on_score_confirmed();

-- Row Level Security and policies (web3-managed auth outside DB)
-- Enable RLS and allow public access; rely on app-side signature validation.

-- Gamers
ALTER TABLE public.gamers ENABLE ROW LEVEL SECURITY;
CREATE POLICY gamers_select_public ON public.gamers FOR SELECT USING (true);
CREATE POLICY gamers_insert_public ON public.gamers FOR INSERT WITH CHECK (true);
CREATE POLICY gamers_update_public ON public.gamers FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY gamers_delete_public ON public.gamers FOR DELETE USING (true);

-- Teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY teams_select_public ON public.teams FOR SELECT USING (true);
CREATE POLICY teams_insert_public ON public.teams FOR INSERT WITH CHECK (true);
CREATE POLICY teams_update_public ON public.teams FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY teams_delete_public ON public.teams FOR DELETE USING (true);

-- Team players
ALTER TABLE public.team_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY team_players_select_public ON public.team_players FOR SELECT USING (true);
CREATE POLICY team_players_insert_public ON public.team_players FOR INSERT WITH CHECK (true);
CREATE POLICY team_players_update_public ON public.team_players FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY team_players_delete_public ON public.team_players FOR DELETE USING (true);

-- Games
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
CREATE POLICY games_select_public ON public.games FOR SELECT USING (true);
CREATE POLICY games_insert_public ON public.games FOR INSERT WITH CHECK (true);
CREATE POLICY games_update_public ON public.games FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY games_delete_public ON public.games FOR DELETE USING (true);

-- Challenges
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY challenges_select_public ON public.challenges FOR SELECT USING (true);
CREATE POLICY challenges_insert_public ON public.challenges FOR INSERT WITH CHECK (true);
CREATE POLICY challenges_update_public ON public.challenges FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY challenges_delete_public ON public.challenges FOR DELETE USING (true);

-- Tournaments
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tournaments_select_public ON public.tournaments FOR SELECT USING (true);
CREATE POLICY tournaments_insert_public ON public.tournaments FOR INSERT WITH CHECK (true);
CREATE POLICY tournaments_update_public ON public.tournaments FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY tournaments_delete_public ON public.tournaments FOR DELETE USING (true);

-- Chat rooms schema (group and one-on-one)
-- Tables
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_wallet text NOT NULL REFERENCES public.gamers(wallet) ON DELETE CASCADE,
  title text,
  is_direct boolean NOT NULL DEFAULT false,
  -- For 1:1 chats we store a canonical, sorted wallet pair
  direct_wallet_a text REFERENCES public.gamers(wallet) ON DELETE CASCADE,
  direct_wallet_b text REFERENCES public.gamers(wallet) ON DELETE CASCADE,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_message_at timestamptz,
  message_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CHECK (
    (is_direct = false)
    OR (is_direct = true AND direct_wallet_a IS NOT NULL AND direct_wallet_b IS NOT NULL AND direct_wallet_a <> direct_wallet_b AND direct_wallet_a < direct_wallet_b)
  )
);

-- Unique pair constraint for direct chats only
CREATE UNIQUE INDEX IF NOT EXISTS uniq_direct_room_pair
  ON public.chat_rooms (direct_wallet_a, direct_wallet_b)
  WHERE is_direct;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_chat_rooms_creator ON public.chat_rooms (creator_wallet);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_last_msg ON public.chat_rooms (last_message_at DESC);

CREATE TABLE IF NOT EXISTS public.chat_room_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  gamer_wallet text NOT NULL REFERENCES public.gamers(wallet) ON DELETE CASCADE,
  role text DEFAULT 'member', -- owner | moderator | member
  joined_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  left_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (room_id, gamer_wallet)
);

CREATE INDEX IF NOT EXISTS idx_chat_room_members_wallet ON public.chat_room_members (gamer_wallet);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_room ON public.chat_room_members (room_id);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_wallet text NOT NULL REFERENCES public.gamers(wallet) ON DELETE CASCADE,
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  edited_at timestamptz,
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room_time ON public.chat_messages (room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_time ON public.chat_messages (sender_wallet, created_at);

CREATE TABLE IF NOT EXISTS public.chat_message_receipts (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  message_id bigint NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  reader_wallet text NOT NULL REFERENCES public.gamers(wallet) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (message_id, reader_wallet)
);

CREATE INDEX IF NOT EXISTS idx_chat_message_receipts_reader ON public.chat_message_receipts (reader_wallet);

-- Utility triggers and functions
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.on_message_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_rooms
    SET last_message_at = NEW.created_at,
        message_count = message_count + 1,
        updated_at = timezone('utc', now())
  WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS trg_chat_rooms_touch ON public.chat_rooms;
CREATE TRIGGER trg_chat_rooms_touch
BEFORE UPDATE ON public.chat_rooms
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_chat_room_members_touch ON public.chat_room_members;
CREATE TRIGGER trg_chat_room_members_touch
BEFORE UPDATE ON public.chat_room_members
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_chat_messages_on_insert ON public.chat_messages;
CREATE TRIGGER trg_chat_messages_on_insert
AFTER INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.on_message_insert();

-- Helper functions for creating rooms
CREATE OR REPLACE FUNCTION public.create_room(p_creator_wallet text, p_title text, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS uuid AS $$
DECLARE rid uuid;
BEGIN
  INSERT INTO public.chat_rooms (creator_wallet, title, is_direct, metadata)
  VALUES (p_creator_wallet, p_title, false, COALESCE(p_metadata, '{}'::jsonb))
  RETURNING id INTO rid;

  INSERT INTO public.chat_room_members (room_id, gamer_wallet, role)
  VALUES (rid, p_creator_wallet, 'owner')
  ON CONFLICT DO NOTHING;

  RETURN rid;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.create_direct_room(a_wallet text, b_wallet text, p_title text DEFAULT NULL, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS uuid AS $$
DECLARE wa text; wb text; rid uuid;
BEGIN
  IF a_wallet = b_wallet THEN
    RAISE EXCEPTION 'Direct chat participants must be different';
  END IF;

  IF a_wallet < b_wallet THEN
    wa := a_wallet; wb := b_wallet;
  ELSE
    wa := b_wallet; wb := a_wallet;
  END IF;

  INSERT INTO public.chat_rooms (creator_wallet, title, is_direct, direct_wallet_a, direct_wallet_b, metadata)
  VALUES (wa, COALESCE(p_title, ''), true, wa, wb, COALESCE(p_metadata, '{}'::jsonb))
  ON CONFLICT (direct_wallet_a, direct_wallet_b)
  DO UPDATE SET updated_at = timezone('utc', now())
  RETURNING id INTO rid;

  INSERT INTO public.chat_room_members (room_id, gamer_wallet, role)
  VALUES (rid, wa, 'owner')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.chat_room_members (room_id, gamer_wallet, role)
  VALUES (rid, wb, 'member')
  ON CONFLICT DO NOTHING;

  RETURN rid;
END;
$$ LANGUAGE plpgsql;

-- RLS for chat tables
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY chat_rooms_select_public ON public.chat_rooms FOR SELECT USING (true);
CREATE POLICY chat_rooms_insert_public ON public.chat_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY chat_rooms_update_public ON public.chat_rooms FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY chat_rooms_delete_public ON public.chat_rooms FOR DELETE USING (true);

ALTER TABLE public.chat_room_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY chat_room_members_select_public ON public.chat_room_members FOR SELECT USING (true);
CREATE POLICY chat_room_members_insert_public ON public.chat_room_members FOR INSERT WITH CHECK (true);
CREATE POLICY chat_room_members_update_public ON public.chat_room_members FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY chat_room_members_delete_public ON public.chat_room_members FOR DELETE USING (true);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY chat_messages_select_public ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY chat_messages_insert_public ON public.chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY chat_messages_update_public ON public.chat_messages FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY chat_messages_delete_public ON public.chat_messages FOR DELETE USING (true);

ALTER TABLE public.chat_message_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY chat_message_receipts_select_public ON public.chat_message_receipts FOR SELECT USING (true);
CREATE POLICY chat_message_receipts_insert_public ON public.chat_message_receipts FOR INSERT WITH CHECK (true);
CREATE POLICY chat_message_receipts_update_public ON public.chat_message_receipts FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY chat_message_receipts_delete_public ON public.chat_message_receipts FOR DELETE USING (true);

COMMIT;