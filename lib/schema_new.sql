-- First create the extensions
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Create base tables first
CREATE TABLE public.players (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    name text,
    avatar text,
    player text NOT NULL,
    email text,
    youtube text,
    x text,
    tiktok text,
    twitch text,
    kick text,
    last_online timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT players_player_key UNIQUE (player)
);
ALTER TABLE public.players OWNER TO postgres;

-- Create esports table before wallet_esports
CREATE TABLE public.esports (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    game text NOT NULL,
    console text NOT NULL,
    amount double precision NOT NULL,
    rules text,
    player1 text NOT NULL,
    player2 text,
    player1score integer,
    player2score integer,
    status integer NOT NULL,
    scoredby text,
    created_at timestamp with time zone DEFAULT now(),
    scoredate timestamp with time zone,
    indisupte boolean,
    referee text,
    txid text,
    player1_name text,
    player2_name text,
    player1_avatar text,
    player2_avatar text,
    score_confirmed_at timestamp with time zone,
    cancelled_by text,
    cancelled_at timestamp with time zone,
    fee double precision,
    game_id integer NOT NULL,
    money smallint,
    player1_fee_txid text,
    player2_fee_txid text,
    CONSTRAINT esports_game_id_key UNIQUE (game_id)
);

ALTER TABLE public.esports OWNER TO postgres;

-- Create tournaments table before wallet_tournament
CREATE TABLE public.tournaments (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    tournament_id integer NOT NULL,
    title text NOT NULL,
    game text NOT NULL,
    console text NOT NULL,
    entry_fee double precision,
    prize_percentage integer,
    first_place_percentage integer,
    second_place_percentage integer,
    third_place_percentage integer,
    rules text NOT NULL,
    start_date timestamp with time zone,
    money smallint,
    max_players integer,
    image_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'upcoming'::text,
    host_id text,
    txid text,
    gamer_to_join numeric,
    winner_take_all boolean,
    type smallint,
    CONSTRAINT tournaments_tournament_id_key UNIQUE (tournament_id)
);

ALTER TABLE public.tournaments OWNER TO postgres;

-- First create the grabbit table
CREATE TABLE public.grabbit (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    game_id integer NOT NULL,
    title text NOT NULL,
    image text,
    prize_amount numeric(20,8) NOT NULL,
    prize_token text,
    details text,
    created_by text NOT NULL,
    create_date timestamp with time zone DEFAULT now(),
    players_max integer NOT NULL,
    players_min integer NOT NULL,
    players_ready integer DEFAULT 0,
    status smallint NOT NULL,
    last_grab timestamp with time zone,
    slapper text,
    winner text,
    end_time timestamp with time zone,
    start_time timestamp with time zone,
    free_grabs integer DEFAULT 0,
    free_slaps integer DEFAULT 0,
    free_sneaks integer DEFAULT 0,
    players jsonb,
    entry_fee_token text,
    entry_fee numeric,
    grabs_to_join smallint,
    winner_name text,
    winner_avatar text,
    wallet text,
    wallet_encryption text,
    wallet_iv text,
    prize_token_name text,
    "timeLeft" smallint,
    prize_claimed boolean,
    prize_claim_tx text,
    play_money smallint,
    gamer_to_join numeric
);

ALTER TABLE public.grabbit OWNER TO postgres;

CREATE SEQUENCE public.grabbit_game_id_seq;

-- Set sequence defaults
ALTER TABLE public.grabbit ALTER COLUMN game_id SET DEFAULT nextval('public.grabbit_game_id_seq');

-- Set sequence ownership
ALTER SEQUENCE public.grabbit_game_id_seq OWNED BY public.grabbit.game_id;

-- Now create wallet tables
CREATE TABLE public.wallet_esports (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    wallet text NOT NULL,
    sesime text NOT NULL,
    iv text NOT NULL,
    game_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    solana numeric,
    gamer numeric,
    updated_at timestamp with time zone,
    CONSTRAINT wallet_esports_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.esports(game_id)
);

ALTER TABLE public.wallet_esports OWNER TO postgres;

CREATE TABLE public.wallet_tournament (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    wallet text NOT NULL,
    sesime text NOT NULL,
    iv text NOT NULL,
    tournament_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    solana numeric,
    gamer numeric,
    updated_at timestamp with time zone,
    CONSTRAINT wallet_tournament_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(tournament_id)
);

ALTER TABLE public.wallet_tournament OWNER TO postgres;

CREATE TABLE public.wallet_tournament_withdraw (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    wallet text NOT NULL,
    tournament_id integer,
    token text NOT NULL,
    amount numeric NOT NULL,
    txid text,
    date timestamp with time zone NOT NULL,
    CONSTRAINT wallet_tournament_withdraw_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(tournament_id)
);

ALTER TABLE public.wallet_tournament_withdraw OWNER TO postgres;

-- Add indexes for performance
CREATE INDEX idx_grabbit_status ON public.grabbit(status);
CREATE INDEX idx_grabbit_host_id ON public.grabbit(host_id);
CREATE INDEX idx_wallet_esports_game_id ON public.wallet_esports(game_id);
CREATE INDEX idx_wallet_tournament_tournament_id ON public.wallet_tournament(tournament_id);

-- Create tables without foreign key constraints first
CREATE TABLE public.admins (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    player text NOT NULL,
    role integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_admin_role CHECK ((role = ANY (ARRAY[1, 2])))
);

ALTER TABLE public.admins OWNER TO postgres;

-- Now add all sequences
CREATE SEQUENCE public.esports_game_id_seq;
CREATE SEQUENCE public.tournaments_tournament_id_seq;
CREATE SEQUENCE public.wallet_esports_id_seq;
CREATE SEQUENCE public.wallet_tournament_id_seq;

-- Set sequence defaults
ALTER TABLE public.esports ALTER COLUMN game_id SET DEFAULT nextval('public.esports_game_id_seq');
ALTER TABLE public.tournaments ALTER COLUMN tournament_id SET DEFAULT nextval('public.tournaments_tournament_id_seq');
ALTER TABLE public.wallet_esports ALTER COLUMN game_id SET DEFAULT nextval('public.wallet_esports_id_seq');
ALTER TABLE public.wallet_tournament ALTER COLUMN tournament_id SET DEFAULT nextval('public.wallet_tournament_id_seq');
-- Set sequence ownership
ALTER SEQUENCE public.esports_game_id_seq OWNED BY public.esports.game_id;
ALTER SEQUENCE public.tournaments_tournament_id_seq OWNED BY public.tournaments.tournament_id;
ALTER SEQUENCE public.wallet_esports_id_seq OWNED BY public.wallet_esports.game_id;
ALTER SEQUENCE public.wallet_tournament_id_seq OWNED BY public.wallet_tournament.tournament_id;


-- Create tables without foreign key constraints first
CREATE TABLE public.wallet_players (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    player text NOT NULL,
    wallet text NOT NULL,
    sesime text NOT NULL,
    iv text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    solana numeric,
    gamer numeric,
    updated_at timestamp with time zone
);

ALTER TABLE public.wallet_players OWNER TO postgres;

CREATE TABLE public.wallet_players_withdraw (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    wallet text NOT NULL,
    player text,
    token text NOT NULL,
    amount numeric NOT NULL,
    txid text,
    date timestamp with time zone NOT NULL
);

ALTER TABLE public.wallet_players_withdraw OWNER TO postgres;

CREATE TABLE public.wallet_esports_withdraw (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    wallet text NOT NULL,
    game_id integer,
    token text NOT NULL,
    amount numeric NOT NULL,
    txid text,
    date timestamp with time zone NOT NULL
);

ALTER TABLE public.wallet_esports_withdraw OWNER TO postgres;


CREATE TABLE public.wallet_arcade (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    wallet text NOT NULL,
    sesime text NOT NULL,
    iv text NOT NULL,
    game_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    solana numeric,
    gamer numeric,
    updated_at timestamp with time zone
);

ALTER TABLE public.wallet_arcade OWNER TO postgres;

CREATE TABLE public.wallet_arcade_withdraw (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    wallet text NOT NULL,
    game_id integer,
    token text NOT NULL,
    amount numeric NOT NULL,
    txid text,
    date timestamp with time zone NOT NULL
);

ALTER TABLE public.wallet_arcade_withdraw OWNER TO postgres;

CREATE TABLE public.wallet_grabbit (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    wallet text NOT NULL,
    sesime text NOT NULL,
    iv text NOT NULL,
    game_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    solana numeric,
    gamer numeric,
    updated_at timestamp with time zone
);

ALTER TABLE public.wallet_grabbit OWNER TO postgres;

CREATE TABLE public.wallet_grabbit_withdraw (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    wallet text NOT NULL,
    game_id integer,
    token text NOT NULL,
    amount numeric NOT NULL,
    txid text,
    date timestamp with time zone NOT NULL
);

ALTER TABLE public.wallet_grabbit_withdraw OWNER TO postgres;

CREATE TABLE public.arcade (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    game_id integer NOT NULL,
    title text NOT NULL,
    description text,
    play_fee double precision NOT NULL,
    top_payout integer DEFAULT 0 NOT NULL,
    category text,
    rules text,
    game_code text NOT NULL,
    game_css text,
    creator text NOT NULL,
    thumbnail_image text,
    full_size_image text,
    status integer DEFAULT 0 NOT NULL,
    top_scorer text,
    top_score bigint DEFAULT 0,
    tester text,
    test_date timestamp with time zone,
    test_response text,
    tester_earnings numeric(10,2) DEFAULT 0,
    boosts integer DEFAULT 0,
    earnings_creator numeric,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    votes_up smallint,
    votes_down smallint,
    is_paused boolean,
    leaderboard_size smallint,
    earnings_platform numeric,
    fee_txid text,
    play_money smallint,
    play_time smallint,
    earnings_creator_available numeric
);

ALTER TABLE public.arcade OWNER TO postgres;

CREATE SEQUENCE public.arcade_game_id_seq;

-- Set sequence defaults
ALTER TABLE public.arcade ALTER COLUMN game_id SET DEFAULT nextval('public.arcade_game_id_seq');

-- Set sequence ownership
ALTER SEQUENCE public.arcade_game_id_seq OWNED BY public.arcade.game_id;


-- Add foreign key constraints for new tables
ALTER TABLE public.wallet_players 
    ADD CONSTRAINT wallet_players_player_fkey 
        FOREIGN KEY (player) REFERENCES public.players(player);

ALTER TABLE public.wallet_players_withdraw
    ADD CONSTRAINT wallet_players_withdraw_player_fkey 
        FOREIGN KEY (player) REFERENCES public.players(player);


CREATE TABLE public.arcade_creation_payments (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    game_id integer,
    amount numeric NOT NULL,
    txid text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.arcade_creation_payments OWNER TO postgres;

CREATE TABLE public.arcade_history (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    game_id integer,
    player text,
    score bigint,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    earnings numeric(10,2),
    txid text
);

ALTER TABLE public.arcade_history OWNER TO postgres;

CREATE TABLE public.arcade_leaderboard (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    game_id integer,
    player text,
    score bigint,
    position integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.arcade_leaderboard OWNER TO postgres;

CREATE TABLE public.arcade_metrics (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    game_id integer,
    plays integer DEFAULT 0,
    earnings numeric(10,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.arcade_metrics OWNER TO postgres;

CREATE TABLE public.arcade_sessions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    game_id integer,
    player text,
    started_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    ended_at timestamp with time zone,
    score bigint,
    earnings numeric(10,2),
    txid text
);

ALTER TABLE public.arcade_sessions OWNER TO postgres;

CREATE TABLE public.arcade_test_history (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    game_id integer,
    player text,
    score bigint,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.arcade_test_history OWNER TO postgres;

CREATE TABLE public.arcade_flagged_scores (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    game_id integer,
    player text,
    score bigint,
    reason text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.arcade_flagged_scores OWNER TO postgres;

CREATE TABLE public.blocked_players (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    blocker_player text,
    blocked_player text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.blocked_players OWNER TO postgres;

CREATE TABLE public.cart (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    player text,
    item_id integer,
    quantity integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.cart OWNER TO postgres;

CREATE TABLE public.arcade_comments (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    game_id integer,
    player text,
    comment text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.arcade_comments OWNER TO postgres;

CREATE TABLE public.esports_records (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    public_key text NOT NULL,
    game text NOT NULL,
    win_streak integer DEFAULT 0,
    loss_streak integer DEFAULT 0,
    wins integer DEFAULT 0,
    losses integer DEFAULT 0,
    total_earnings numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.esports_records OWNER TO postgres;

CREATE TABLE public.grabbit_players (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    game_id integer,
    player text NOT NULL,
    status text NOT NULL,
    grabs integer DEFAULT 0,
    slaps integer DEFAULT 0,
    sneaks integer DEFAULT 0,
    sneak_open boolean DEFAULT false,
    seat_expire timestamp with time zone,
    grabs_used integer DEFAULT 0,
    slaps_used integer DEFAULT 0,
    sneaks_used integer DEFAULT 0,
    player_avatar text,
    player_name text,
    txid text,
    txid_refund text
);

ALTER TABLE public.grabbit_players OWNER TO postgres;

CREATE TABLE public.grabbit_player_profile (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    player text,
    wins integer DEFAULT 0,
    losses integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.grabbit_player_profile OWNER TO postgres;

-- Create sequence and set default
CREATE SEQUENCE public.esports_game_id_seq;
ALTER TABLE public.esports ALTER COLUMN game_id SET DEFAULT nextval('public.esports_game_id_seq');
ALTER SEQUENCE public.esports_game_id_seq OWNED BY public.esports.game_id;

CREATE INDEX idx_esports_status ON public.esports(status);
CREATE INDEX idx_esports_game_id ON public.esports(game_id);



ALTER TABLE public.cart
    ADD CONSTRAINT cart_player_fkey 
        FOREIGN KEY (player) REFERENCES public.players(player);

ALTER TABLE public.esports_records
    ADD CONSTRAINT esports_records_player_fkey 
        FOREIGN KEY (player) REFERENCES public.players(player);

ALTER TABLE public.grabbit_players
    ADD CONSTRAINT grabbit_players_game_id_fkey 
        FOREIGN KEY (game_id) REFERENCES public.grabbit(game_id),
    ADD CONSTRAINT grabbit_players_player_fkey 
        FOREIGN KEY (player) REFERENCES public.players(player);

ALTER TABLE public.grabbit_player_profile
    ADD CONSTRAINT grabbit_player_profile_player_fkey 
        FOREIGN KEY (player) REFERENCES public.players(player);


-- Create indexes for frequently queried columns
CREATE INDEX idx_players_player ON public.players(player);
CREATE INDEX idx_wallet_players_player ON public.wallet_players(player);
CREATE INDEX idx_wallet_arcade_game_id ON public.wallet_arcade(game_id);
CREATE INDEX idx_wallet_grabbit_game_id ON public.wallet_grabbit(game_id);
CREATE INDEX idx_arcade_creator ON public.arcade(creator);
CREATE INDEX idx_arcade_status ON public.arcade(status);
CREATE INDEX idx_arcade_history_game_id ON public.arcade_history(game_id);
CREATE INDEX idx_arcade_history_player ON public.arcade_history(player);
CREATE INDEX idx_arcade_leaderboard_game_id ON public.arcade_leaderboard(game_id);
CREATE INDEX idx_arcade_leaderboard_player ON public.arcade_leaderboard(player);
CREATE INDEX idx_arcade_sessions_game_id ON public.arcade_sessions(game_id);
CREATE INDEX idx_arcade_sessions_player ON public.arcade_sessions(player);
CREATE INDEX idx_blocked_players_blocker ON public.blocked_players(blocker_player);
CREATE INDEX idx_blocked_players_blocked ON public.blocked_players(blocked_player);
CREATE INDEX idx_esports_records_player ON public.esports_records(player);
CREATE INDEX idx_grabbit_players_game_id ON public.grabbit_players(game_id);
CREATE INDEX idx_grabbit_players_player ON public.grabbit_players(player);

-- Add timestamp triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_players_updated_at
    BEFORE UPDATE ON public.players
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_esports_updated_at
    BEFORE UPDATE ON public.esports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tournaments_updated_at
    BEFORE UPDATE ON public.tournaments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_players_updated_at
    BEFORE UPDATE ON public.wallet_players
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_esports_updated_at
    BEFORE UPDATE ON public.wallet_esports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_tournament_updated_at
    BEFORE UPDATE ON public.wallet_tournament
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_arcade_updated_at
    BEFORE UPDATE ON public.wallet_arcade
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_grabbit_updated_at
    BEFORE UPDATE ON public.wallet_grabbit
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_arcade_updated_at
    BEFORE UPDATE ON public.arcade
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_arcade_metrics_updated_at
    BEFORE UPDATE ON public.arcade_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_arcade_comments_updated_at
    BEFORE UPDATE ON public.arcade_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_esports_records_updated_at
    BEFORE UPDATE ON public.esports_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grabbit_player_profile_updated_at
    BEFORE UPDATE ON public.grabbit_player_profile
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add check constraints for numeric values
ALTER TABLE public.wallet_players 
    ADD CONSTRAINT check_wallet_players_solana_positive CHECK (solana >= 0),
    ADD CONSTRAINT check_wallet_players_gamer_positive CHECK (gamer >= 0);

ALTER TABLE public.wallet_esports 
    ADD CONSTRAINT check_wallet_esports_solana_positive CHECK (solana >= 0),
    ADD CONSTRAINT check_wallet_esports_gamer_positive CHECK (gamer >= 0);

ALTER TABLE public.wallet_tournament 
    ADD CONSTRAINT check_wallet_tournament_solana_positive CHECK (solana >= 0),
    ADD CONSTRAINT check_wallet_tournament_gamer_positive CHECK (gamer >= 0);

ALTER TABLE public.wallet_arcade 
    ADD CONSTRAINT check_wallet_arcade_solana_positive CHECK (solana >= 0),
    ADD CONSTRAINT check_wallet_arcade_gamer_positive CHECK (gamer >= 0);

ALTER TABLE public.wallet_grabbit 
    ADD CONSTRAINT check_wallet_grabbit_solana_positive CHECK (solana >= 0),
    ADD CONSTRAINT check_wallet_grabbit_gamer_positive CHECK (gamer >= 0);

-- Add comments for documentation
COMMENT ON TABLE public.players IS 'Stores player information';
COMMENT ON TABLE public.esports IS 'Stores esports game information';
COMMENT ON TABLE public.tournaments IS 'Stores tournament information';
COMMENT ON TABLE public.arcade IS 'Stores arcade game information';
COMMENT ON TABLE public.wallet_players IS 'Stores player wallet information';
COMMENT ON TABLE public.wallet_esports IS 'Stores esports wallet information';
COMMENT ON TABLE public.wallet_tournament IS 'Stores tournament wallet information';
COMMENT ON TABLE public.wallet_arcade IS 'Stores arcade wallet information';
COMMENT ON TABLE public.wallet_grabbit IS 'Stores grabbit wallet information';

-- Add chat-related tables
CREATE TABLE public.chat_1on1 (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    sender_id text,
    receiver_id text,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    read boolean DEFAULT false
);

ALTER TABLE public.chat_1on1 OWNER TO postgres;

CREATE TABLE public.chat_messages (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    chatroom_id uuid,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    sender_name text,
    receiver_name text,
    sender text,
    receiver text,
    sender_id text,
    receiver_id text,
    sender_avatar text
);

ALTER TABLE public.chat_messages OWNER TO postgres;

CREATE TABLE public.chat_rooms (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.chat_rooms OWNER TO postgres;

CREATE TABLE public.chatroom_ban (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    player text NOT NULL,
    status smallint NOT NULL,
    expire timestamp with time zone NOT NULL
);

ALTER TABLE public.chatroom_ban OWNER TO postgres;

CREATE TABLE public.chatroom_members (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    chatroom_id uuid,
    user_id uuid,
    joined_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.chatroom_members OWNER TO postgres;

CREATE TABLE public.chatrooms (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.chatrooms OWNER TO postgres;

-- Add order-related tables
CREATE TABLE public.orders (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    wallet_address text NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    shipping_address jsonb,
    transaction_hash text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.orders OWNER TO postgres;

CREATE TABLE public.order_items (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    order_id uuid,
    item_id uuid,
    quantity integer NOT NULL,
    price_at_purchase numeric(10,2) NOT NULL,
    size text,
    color text
);

ALTER TABLE public.order_items OWNER TO postgres;

-- Add platform settings table
CREATE TABLE public.platform_settings (
    id integer NOT NULL,
    wallet_fee text,
    wallet text,
    sesime text,
    iv text,
    initial_super_admin_address text,
    is_paused boolean DEFAULT false NOT NULL,
    min_tokens_esports integer,
    min_tokens_arcade integer,
    min_tokens_tournament integer,
    min_tokens_grabbit integer,
    fee_esports real,
    fee_tournament double precision,
    fee_arcade double precision,
    fee_grabbit double precision,
    fee_grabbit_host smallint,
    fee_arcade_create numeric,
    fee_boost integer
);

ALTER TABLE public.platform_settings OWNER TO postgres;
ALTER TABLE public.platform_settings ADD PRIMARY KEY (id);

CREATE SEQUENCE public.platform_settings_id_seq;
ALTER TABLE public.platform_settings ALTER COLUMN id SET DEFAULT nextval('public.platform_settings_id_seq');
ALTER SEQUENCE public.platform_settings_id_seq OWNED BY public.platform_settings.id;

-- Add poll leader table
CREATE TABLE public.poll_leader (
    id integer NOT NULL,
    public_key text NOT NULL,
    last_active timestamp without time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.poll_leader OWNER TO postgres;
ALTER TABLE public.poll_leader ADD PRIMARY KEY (id);

CREATE SEQUENCE public.poll_leader_id_seq;
ALTER TABLE public.poll_leader ALTER COLUMN id SET DEFAULT nextval('public.poll_leader_id_seq');
ALTER SEQUENCE public.poll_leader_id_seq OWNED BY public.poll_leader.id;

-- Add shop items table
CREATE TABLE public.shop_items (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    category text NOT NULL,
    sizes text[] NOT NULL,
    colors text[] NOT NULL,
    images text[] NOT NULL,
    stock_quantity integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    item_id integer NOT NULL
);

ALTER TABLE public.shop_items OWNER TO postgres;

CREATE SEQUENCE public.shop_items_item_id_seq;
ALTER TABLE public.shop_items ALTER COLUMN item_id SET DEFAULT nextval('public.shop_items_item_id_seq');
ALTER SEQUENCE public.shop_items_item_id_seq OWNED BY public.shop_items.item_id;

-- Add tournament-related tables
CREATE TABLE public.tournament_matches (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    tournament_id integer,
    round integer NOT NULL,
    match_order integer NOT NULL,
    player1_id text,
    player2_id text,
    winner_id text,
    player1_score integer,
    player2_score integer,
    match_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.tournament_matches OWNER TO postgres;


CREATE TABLE public.tournament_players (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    tournament_id integer,
    player_id text,
    joined_at timestamp with time zone DEFAULT now(),
    txid text
);

ALTER TABLE public.tournament_players OWNER TO postgres;

-- CREATE SEQUENCE public.tournament_players_id_seq;
-- ALTER TABLE public.tournament_players ALTER COLUMN id SET DEFAULT nextval('public.tournament_players_id_seq');
-- ALTER SEQUENCE public.tournament_players_id_seq OWNED BY public.tournament_players.id;

CREATE TABLE public.tournament_results (
    id bigint NOT NULL GENERATED BY DEFAULT AS IDENTITY,
    tournament_id bigint,
    player text,
    "position" integer NOT NULL,
    prize_amount numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.tournament_results OWNER TO postgres;

-- Add player-related tables
CREATE TABLE public.player_address (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    player text NOT NULL,
    full_name text NOT NULL,
    address_line1 text NOT NULL,
    address_line2 text,
    city text NOT NULL,
    state text NOT NULL,
    postal_code text NOT NULL,
    country text NOT NULL,
    phone_number text,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.player_address OWNER TO postgres;

CREATE TABLE public.player_testing_games (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    player text,
    game_id integer,
    assigned_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'in_progress'::text NOT NULL
);

ALTER TABLE public.player_testing_games OWNER TO postgres;

CREATE TABLE public.votes (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    player text,
    game_id integer,    
    vote_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.votes OWNER TO postgres;

-- Add foreign key constraints
ALTER TABLE public.chat_messages
    ADD CONSTRAINT chat_messages_chatroom_id_fkey 
        FOREIGN KEY (chatroom_id) REFERENCES public.chat_rooms(id);

ALTER TABLE public.chatroom_members
    ADD CONSTRAINT chatroom_members_chatroom_id_fkey 
        FOREIGN KEY (chatroom_id) REFERENCES public.chat_rooms(id);

ALTER TABLE public.order_items
    ADD CONSTRAINT order_items_order_id_fkey 
        FOREIGN KEY (order_id) REFERENCES public.orders(id);

ALTER TABLE public.tournament_matches
    ADD CONSTRAINT tournament_matches_tournament_id_fkey 
        FOREIGN KEY (tournament_id) REFERENCES public.tournaments(tournament_id);

ALTER TABLE public.tournament_players
    ADD CONSTRAINT tournament_players_tournament_id_fkey 
        FOREIGN KEY (tournament_id) REFERENCES public.tournaments(tournament_id),
    ADD CONSTRAINT tournament_players_player_id_fkey 
        FOREIGN KEY (player_id) REFERENCES public.players(player);

ALTER TABLE public.player_address
    ADD CONSTRAINT player_address_player_fkey 
        FOREIGN KEY (player) REFERENCES public.players(player);


-- Add indexes for frequently queried columns
CREATE INDEX idx_chat_messages_chatroom_id ON public.chat_messages(chatroom_id);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_tournament_matches_tournament_id ON public.tournament_matches(tournament_id);
CREATE INDEX idx_tournament_players_tournament_id ON public.tournament_players(tournament_id);
CREATE INDEX idx_tournament_players_player_id ON public.tournament_players(player_id);
CREATE INDEX idx_player_address_player ON public.player_address(player);
CREATE INDEX idx_votes_player ON public.votes(player);
CREATE INDEX idx_votes_game_id ON public.votes(game_id);

-- Add updated_at triggers
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shop_items_updated_at
    BEFORE UPDATE ON public.shop_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tournament_matches_updated_at
    BEFORE UPDATE ON public.tournament_matches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_address_updated_at
    BEFORE UPDATE ON public.player_address
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- Add indexes for performance
CREATE INDEX idx_wallet_grabbit_withdraw_game_id ON public.wallet_grabbit_withdraw(game_id);