--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 17.0

-- Started on 2025-03-12 23:08:59 EDT

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 342 (class 1259 OID 39525)
-- Name: admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admins (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id text NOT NULL,
    role integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_admin_role CHECK ((role = ANY (ARRAY[1, 2])))
);


ALTER TABLE public.admins OWNER TO postgres;

--
-- TOC entry 343 (class 1259 OID 39565)
-- Name: approved_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.approved_tokens (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    ticker character varying(50) NOT NULL,
    address character varying(255) NOT NULL,
    status integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    CONSTRAINT check_status CHECK ((status = ANY (ARRAY[0, 1])))
);


ALTER TABLE public.approved_tokens OWNER TO postgres;

--
-- TOC entry 323 (class 1259 OID 36034)
-- Name: arcade; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.arcade (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
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

--
-- TOC entry 4404 (class 0 OID 0)
-- Dependencies: 323
-- Name: COLUMN arcade.play_money; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.arcade.play_money IS 'solana or game tokens';


--
-- TOC entry 322 (class 1259 OID 36033)
-- Name: arcade_arcade_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.arcade_arcade_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.arcade_arcade_id_seq OWNER TO postgres;

--
-- TOC entry 4406 (class 0 OID 0)
-- Dependencies: 322
-- Name: arcade_arcade_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.arcade_arcade_id_seq OWNED BY public.arcade.game_id;


--
-- TOC entry 329 (class 1259 OID 36129)
-- Name: arcade_creation_payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.arcade_creation_payments (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    arcade_id uuid,
    creator_wallet text NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_date timestamp with time zone DEFAULT now(),
    transaction_hash text
);


ALTER TABLE public.arcade_creation_payments OWNER TO postgres;

--
-- TOC entry 324 (class 1259 OID 36054)
-- Name: arcade_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.arcade_history (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    arcade_id uuid,
    player text NOT NULL,
    score bigint NOT NULL,
    play_date timestamp with time zone DEFAULT now(),
    game_id smallint,
    title text
);


ALTER TABLE public.arcade_history OWNER TO postgres;

--
-- TOC entry 325 (class 1259 OID 36068)
-- Name: arcade_leaderboard; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.arcade_leaderboard (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    player text NOT NULL,
    score bigint NOT NULL,
    play_date timestamp with time zone DEFAULT now(),
    rank integer,
    game_id smallint,
    credits numeric,
    credits_available numeric,
    session_id text
);


ALTER TABLE public.arcade_leaderboard OWNER TO postgres;

--
-- TOC entry 326 (class 1259 OID 36082)
-- Name: arcade_metrics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.arcade_metrics (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    arcade_id uuid,
    total_plays integer DEFAULT 0,
    unique_players integer DEFAULT 0,
    average_score numeric(10,2) DEFAULT 0,
    total_earnings numeric(10,2) DEFAULT 0,
    last_updated timestamp with time zone DEFAULT now()
);


ALTER TABLE public.arcade_metrics OWNER TO postgres;

--
-- TOC entry 327 (class 1259 OID 36098)
-- Name: arcade_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.arcade_sessions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    player text NOT NULL,
    start_time timestamp with time zone DEFAULT now(),
    end_time timestamp with time zone,
    score bigint,
    earnings numeric(10,2) DEFAULT 0,
    arcade_id smallint,
    txid_play text,
    txid_fee text,
    play_time numeric
);


ALTER TABLE public.arcade_sessions OWNER TO postgres;

--
-- TOC entry 328 (class 1259 OID 36113)
-- Name: arcade_test_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.arcade_test_history (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    arcade_id uuid,
    tester_wallet text NOT NULL,
    test_date timestamp with time zone DEFAULT now(),
    test_response text,
    status integer DEFAULT 0 NOT NULL,
    earnings numeric(10,2) DEFAULT 0
);


ALTER TABLE public.arcade_test_history OWNER TO postgres;

--
-- TOC entry 346 (class 1259 OID 47873)
-- Name: blocked_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.blocked_users (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    blocker_id text,
    blocked_id text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.blocked_users OWNER TO postgres;

--
-- TOC entry 321 (class 1259 OID 32346)
-- Name: cart; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cart (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    public_key text NOT NULL,
    item_id uuid NOT NULL,
    quantity integer NOT NULL,
    size text NOT NULL,
    color text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.cart OWNER TO postgres;

--
-- TOC entry 345 (class 1259 OID 47822)
-- Name: chat_1on1; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_1on1 (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    sender_id text,
    receiver_id text,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    read boolean DEFAULT false
);


ALTER TABLE public.chat_1on1 OWNER TO postgres;

--
-- TOC entry 294 (class 1259 OID 29234)
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_messages (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    chatroom_id uuid,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    sender_name text,
    receiver_name text,
    sender_public_key text,
    receiver_public_key text,
    sender_id text,
    receiver_id text,
    sender_avatar text
);


ALTER TABLE public.chat_messages OWNER TO postgres;

--
-- TOC entry 295 (class 1259 OID 29243)
-- Name: chat_rooms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_rooms (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.chat_rooms OWNER TO postgres;

--
-- TOC entry 349 (class 1259 OID 53739)
-- Name: chatroom_ban; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chatroom_ban (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    public_key text NOT NULL,
    status smallint NOT NULL,
    expire timestamp with time zone NOT NULL
);


ALTER TABLE public.chatroom_ban OWNER TO postgres;

--
-- TOC entry 296 (class 1259 OID 29252)
-- Name: chatroom_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chatroom_members (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    chatroom_id uuid,
    user_id uuid,
    joined_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.chatroom_members OWNER TO postgres;

--
-- TOC entry 297 (class 1259 OID 29261)
-- Name: chatrooms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chatrooms (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.chatrooms OWNER TO postgres;

--
-- TOC entry 298 (class 1259 OID 29270)
-- Name: comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comments (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id text,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    game_id smallint
);


ALTER TABLE public.comments OWNER TO postgres;

--
-- TOC entry 299 (class 1259 OID 29279)
-- Name: esports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.esports (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
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
    player2_fee_txid text
);


ALTER TABLE public.esports OWNER TO postgres;

--
-- TOC entry 4423 (class 0 OID 0)
-- Dependencies: 299
-- Name: COLUMN esports.money; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.esports.money IS 'is this game for sol or gamer';


--
-- TOC entry 338 (class 1259 OID 39200)
-- Name: esports_game_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.esports_game_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.esports_game_id_seq OWNER TO postgres;

--
-- TOC entry 4425 (class 0 OID 0)
-- Dependencies: 338
-- Name: esports_game_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.esports_game_id_seq OWNED BY public.esports.game_id;


--
-- TOC entry 339 (class 1259 OID 39348)
-- Name: esports_game_id_seq1; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.esports ALTER COLUMN game_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.esports_game_id_seq1
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 347 (class 1259 OID 47937)
-- Name: esports_records; Type: TABLE; Schema: public; Owner: postgres
--

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

--
-- TOC entry 300 (class 1259 OID 29304)
-- Name: flagged_scores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.flagged_scores (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    game_id uuid,
    player text,
    score integer,
    play_time integer,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.flagged_scores OWNER TO postgres;

--
-- TOC entry 302 (class 1259 OID 29361)
-- Name: grabbit; Type: TABLE; Schema: public; Owner: postgres
--

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

--
-- TOC entry 4430 (class 0 OID 0)
-- Dependencies: 302
-- Name: COLUMN grabbit.play_money; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.grabbit.play_money IS 'solana or gamer tokens';


--
-- TOC entry 301 (class 1259 OID 29360)
-- Name: grabbit_game_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.grabbit_game_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.grabbit_game_id_seq OWNER TO postgres;

--
-- TOC entry 4432 (class 0 OID 0)
-- Dependencies: 301
-- Name: grabbit_game_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.grabbit_game_id_seq OWNED BY public.grabbit.game_id;


--
-- TOC entry 303 (class 1259 OID 29377)
-- Name: grabbit_players; Type: TABLE; Schema: public; Owner: postgres
--

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

--
-- TOC entry 304 (class 1259 OID 29394)
-- Name: grabbit_profile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.grabbit_profile (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    public_key text NOT NULL,
    grabs integer DEFAULT 0,
    slaps integer DEFAULT 0,
    sneaks integer DEFAULT 0,
    games_played integer DEFAULT 0,
    games_won integer DEFAULT 0,
    in_game integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.grabbit_profile OWNER TO postgres;

--
-- TOC entry 306 (class 1259 OID 29413)
-- Name: grabbit_wallet; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.grabbit_wallet (
    id integer NOT NULL,
    game_id integer,
    wallet text,
    wallet_key text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    wallet_iv text,
    solana numeric,
    gamer numeric,
    last_update timestamp with time zone
);


ALTER TABLE public.grabbit_wallet OWNER TO postgres;

--
-- TOC entry 305 (class 1259 OID 29412)
-- Name: grabbit_wallet_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.grabbit_wallet_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.grabbit_wallet_id_seq OWNER TO postgres;

--
-- TOC entry 4437 (class 0 OID 0)
-- Dependencies: 305
-- Name: grabbit_wallet_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.grabbit_wallet_id_seq OWNED BY public.grabbit_wallet.id;


--
-- TOC entry 317 (class 1259 OID 32100)
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    order_id uuid,
    item_id uuid,
    quantity integer NOT NULL,
    price_at_purchase numeric(10,2) NOT NULL,
    size text,
    color text
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- TOC entry 316 (class 1259 OID 32089)
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    wallet_address text NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    shipping_address jsonb,
    transaction_hash text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- TOC entry 337 (class 1259 OID 39142)
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id text NOT NULL,
    game_type integer,
    game_id integer,
    game_creator boolean DEFAULT false,
    txid text,
    pay_date timestamp with time zone DEFAULT now(),
    amount numeric(20,9),
    token text,
    payment_type text,
    status text,
    "position" smallint
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- TOC entry 308 (class 1259 OID 29425)
-- Name: platform_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.platform_settings (
    id integer NOT NULL,
    wallet_platform text,
    boost_fee integer DEFAULT 10 NOT NULL,
    initial_super_admin_address text,
    wallet_platform_encrypted_key text,
    wallet_platform_iv text,
    is_paused boolean DEFAULT false NOT NULL,
    wallet_fee text,
    min_tokens_esports integer DEFAULT 0 NOT NULL,
    min_tokens_arcade integer DEFAULT 0 NOT NULL,
    min_tokens_tournament integer DEFAULT 0 NOT NULL,
    min_tokens_grabbit integer DEFAULT 0 NOT NULL,
    fee_esports real,
    fee_tournament double precision,
    fee_arcade double precision,
    fee_grabbit double precision,
    fee_grabbit_host smallint,
    fee_arcade_create numeric
);


ALTER TABLE public.platform_settings OWNER TO postgres;

--
-- TOC entry 307 (class 1259 OID 29424)
-- Name: platform_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.platform_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.platform_settings_id_seq OWNER TO postgres;

--
-- TOC entry 4443 (class 0 OID 0)
-- Dependencies: 307
-- Name: platform_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.platform_settings_id_seq OWNED BY public.platform_settings.id;


--
-- TOC entry 310 (class 1259 OID 29441)
-- Name: poll_leader; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.poll_leader (
    id integer NOT NULL,
    public_key text NOT NULL,
    last_active timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.poll_leader OWNER TO postgres;

--
-- TOC entry 309 (class 1259 OID 29440)
-- Name: poll_leader_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.poll_leader_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.poll_leader_id_seq OWNER TO postgres;

--
-- TOC entry 4446 (class 0 OID 0)
-- Dependencies: 309
-- Name: poll_leader_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.poll_leader_id_seq OWNED BY public.poll_leader.id;


--
-- TOC entry 315 (class 1259 OID 32078)
-- Name: shop_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shop_items (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
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
    url_friendly_id integer NOT NULL
);


ALTER TABLE public.shop_items OWNER TO postgres;

--
-- TOC entry 318 (class 1259 OID 32191)
-- Name: shop_items_url_friendly_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.shop_items_url_friendly_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shop_items_url_friendly_id_seq OWNER TO postgres;

--
-- TOC entry 4449 (class 0 OID 0)
-- Dependencies: 318
-- Name: shop_items_url_friendly_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shop_items_url_friendly_id_seq OWNED BY public.shop_items.url_friendly_id;


--
-- TOC entry 334 (class 1259 OID 38839)
-- Name: tournament_matches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tournament_matches (
    id integer NOT NULL,
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

--
-- TOC entry 333 (class 1259 OID 38838)
-- Name: tournament_matches_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tournament_matches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tournament_matches_id_seq OWNER TO postgres;

--
-- TOC entry 4452 (class 0 OID 0)
-- Dependencies: 333
-- Name: tournament_matches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tournament_matches_id_seq OWNED BY public.tournament_matches.id;


--
-- TOC entry 332 (class 1259 OID 38814)
-- Name: tournament_players; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tournament_players (
    id integer NOT NULL,
    tournament_id integer,
    player_id text,
    joined_at timestamp with time zone DEFAULT now(),
    txid text
);


ALTER TABLE public.tournament_players OWNER TO postgres;

--
-- TOC entry 331 (class 1259 OID 38813)
-- Name: tournament_players_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tournament_players_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tournament_players_id_seq OWNER TO postgres;

--
-- TOC entry 4455 (class 0 OID 0)
-- Dependencies: 331
-- Name: tournament_players_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tournament_players_id_seq OWNED BY public.tournament_players.id;


--
-- TOC entry 336 (class 1259 OID 38997)
-- Name: tournament_results; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tournament_results (
    id bigint NOT NULL,
    tournament_id bigint,
    player_id text,
    "position" integer NOT NULL,
    prize_amount numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


ALTER TABLE public.tournament_results OWNER TO postgres;

--
-- TOC entry 335 (class 1259 OID 38996)
-- Name: tournament_results_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.tournament_results ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.tournament_results_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 330 (class 1259 OID 38797)
-- Name: tournaments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tournaments (
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
    game_id integer NOT NULL,
    txid text,
    gamer_to_join numeric,
    winner_take_all boolean,
    type smallint
);


ALTER TABLE public.tournaments OWNER TO postgres;

--
-- TOC entry 4459 (class 0 OID 0)
-- Dependencies: 330
-- Name: COLUMN tournaments.type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tournaments.type IS '1 = 1v1, 2 = battle royal';


--
-- TOC entry 344 (class 1259 OID 39780)
-- Name: tournaments_game_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tournaments_game_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tournaments_game_id_seq OWNER TO postgres;

--
-- TOC entry 4461 (class 0 OID 0)
-- Dependencies: 344
-- Name: tournaments_game_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tournaments_game_id_seq OWNED BY public.tournaments.game_id;


--
-- TOC entry 320 (class 1259 OID 32307)
-- Name: user_address; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_address (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    wallet_address text NOT NULL,
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


ALTER TABLE public.user_address OWNER TO postgres;

--
-- TOC entry 311 (class 1259 OID 29452)
-- Name: user_deposit_addresses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_deposit_addresses (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id text,
    deposit_address text NOT NULL,
    encrypted_private_key text NOT NULL,
    iv text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_deposit_addresses OWNER TO postgres;

--
-- TOC entry 312 (class 1259 OID 29463)
-- Name: user_testing_games; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_testing_games (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id text,
    game_id uuid,
    assigned_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'in_progress'::text NOT NULL
);


ALTER TABLE public.user_testing_games OWNER TO postgres;

--
-- TOC entry 313 (class 1259 OID 29475)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.players (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    name text,
    avatar text,
    player text,
    last_online timestamp with time zone
);

ALTER TABLE public.players OWNER TO postgres;


CREATE TABLE public.wallet_players (
    id integer NOT NULL,
    player text NOT NULL,
    wallet text NOT NULL,
    sesime text NOT NULL,
    iv text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    solana numeric,
    gamer numeric,
    updated_at timestamp with time zone,
);

ALTER TABLE public.wallet_players OWNER TO postgres;

CREATE TABLE public.wallet_esports (
    id integer NOT NULL,
    wallet text NOT NULL,
    sesime text NOT NULL,
    iv text NOT NULL,
    game_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    solana numeric,
    gamer numeric,
    updated_at timestamp with time zone,
);

ALTER TABLE public.wallet_esports OWNER TO postgres;

CREATE TABLE public.wallet_tournament (
    id integer NOT NULL,
    wallet text NOT NULL,
    sesime text NOT NULL,
    iv text NOT NULL,
    tournament_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    solana numeric,
    gamer numeric,
    updated_at timestamp with time zone,
);

ALTER TABLE public.wallet_tournamet OWNER TO postgres;

CREATE TABLE public.wallet_arcade (
    id integer NOT NULL,
    wallet text NOT NULL,
    sesime text NOT NULL,
    iv text NOT NULL,
    game_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    solana numeric,
    gamer numeric,
    updated_at timestamp with time zone,
);

ALTER TABLE public.wallet_arcade OWNER TO postgres;

CREATE TABLE public.wallet_grabbit (
    id integer NOT NULL,
    wallet text NOT NULL,
    sesime text NOT NULL,
    iv text NOT NULL,
    game_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    solana numeric,
    gamer numeric,
    updated_at timestamp with time zone,
);

ALTER TABLE public.wallet_grabbit OWNER TO postgres;

--
-- TOC entry 314 (class 1259 OID 29488)
-- Name: votes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.votes (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id text,
    vote_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    game_id smallint
);


ALTER TABLE public.votes OWNER TO postgres;

--
-- TOC entry 341 (class 1259 OID 39406)
-- Name: wallets; Type: TABLE; Schema: public; Owner: postgres
--



--
-- TOC entry 4468 (class 0 OID 0)
-- Dependencies: 341
-- Name: COLUMN wallets.type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.wallets.type IS 'The type of wallet (esports, tournament, arcade, or grabbit)';


--
-- TOC entry 4469 (class 0 OID 0)
-- Dependencies: 341
-- Name: COLUMN wallets.public_key; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.wallets.public_key IS 'The public key of the wallet';


--
-- TOC entry 4470 (class 0 OID 0)
-- Dependencies: 341
-- Name: COLUMN wallets.encrypted_key; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.wallets.encrypted_key IS 'The encrypted private key of the wallet';


--
-- TOC entry 4471 (class 0 OID 0)
-- Dependencies: 341
-- Name: COLUMN wallets.iv; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.wallets.iv IS 'The initialization vector used for encryption';


--
-- TOC entry 4472 (class 0 OID 0)
-- Dependencies: 341
-- Name: COLUMN wallets.esports_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.wallets.esports_id IS 'The ID of the associated esports entity, if applicable';


--
-- TOC entry 4473 (class 0 OID 0)
-- Dependencies: 341
-- Name: COLUMN wallets.tournament_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.wallets.tournament_id IS 'The ID of the associated tournament, if applicable';


--
-- TOC entry 4474 (class 0 OID 0)
-- Dependencies: 341
-- Name: COLUMN wallets.arcade_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.wallets.arcade_id IS 'The ID of the associated arcade game, if applicable';


--
-- TOC entry 4475 (class 0 OID 0)
-- Dependencies: 341
-- Name: COLUMN wallets.grabbit_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.wallets.grabbit_id IS 'The ID of the associated grabbit game, if applicable';


--
-- TOC entry 340 (class 1259 OID 39405)
-- Name: wallets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wallets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wallets_id_seq OWNER TO postgres;

--
-- TOC entry 4477 (class 0 OID 0)
-- Dependencies: 340
-- Name: wallets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wallets_id_seq OWNED BY public.wallets.id;


--
-- TOC entry 348 (class 1259 OID 51471)
-- Name: withdraws; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.withdraws (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deposit_wallet text NOT NULL,
    public_key text,
    token text NOT NULL,
    amount numeric NOT NULL,
    txid text,
    date timestamp with time zone NOT NULL
);


ALTER TABLE public.withdraws OWNER TO postgres;

--
-- TOC entry 3912 (class 2604 OID 36038)
-- Name: arcade game_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.arcade ALTER COLUMN game_id SET DEFAULT nextval('public.arcade_arcade_id_seq'::regclass);


--
-- TOC entry 3849 (class 2604 OID 29365)
-- Name: grabbit game_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grabbit ALTER COLUMN game_id SET DEFAULT nextval('public.grabbit_game_id_seq'::regclass);


--
-- TOC entry 3872 (class 2604 OID 29416)
-- Name: grabbit_wallet id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grabbit_wallet ALTER COLUMN id SET DEFAULT nextval('public.grabbit_wallet_id_seq'::regclass);


--
-- TOC entry 3874 (class 2604 OID 29428)
-- Name: platform_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_settings ALTER COLUMN id SET DEFAULT nextval('public.platform_settings_id_seq'::regclass);


--
-- TOC entry 3881 (class 2604 OID 29444)
-- Name: poll_leader id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.poll_leader ALTER COLUMN id SET DEFAULT nextval('public.poll_leader_id_seq'::regclass);


--
-- TOC entry 3898 (class 2604 OID 32192)
-- Name: shop_items url_friendly_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shop_items ALTER COLUMN url_friendly_id SET DEFAULT nextval('public.shop_items_url_friendly_id_seq'::regclass);


--
-- TOC entry 3945 (class 2604 OID 38842)
-- Name: tournament_matches id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tournament_matches ALTER COLUMN id SET DEFAULT nextval('public.tournament_matches_id_seq'::regclass);


--
-- TOC entry 3943 (class 2604 OID 38817)
-- Name: tournament_players id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tournament_players ALTER COLUMN id SET DEFAULT nextval('public.tournament_players_id_seq'::regclass);


--
-- TOC entry 3942 (class 2604 OID 39781)
-- Name: tournaments game_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tournaments ALTER COLUMN game_id SET DEFAULT nextval('public.tournaments_game_id_seq'::regclass);


--
-- TOC entry 3952 (class 2604 OID 39409)
-- Name: wallets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets ALTER COLUMN id SET DEFAULT nextval('public.wallets_id_seq'::regclass);


--
-- TOC entry 4129 (class 2606 OID 39534)
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- TOC entry 4134 (class 2606 OID 39577)
-- Name: approved_tokens approved_tokens_address_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approved_tokens
    ADD CONSTRAINT approved_tokens_address_key UNIQUE (address);


--
-- TOC entry 4136 (class 2606 OID 39575)
-- Name: approved_tokens approved_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approved_tokens
    ADD CONSTRAINT approved_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 4059 (class 2606 OID 36053)
-- Name: arcade arcade_arcade_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.arcade
    ADD CONSTRAINT arcade_arcade_id_key UNIQUE (game_id);


--
-- TOC entry 4088 (class 2606 OID 36137)
-- Name: arcade_creation_payments arcade_creation_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.arcade_creation_payments
    ADD CONSTRAINT arcade_creation_payments_pkey PRIMARY KEY (id);


--
-- TOC entry 4068 (class 2606 OID 36062)
-- Name: arcade_history arcade_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.arcade_history
    ADD CONSTRAINT arcade_history_pkey PRIMARY KEY (id);


--
-- TOC entry 4072 (class 2606 OID 36076)
-- Name: arcade_leaderboard arcade_leaderboard_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.arcade_leaderboard
    ADD CONSTRAINT arcade_leaderboard_pkey PRIMARY KEY (id);


--
-- TOC entry 4078 (class 2606 OID 36092)
-- Name: arcade_metrics arcade_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.arcade_metrics
    ADD CONSTRAINT arcade_metrics_pkey PRIMARY KEY (id);


--
-- TOC entry 4061 (class 2606 OID 36051)
-- Name: arcade arcade_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.arcade
    ADD CONSTRAINT arcade_pkey PRIMARY KEY (id);


--
-- TOC entry 4081 (class 2606 OID 36107)
-- Name: arcade_sessions arcade_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.arcade_sessions
    ADD CONSTRAINT arcade_sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 4084 (class 2606 OID 36123)
-- Name: arcade_test_history arcade_test_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.arcade_test_history
    ADD CONSTRAINT arcade_test_history_pkey PRIMARY KEY (id);


--
-- TOC entry 4145 (class 2606 OID 47883)
-- Name: blocked_users blocked_users_blocker_id_blocked_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocked_users
    ADD CONSTRAINT blocked_users_blocker_id_blocked_id_key UNIQUE (blocker_id, blocked_id);


--
-- TOC entry 4147 (class 2606 OID 47881)
-- Name: blocked_users blocked_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocked_users
    ADD CONSTRAINT blocked_users_pkey PRIMARY KEY (id);


--
-- TOC entry 4055 (class 2606 OID 32355)
-- Name: cart cart_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_pkey PRIMARY KEY (id);


--
-- TOC entry 4141 (class 2606 OID 47831)
-- Name: chat_1on1 chat_1on1_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_1on1
    ADD CONSTRAINT chat_1on1_pkey PRIMARY KEY (id);


--
-- TOC entry 3979 (class 2606 OID 29242)
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- TOC entry 3981 (class 2606 OID 29251)
-- Name: chat_rooms chat_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT chat_rooms_pkey PRIMARY KEY (id);


--
-- TOC entry 4155 (class 2606 OID 53746)
-- Name: chatroom_ban chatroom_ban_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chatroom_ban
    ADD CONSTRAINT chatroom_ban_pkey PRIMARY KEY (id);


--
-- TOC entry 3983 (class 2606 OID 29260)
-- Name: chatroom_members chatroom_members_chatroom_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chatroom_members
    ADD CONSTRAINT chatroom_members_chatroom_id_user_id_key UNIQUE (chatroom_id, user_id);


--
-- TOC entry 3985 (class 2606 OID 29258)
-- Name: chatroom_members chatroom_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chatroom_members
    ADD CONSTRAINT chatroom_members_pkey PRIMARY KEY (id);


--
-- TOC entry 3988 (class 2606 OID 29269)
-- Name: chatrooms chatrooms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chatrooms
    ADD CONSTRAINT chatrooms_pkey PRIMARY KEY (id);


--
-- TOC entry 3990 (class 2606 OID 29278)
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- TOC entry 3992 (class 2606 OID 39327)
-- Name: esports esports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.esports
    ADD CONSTRAINT esports_pkey PRIMARY KEY (id);


--
-- TOC entry 4149 (class 2606 OID 47950)
-- Name: esports_records esports_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.esports_records
    ADD CONSTRAINT esports_records_pkey PRIMARY KEY (id);


--
-- TOC entry 4151 (class 2606 OID 47952)
-- Name: esports_records esports_records_public_key_game_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.esports_records
    ADD CONSTRAINT esports_records_public_key_game_key UNIQUE (public_key, game);


--
-- TOC entry 3996 (class 2606 OID 29312)
-- Name: flagged_scores flagged_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flagged_scores
    ADD CONSTRAINT flagged_scores_pkey PRIMARY KEY (id);


--
-- TOC entry 3998 (class 2606 OID 29376)
-- Name: grabbit grabbit_game_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grabbit
    ADD CONSTRAINT grabbit_game_id_key UNIQUE (game_id);


--
-- TOC entry 4000 (class 2606 OID 29374)
-- Name: grabbit grabbit_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grabbit
    ADD CONSTRAINT grabbit_pkey PRIMARY KEY (id);


--
-- TOC entry 4002 (class 2606 OID 29391)
-- Name: grabbit_players grabbit_players_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grabbit_players
    ADD CONSTRAINT grabbit_players_pkey PRIMARY KEY (id);


--
-- TOC entry 4007 (class 2606 OID 29409)
-- Name: grabbit_profile grabbit_profile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grabbit_profile
    ADD CONSTRAINT grabbit_profile_pkey PRIMARY KEY (id);


--
-- TOC entry 4009 (class 2606 OID 29411)
-- Name: grabbit_profile grabbit_profile_public_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grabbit_profile
    ADD CONSTRAINT grabbit_profile_public_key_key UNIQUE (public_key);


--
-- TOC entry 4011 (class 2606 OID 29421)
-- Name: grabbit_wallet grabbit_wallet_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grabbit_wallet
    ADD CONSTRAINT grabbit_wallet_pkey PRIMARY KEY (id);


--
-- TOC entry 4013 (class 2606 OID 29423)
-- Name: grabbit_wallet grabbit_wallet_wallet_wallet_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grabbit_wallet
    ADD CONSTRAINT grabbit_wallet_wallet_wallet_key_key UNIQUE (wallet, wallet_key);


--
-- TOC entry 4050 (class 2606 OID 32107)
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- TOC entry 4046 (class 2606 OID 32099)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- TOC entry 4118 (class 2606 OID 39151)
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- TOC entry 4015 (class 2606 OID 29437)
-- Name: platform_settings platform_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_settings
    ADD CONSTRAINT platform_settings_pkey PRIMARY KEY (id);


--
-- TOC entry 4017 (class 2606 OID 29439)
-- Name: platform_settings platform_settings_platform_wallet_address_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.platform_settings
    ADD CONSTRAINT platform_settings_platform_wallet_address_key UNIQUE (wallet_platform);


--
-- TOC entry 4019 (class 2606 OID 29449)
-- Name: poll_leader poll_leader_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.poll_leader
    ADD CONSTRAINT poll_leader_pkey PRIMARY KEY (id);


--
-- TOC entry 4021 (class 2606 OID 29451)
-- Name: poll_leader poll_leader_public_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.poll_leader
    ADD CONSTRAINT poll_leader_public_key_key UNIQUE (public_key);


--
-- TOC entry 4040 (class 2606 OID 32088)
-- Name: shop_items shop_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shop_items
    ADD CONSTRAINT shop_items_pkey PRIMARY KEY (id);


--
-- TOC entry 4104 (class 2606 OID 38848)
-- Name: tournament_matches tournament_matches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tournament_matches
    ADD CONSTRAINT tournament_matches_pkey PRIMARY KEY (id);


--
-- TOC entry 4096 (class 2606 OID 38822)
-- Name: tournament_players tournament_players_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tournament_players
    ADD CONSTRAINT tournament_players_pkey PRIMARY KEY (id);


--
-- TOC entry 4098 (class 2606 OID 38824)
-- Name: tournament_players tournament_players_tournament_id_player_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tournament_players
    ADD CONSTRAINT tournament_players_tournament_id_player_id_key UNIQUE (tournament_id, player_id);


--
-- TOC entry 4108 (class 2606 OID 39004)
-- Name: tournament_results tournament_results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tournament_results
    ADD CONSTRAINT tournament_results_pkey PRIMARY KEY (id);


--
-- TOC entry 4110 (class 2606 OID 39006)
-- Name: tournament_results tournament_results_tournament_id_player_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tournament_results
    ADD CONSTRAINT tournament_results_tournament_id_player_id_key UNIQUE (tournament_id, player_id);


--
-- TOC entry 4112 (class 2606 OID 39008)
-- Name: tournament_results tournament_results_tournament_id_position_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tournament_results
    ADD CONSTRAINT tournament_results_tournament_id_position_key UNIQUE (tournament_id, "position");


--
-- TOC entry 4092 (class 2606 OID 39783)
-- Name: tournaments tournaments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tournaments
    ADD CONSTRAINT tournaments_pkey PRIMARY KEY (game_id);


--
-- TOC entry 4132 (class 2606 OID 39536)
-- Name: admins unique_admin_user_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT unique_admin_user_id UNIQUE (user_id);


--
-- TOC entry 4125 (class 2606 OID 47622)
-- Name: wallets unique_arcade_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT unique_arcade_id UNIQUE (arcade_id);


--
-- TOC entry 3994 (class 2606 OID 39395)
-- Name: esports unique_game_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.esports
    ADD CONSTRAINT unique_game_id UNIQUE (game_id);


--
-- TOC entry 4076 (class 2606 OID 45731)
-- Name: arcade_leaderboard unique_game_player; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.arcade_leaderboard
    ADD CONSTRAINT unique_game_player UNIQUE (game_id, player);


--
-- TOC entry 4042 (class 2606 OID 32241)
-- Name: shop_items unique_item_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shop_items
    ADD CONSTRAINT unique_item_id UNIQUE (url_friendly_id);


--
-- TOC entry 4005 (class 2606 OID 29393)
-- Name: grabbit_players unique_player_per_game; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grabbit_players
    ADD CONSTRAINT unique_player_per_game UNIQUE (game_id, player);


--
-- TOC entry 4031 (class 2606 OID 38743)
-- Name: users unique_publickey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT unique_publickey UNIQUE ("publicKey");


--
-- TOC entry 4053 (class 2606 OID 32317)
-- Name: user_address user_address_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_address
    ADD CONSTRAINT user_address_pkey PRIMARY KEY (id);


--
-- TOC entry 4023 (class 2606 OID 29462)
-- Name: user_deposit_addresses user_deposit_addresses_deposit_address_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_deposit_addresses
    ADD CONSTRAINT user_deposit_addresses_deposit_address_key UNIQUE (deposit_address);


--
-- TOC entry 4025 (class 2606 OID 29460)
-- Name: user_deposit_addresses user_deposit_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_deposit_addresses
    ADD CONSTRAINT user_deposit_addresses_pkey PRIMARY KEY (id);


--
-- TOC entry 4027 (class 2606 OID 29472)
-- Name: user_testing_games user_testing_games_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_testing_games
    ADD CONSTRAINT user_testing_games_pkey PRIMARY KEY (id);


--
-- TOC entry 4029 (class 2606 OID 30905)
-- Name: user_testing_games user_testing_games_user_id_game_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_testing_games
    ADD CONSTRAINT user_testing_games_user_id_game_id_key UNIQUE (user_id, game_id);


--
-- TOC entry 4033 (class 2606 OID 29485)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4035 (class 2606 OID 29487)
-- Name: users users_wallet_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_wallet_key UNIQUE (deposit_wallet);


--
-- TOC entry 4037 (class 2606 OID 29496)
-- Name: votes votes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_pkey PRIMARY KEY (id);


--
-- TOC entry 4127 (class 2606 OID 39414)
-- Name: wallets wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_pkey PRIMARY KEY (id);


--
-- TOC entry 4153 (class 2606 OID 51478)
-- Name: withdraws withdraws_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.withdraws
    ADD CONSTRAINT withdraws_pkey PRIMARY KEY (id);


--
-- TOC entry 4143 (class 1259 OID 47894)
-- Name: blocked_users_blocker_blocked_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX blocked_users_blocker_blocked_idx ON public.blocked_users USING btree (blocker_id, blocked_id);


--
-- TOC entry 4142 (class 1259 OID 47842)
-- Name: chat_1on1_sender_receiver_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX chat_1on1_sender_receiver_idx ON public.chat_1on1 USING btree (sender_id, receiver_id);


--
-- TOC entry 4130 (class 1259 OID 39537)
-- Name: idx_admins_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admins_user_id ON public.admins USING btree (user_id);


--
-- TOC entry 4137 (class 1259 OID 39589)
-- Name: idx_approved_tokens_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_approved_tokens_created_by ON public.approved_tokens USING btree (created_by);


--
-- TOC entry 4138 (class 1259 OID 39636)
-- Name: idx_approved_tokens_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_approved_tokens_status ON public.approved_tokens USING btree (status);


--
-- TOC entry 4139 (class 1259 OID 39590)
-- Name: idx_approved_tokens_updated_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_approved_tokens_updated_by ON public.approved_tokens USING btree (updated_by);


--
-- TOC entry 4062 (class 1259 OID 36144)
-- Name: idx_arcade_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_arcade_category ON public.arcade USING btree (category);


--
-- TOC entry 4089 (class 1259 OID 36158)
-- Name: idx_arcade_creation_payments_arcade_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_arcade_creation_payments_arcade_id ON public.arcade_creation_payments USING btree (arcade_id);


--
-- TOC entry 4090 (class 1259 OID 36159)
-- Name: idx_arcade_creation_payments_creator_wallet; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_arcade_creation_payments_creator_wallet ON public.arcade_creation_payments USING btree (creator_wallet);


--
-- TOC entry 4063 (class 1259 OID 36143)
-- Name: idx_arcade_creator_wallet; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_arcade_creator_wallet ON public.arcade USING btree (creator);


--
-- TOC entry 4069 (class 1259 OID 36148)
-- Name: idx_arcade_history_arcade_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_arcade_history_arcade_id ON public.arcade_history USING btree (arcade_id);


--
-- TOC entry 4070 (class 1259 OID 36149)
-- Name: idx_arcade_history_player_wallet; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_arcade_history_player_wallet ON public.arcade_history USING btree (player);


--
-- TOC entry 4073 (class 1259 OID 36151)
-- Name: idx_arcade_leaderboard_player_wallet; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_arcade_leaderboard_player_wallet ON public.arcade_leaderboard USING btree (player);


--
-- TOC entry 4074 (class 1259 OID 36152)
-- Name: idx_arcade_leaderboard_score; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_arcade_leaderboard_score ON public.arcade_leaderboard USING btree (score);


--
-- TOC entry 4079 (class 1259 OID 36153)
-- Name: idx_arcade_metrics_arcade_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_arcade_metrics_arcade_id ON public.arcade_metrics USING btree (arcade_id);


--
-- TOC entry 4082 (class 1259 OID 36155)
-- Name: idx_arcade_sessions_player_wallet; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_arcade_sessions_player_wallet ON public.arcade_sessions USING btree (player);


--
-- TOC entry 4064 (class 1259 OID 36145)
-- Name: idx_arcade_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_arcade_status ON public.arcade USING btree (status);


--
-- TOC entry 4085 (class 1259 OID 36156)
-- Name: idx_arcade_test_history_arcade_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_arcade_test_history_arcade_id ON public.arcade_test_history USING btree (arcade_id);


--
-- TOC entry 4086 (class 1259 OID 36157)
-- Name: idx_arcade_test_history_tester_wallet; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_arcade_test_history_tester_wallet ON public.arcade_test_history USING btree (tester_wallet);


--
-- TOC entry 4065 (class 1259 OID 36147)
-- Name: idx_arcade_tester; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_arcade_tester ON public.arcade USING btree (tester);


--
-- TOC entry 4066 (class 1259 OID 36146)
-- Name: idx_arcade_top_scorer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_arcade_top_scorer ON public.arcade USING btree (top_scorer);


--
-- TOC entry 4056 (class 1259 OID 32362)
-- Name: idx_cart_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cart_item_id ON public.cart USING btree (item_id);


--
-- TOC entry 4057 (class 1259 OID 32361)
-- Name: idx_cart_public_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cart_public_key ON public.cart USING btree (public_key);


--
-- TOC entry 3986 (class 1259 OID 29514)
-- Name: idx_chatroom_members_chatroom_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chatroom_members_chatroom_id ON public.chatroom_members USING btree (chatroom_id);


--
-- TOC entry 4003 (class 1259 OID 29575)
-- Name: idx_grabbit_players_game_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_grabbit_players_game_id ON public.grabbit_players USING btree (game_id);


--
-- TOC entry 4047 (class 1259 OID 32122)
-- Name: idx_order_items_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_items_item_id ON public.order_items USING btree (item_id);


--
-- TOC entry 4048 (class 1259 OID 32121)
-- Name: idx_order_items_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_items_order_id ON public.order_items USING btree (order_id);


--
-- TOC entry 4043 (class 1259 OID 32120)
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- TOC entry 4044 (class 1259 OID 32119)
-- Name: idx_orders_wallet_address; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_wallet_address ON public.orders USING btree (wallet_address);


--
-- TOC entry 4113 (class 1259 OID 39159)
-- Name: idx_payments_game_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_game_id ON public.payments USING btree (game_id);


--
-- TOC entry 4114 (class 1259 OID 39158)
-- Name: idx_payments_game_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_game_type ON public.payments USING btree (game_type);


--
-- TOC entry 4115 (class 1259 OID 39160)
-- Name: idx_payments_pay_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_pay_date ON public.payments USING btree (pay_date);


--
-- TOC entry 4116 (class 1259 OID 39157)
-- Name: idx_payments_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_user ON public.payments USING btree (user_id);


--
-- TOC entry 4038 (class 1259 OID 32118)
-- Name: idx_shop_items_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_shop_items_category ON public.shop_items USING btree (category);


--
-- TOC entry 4099 (class 1259 OID 38870)
-- Name: idx_tournament_matches_player1_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tournament_matches_player1_id ON public.tournament_matches USING btree (player1_id);


--
-- TOC entry 4100 (class 1259 OID 38871)
-- Name: idx_tournament_matches_player2_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tournament_matches_player2_id ON public.tournament_matches USING btree (player2_id);


--
-- TOC entry 4101 (class 1259 OID 38869)
-- Name: idx_tournament_matches_tournament_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tournament_matches_tournament_id ON public.tournament_matches USING btree (tournament_id);


--
-- TOC entry 4102 (class 1259 OID 38872)
-- Name: idx_tournament_matches_winner_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tournament_matches_winner_id ON public.tournament_matches USING btree (winner_id);


--
-- TOC entry 4093 (class 1259 OID 38836)
-- Name: idx_tournament_players_player_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tournament_players_player_id ON public.tournament_players USING btree (player_id);


--
-- TOC entry 4094 (class 1259 OID 38835)
-- Name: idx_tournament_players_tournament_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tournament_players_tournament_id ON public.tournament_players USING btree (tournament_id);


--
-- TOC entry 4105 (class 1259 OID 39020)
-- Name: idx_tournament_results_player_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tournament_results_player_id ON public.tournament_results USING btree (player_id);


--
-- TOC entry 4106 (class 1259 OID 39019)
-- Name: idx_tournament_results_tournament_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tournament_results_tournament_id ON public.tournament_results USING btree (tournament_id);


--
-- TOC entry 4051 (class 1259 OID 32318)
-- Name: idx_user_address_wallet_address; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_address_wallet_address ON public.user_address USING btree (wallet_address);


--
-- TOC entry 4119 (class 1259 OID 39418)
-- Name: idx_wallets_arcade_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wallets_arcade_id ON public.wallets USING btree (arcade_id);


--
-- TOC entry 4120 (class 1259 OID 39416)
-- Name: idx_wallets_esports_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wallets_esports_id ON public.wallets USING btree (esports_id);


--
-- TOC entry 4121 (class 1259 OID 39419)
-- Name: idx_wallets_grabbit_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wallets_grabbit_id ON public.wallets USING btree (grabbit_id);


--
-- TOC entry 4122 (class 1259 OID 39415)
-- Name: idx_wallets_public_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wallets_public_key ON public.wallets USING btree (public_key);


--
-- TOC entry 4123 (class 1259 OID 39417)
-- Name: idx_wallets_tournament_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wallets_tournament_id ON public.wallets USING btree (tournament_id);


--
-- TOC entry 4204 (class 2620 OID 39592)
-- Name: approved_tokens set_approved_tokens_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_approved_tokens_updated_at BEFORE UPDATE ON public.approved_tokens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4200 (class 2620 OID 32324)
-- Name: user_address set_single_default_address; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_single_default_address BEFORE INSERT OR UPDATE ON public.user_address FOR EACH ROW EXECUTE FUNCTION public.ensure_single_default_address();


--
-- TOC entry 4198 (class 2620 OID 32157)
-- Name: shop_items set_url_friendly_id_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_url_friendly_id_trigger BEFORE INSERT ON public.shop_items FOR EACH ROW EXECUTE FUNCTION public.set_url_friendly_id();


--
-- TOC entry 4203 (class 2620 OID 39540)
-- Name: admins update_admin_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_admin_updated_at_trigger BEFORE UPDATE ON public.admins FOR EACH ROW EXECUTE FUNCTION public.update_admin_updated_at();


--
-- TOC entry 4199 (class 2620 OID 32129)
-- Name: order_items update_stock_quantity_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_stock_quantity_trigger AFTER INSERT ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.update_stock_quantity();


--
-- TOC entry 4202 (class 2620 OID 38873)
-- Name: tournament_matches update_tournament_matches_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_tournament_matches_modtime BEFORE UPDATE ON public.tournament_matches FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 4201 (class 2620 OID 38837)
-- Name: tournaments update_tournaments_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_tournaments_modtime BEFORE UPDATE ON public.tournaments FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- TOC entry 4189 (class 2606 OID 39578)
-- Name: approved_tokens approved_tokens_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approved_tokens
    ADD CONSTRAINT approved_tokens_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admins(id);


--
-- TOC entry 4190 (class 2606 OID 39583)
-- Name: approved_tokens approved_tokens_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approved_tokens
    ADD CONSTRAINT approved_tokens_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.admins(id);


--
-- TOC entry 4175 (class 2606 OID 36138)
-- Name: arcade_creation_payments arcade_creation_payments_arcade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.arcade_creation_payments
    ADD CONSTRAINT arcade_creation_payments_arcade_id_fkey FOREIGN KEY (arcade_id) REFERENCES public.arcade(id) ON DELETE CASCADE;


--
-- TOC entry 4169 (class 2606 OID 36063)
-- Name: arcade_history arcade_history_arcade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.arcade_history
    ADD CONSTRAINT arcade_history_arcade_id_fkey FOREIGN KEY (arcade_id) REFERENCES public.arcade(id) ON DELETE CASCADE;


--
-- TOC entry 4172 (class 2606 OID 36093)
-- Name: arcade_metrics arcade_metrics_arcade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.arcade_metrics
    ADD CONSTRAINT arcade_metrics_arcade_id_fkey FOREIGN KEY (arcade_id) REFERENCES public.arcade(id) ON DELETE CASCADE;


--
-- TOC entry 4173 (class 2606 OID 37355)
-- Name: arcade_sessions arcade_sessions_arcade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.arcade_sessions
    ADD CONSTRAINT arcade_sessions_arcade_id_fkey FOREIGN KEY (arcade_id) REFERENCES public.arcade(game_id) ON DELETE CASCADE;


--
-- TOC entry 4174 (class 2606 OID 36124)
-- Name: arcade_test_history arcade_test_history_arcade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.arcade_test_history
    ADD CONSTRAINT arcade_test_history_arcade_id_fkey FOREIGN KEY (arcade_id) REFERENCES public.arcade(id) ON DELETE CASCADE;


--
-- TOC entry 4193 (class 2606 OID 47889)
-- Name: blocked_users blocked_users_blocked_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocked_users
    ADD CONSTRAINT blocked_users_blocked_id_fkey FOREIGN KEY (blocked_id) REFERENCES public.users("publicKey");


--
-- TOC entry 4194 (class 2606 OID 47884)
-- Name: blocked_users blocked_users_blocker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blocked_users
    ADD CONSTRAINT blocked_users_blocker_id_fkey FOREIGN KEY (blocker_id) REFERENCES public.users("publicKey");


--
-- TOC entry 4168 (class 2606 OID 32356)
-- Name: cart cart_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.shop_items(id) ON DELETE CASCADE;


--
-- TOC entry 4191 (class 2606 OID 47837)
-- Name: chat_1on1 chat_1on1_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_1on1
    ADD CONSTRAINT chat_1on1_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users("publicKey");


--
-- TOC entry 4192 (class 2606 OID 47832)
-- Name: chat_1on1 chat_1on1_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_1on1
    ADD CONSTRAINT chat_1on1_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users("publicKey");


--
-- TOC entry 4158 (class 2606 OID 29509)
-- Name: chatroom_members chatroom_members_chatroom_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chatroom_members
    ADD CONSTRAINT chatroom_members_chatroom_id_fkey FOREIGN KEY (chatroom_id) REFERENCES public.chatrooms(id) ON DELETE CASCADE;


--
-- TOC entry 4159 (class 2606 OID 29520)
-- Name: comments comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(deposit_wallet);


--
-- TOC entry 4195 (class 2606 OID 47953)
-- Name: esports_records esports_records_public_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.esports_records
    ADD CONSTRAINT esports_records_public_key_fkey FOREIGN KEY (public_key) REFERENCES public.users("publicKey");


--
-- TOC entry 4185 (class 2606 OID 39430)
-- Name: wallets fk_arcade; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT fk_arcade FOREIGN KEY (arcade_id) REFERENCES public.arcade(game_id) ON DELETE SET NULL;


--
-- TOC entry 4186 (class 2606 OID 39420)
-- Name: wallets fk_esports; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT fk_esports FOREIGN KEY (esports_id) REFERENCES public.esports(game_id) ON DELETE SET NULL;


--
-- TOC entry 4170 (class 2606 OID 41034)
-- Name: arcade_leaderboard fk_game_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.arcade_leaderboard
    ADD CONSTRAINT fk_game_id FOREIGN KEY (game_id) REFERENCES public.arcade(game_id) ON DELETE CASCADE;


--
-- TOC entry 4187 (class 2606 OID 39435)
-- Name: wallets fk_grabbit; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT fk_grabbit FOREIGN KEY (grabbit_id) REFERENCES public.grabbit(game_id) ON DELETE SET NULL;


--
-- TOC entry 4160 (class 2606 OID 47978)
-- Name: esports fk_player1; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.esports
    ADD CONSTRAINT fk_player1 FOREIGN KEY (player1) REFERENCES public.users("publicKey");


--
-- TOC entry 4161 (class 2606 OID 47983)
-- Name: esports fk_player2; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.esports
    ADD CONSTRAINT fk_player2 FOREIGN KEY (player2) REFERENCES public.users("publicKey");


--
-- TOC entry 4171 (class 2606 OID 41009)
-- Name: arcade_leaderboard fk_player_public_key; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.arcade_leaderboard
    ADD CONSTRAINT fk_player_public_key FOREIGN KEY (player) REFERENCES public.users("publicKey") ON DELETE CASCADE;


--
-- TOC entry 4197 (class 2606 OID 53747)
-- Name: chatroom_ban fk_public_key; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chatroom_ban
    ADD CONSTRAINT fk_public_key FOREIGN KEY (public_key) REFERENCES public.users("publicKey") ON DELETE CASCADE;


--
-- TOC entry 4156 (class 2606 OID 47752)
-- Name: chat_messages fk_receiver_public_key; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT fk_receiver_public_key FOREIGN KEY (receiver_public_key) REFERENCES public.users("publicKey") ON DELETE CASCADE;


--
-- TOC entry 4157 (class 2606 OID 47747)
-- Name: chat_messages fk_sender_public_key; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT fk_sender_public_key FOREIGN KEY (sender_public_key) REFERENCES public.users("publicKey") ON DELETE CASCADE;


--
-- TOC entry 4188 (class 2606 OID 39831)
-- Name: wallets fk_tournament; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT fk_tournament FOREIGN KEY (tournament_id) REFERENCES public.tournaments(game_id) ON DELETE CASCADE;


--
-- TOC entry 4162 (class 2606 OID 45723)
-- Name: flagged_scores flagged_scores_player_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.flagged_scores
    ADD CONSTRAINT flagged_scores_player_fkey FOREIGN KEY (player) REFERENCES public.users(deposit_wallet);


--
-- TOC entry 4163 (class 2606 OID 29570)
-- Name: grabbit_players grabbit_players_game_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grabbit_players
    ADD CONSTRAINT grabbit_players_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.grabbit(game_id) ON DELETE CASCADE;


--
-- TOC entry 4166 (class 2606 OID 32113)
-- Name: order_items order_items_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.shop_items(id) ON DELETE SET NULL;


--
-- TOC entry 4167 (class 2606 OID 32108)
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- TOC entry 4179 (class 2606 OID 38854)
-- Name: tournament_matches tournament_matches_player1_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tournament_matches
    ADD CONSTRAINT tournament_matches_player1_id_fkey FOREIGN KEY (player1_id) REFERENCES public.users("publicKey");


--
-- TOC entry 4180 (class 2606 OID 38859)
-- Name: tournament_matches tournament_matches_player2_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tournament_matches
    ADD CONSTRAINT tournament_matches_player2_id_fkey FOREIGN KEY (player2_id) REFERENCES public.users("publicKey");


--
-- TOC entry 4181 (class 2606 OID 39821)
-- Name: tournament_matches tournament_matches_tournament_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tournament_matches
    ADD CONSTRAINT tournament_matches_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(game_id) ON DELETE CASCADE;


--
-- TOC entry 4182 (class 2606 OID 38864)
-- Name: tournament_matches tournament_matches_winner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tournament_matches
    ADD CONSTRAINT tournament_matches_winner_id_fkey FOREIGN KEY (winner_id) REFERENCES public.users("publicKey");


--
-- TOC entry 4177 (class 2606 OID 38830)
-- Name: tournament_players tournament_players_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tournament_players
    ADD CONSTRAINT tournament_players_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.users("publicKey");


--
-- TOC entry 4178 (class 2606 OID 39816)
-- Name: tournament_players tournament_players_tournament_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tournament_players
    ADD CONSTRAINT tournament_players_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(game_id) ON DELETE CASCADE;


--
-- TOC entry 4183 (class 2606 OID 39014)
-- Name: tournament_results tournament_results_player_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tournament_results
    ADD CONSTRAINT tournament_results_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.users("publicKey");


--
-- TOC entry 4184 (class 2606 OID 39826)
-- Name: tournament_results tournament_results_tournament_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tournament_results
    ADD CONSTRAINT tournament_results_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(game_id) ON DELETE CASCADE;


--
-- TOC entry 4176 (class 2606 OID 38807)
-- Name: tournaments tournaments_host_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tournaments
    ADD CONSTRAINT tournaments_host_id_fkey FOREIGN KEY (host_id) REFERENCES public.users("publicKey");


--
-- TOC entry 4164 (class 2606 OID 29576)
-- Name: user_deposit_addresses user_deposit_addresses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_deposit_addresses
    ADD CONSTRAINT user_deposit_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(deposit_wallet);


--
-- TOC entry 4165 (class 2606 OID 29591)
-- Name: votes votes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(deposit_wallet);


--
-- TOC entry 4196 (class 2606 OID 51479)
-- Name: withdraws withdraws_public_key_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.withdraws
    ADD CONSTRAINT withdraws_public_key_fkey FOREIGN KEY (public_key) REFERENCES public.users("publicKey");


--
-- TOC entry 4387 (class 3256 OID 39161)
-- Name: payments Allow all access to all users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all access to all users" ON public.payments USING (true) WITH CHECK (true);


--
-- TOC entry 4378 (class 3256 OID 32126)
-- Name: order_items Allow insert for all users for order_items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow insert for all users for order_items" ON public.order_items FOR INSERT WITH CHECK (true);


--
-- TOC entry 4376 (class 3256 OID 32124)
-- Name: orders Allow insert for all users for orders; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow insert for all users for orders" ON public.orders FOR INSERT WITH CHECK (true);


--
-- TOC entry 4379 (class 3256 OID 32127)
-- Name: order_items Allow read access to own order items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow read access to own order items" ON public.order_items FOR SELECT USING ((order_id IN ( SELECT orders.id
   FROM public.orders
  WHERE (orders.wallet_address = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'::text)))));


--
-- TOC entry 4377 (class 3256 OID 32125)
-- Name: orders Allow read access to own orders; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow read access to own orders" ON public.orders FOR SELECT USING ((wallet_address = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'::text)));


--
-- TOC entry 4381 (class 3256 OID 32319)
-- Name: user_address Anyone can view all addresses; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view all addresses" ON public.user_address FOR SELECT USING (true);


--
-- TOC entry 4384 (class 3256 OID 32322)
-- Name: user_address Delete with valid signature; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Delete with valid signature" ON public.user_address FOR DELETE USING (true);


--
-- TOC entry 4382 (class 3256 OID 32320)
-- Name: user_address Insert with valid signature; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Insert with valid signature" ON public.user_address FOR INSERT WITH CHECK (true);


--
-- TOC entry 4383 (class 3256 OID 32321)
-- Name: user_address Update with valid signature; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Update with valid signature" ON public.user_address FOR UPDATE USING (true);


--
-- TOC entry 4365 (class 0 OID 36034)
-- Dependencies: 323
-- Name: arcade; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.arcade ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4371 (class 0 OID 36129)
-- Dependencies: 329
-- Name: arcade_creation_payments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.arcade_creation_payments ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4366 (class 0 OID 36054)
-- Dependencies: 324
-- Name: arcade_history; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.arcade_history ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4367 (class 0 OID 36068)
-- Dependencies: 325
-- Name: arcade_leaderboard; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.arcade_leaderboard ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4389 (class 3256 OID 45752)
-- Name: arcade_leaderboard arcade_leaderboard; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY arcade_leaderboard ON public.arcade_leaderboard USING (true) WITH CHECK (true);


--
-- TOC entry 4368 (class 0 OID 36082)
-- Dependencies: 326
-- Name: arcade_metrics; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.arcade_metrics ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4386 (class 3256 OID 36184)
-- Name: arcade arcade_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY arcade_policy ON public.arcade USING (true) WITH CHECK (true);


--
-- TOC entry 4369 (class 0 OID 36098)
-- Dependencies: 327
-- Name: arcade_sessions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.arcade_sessions ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4388 (class 3256 OID 45722)
-- Name: arcade_sessions arcade_sessions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY arcade_sessions ON public.arcade_sessions USING (true) WITH CHECK (true);


--
-- TOC entry 4370 (class 0 OID 36113)
-- Dependencies: 328
-- Name: arcade_test_history; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.arcade_test_history ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4364 (class 0 OID 32346)
-- Dependencies: 321
-- Name: cart; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4385 (class 3256 OID 32388)
-- Name: cart cart_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY cart_policy ON public.cart USING (true) WITH CHECK (true);


--
-- TOC entry 4354 (class 0 OID 29234)
-- Dependencies: 294
-- Name: chat_messages; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4390 (class 3256 OID 47688)
-- Name: chat_messages chatroom; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY chatroom ON public.chat_messages USING (true) WITH CHECK (true);


--
-- TOC entry 4355 (class 0 OID 29252)
-- Dependencies: 296
-- Name: chatroom_members; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.chatroom_members ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4356 (class 0 OID 29261)
-- Dependencies: 297
-- Name: chatrooms; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.chatrooms ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4373 (class 0 OID 47937)
-- Dependencies: 347
-- Name: esports_records; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.esports_records ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4391 (class 3256 OID 49113)
-- Name: esports_records esports_records; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY esports_records ON public.esports_records USING (true) WITH CHECK (true);


--
-- TOC entry 4357 (class 0 OID 29361)
-- Dependencies: 302
-- Name: grabbit; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.grabbit ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4374 (class 3256 OID 30837)
-- Name: grabbit grabbit_games; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY grabbit_games ON public.grabbit USING (true) WITH CHECK (true);


--
-- TOC entry 4358 (class 0 OID 29377)
-- Dependencies: 303
-- Name: grabbit_players; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.grabbit_players ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4375 (class 3256 OID 30838)
-- Name: grabbit_players grabbit_players; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY grabbit_players ON public.grabbit_players USING (true) WITH CHECK (true);


--
-- TOC entry 4359 (class 0 OID 29394)
-- Dependencies: 304
-- Name: grabbit_profile; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.grabbit_profile ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4362 (class 0 OID 32100)
-- Dependencies: 317
-- Name: order_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4361 (class 0 OID 32089)
-- Dependencies: 316
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4372 (class 0 OID 39142)
-- Dependencies: 337
-- Name: payments; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4360 (class 0 OID 32078)
-- Dependencies: 315
-- Name: shop_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4380 (class 3256 OID 32150)
-- Name: shop_items shop_items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY shop_items ON public.shop_items USING (true) WITH CHECK (true);


--
-- TOC entry 4363 (class 0 OID 32307)
-- Dependencies: 320
-- Name: user_address; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_address ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4402 (class 0 OID 0)
-- Dependencies: 342
-- Name: TABLE admins; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.admins TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.admins TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.admins TO service_role;


--
-- TOC entry 4403 (class 0 OID 0)
-- Dependencies: 343
-- Name: TABLE approved_tokens; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.approved_tokens TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.approved_tokens TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.approved_tokens TO service_role;


--
-- TOC entry 4405 (class 0 OID 0)
-- Dependencies: 323
-- Name: TABLE arcade; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.arcade TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.arcade TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.arcade TO service_role;
GRANT SELECT,INSERT,UPDATE ON TABLE public.arcade TO PUBLIC;


--
-- TOC entry 4407 (class 0 OID 0)
-- Dependencies: 322
-- Name: SEQUENCE arcade_arcade_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.arcade_arcade_id_seq TO anon;
GRANT ALL ON SEQUENCE public.arcade_arcade_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.arcade_arcade_id_seq TO service_role;
GRANT SELECT,USAGE ON SEQUENCE public.arcade_arcade_id_seq TO PUBLIC;


--
-- TOC entry 4408 (class 0 OID 0)
-- Dependencies: 329
-- Name: TABLE arcade_creation_payments; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.arcade_creation_payments TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.arcade_creation_payments TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.arcade_creation_payments TO service_role;


--
-- TOC entry 4409 (class 0 OID 0)
-- Dependencies: 324
-- Name: TABLE arcade_history; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.arcade_history TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.arcade_history TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.arcade_history TO service_role;


--
-- TOC entry 4410 (class 0 OID 0)
-- Dependencies: 325
-- Name: TABLE arcade_leaderboard; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.arcade_leaderboard TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.arcade_leaderboard TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.arcade_leaderboard TO service_role;


--
-- TOC entry 4411 (class 0 OID 0)
-- Dependencies: 326
-- Name: TABLE arcade_metrics; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.arcade_metrics TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.arcade_metrics TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.arcade_metrics TO service_role;


--
-- TOC entry 4412 (class 0 OID 0)
-- Dependencies: 327
-- Name: TABLE arcade_sessions; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.arcade_sessions TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.arcade_sessions TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.arcade_sessions TO service_role;


--
-- TOC entry 4413 (class 0 OID 0)
-- Dependencies: 328
-- Name: TABLE arcade_test_history; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.arcade_test_history TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.arcade_test_history TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.arcade_test_history TO service_role;


--
-- TOC entry 4414 (class 0 OID 0)
-- Dependencies: 346
-- Name: TABLE blocked_users; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.blocked_users TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.blocked_users TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.blocked_users TO service_role;


--
-- TOC entry 4415 (class 0 OID 0)
-- Dependencies: 321
-- Name: TABLE cart; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.cart TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.cart TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.cart TO service_role;


--
-- TOC entry 4416 (class 0 OID 0)
-- Dependencies: 345
-- Name: TABLE chat_1on1; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.chat_1on1 TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.chat_1on1 TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.chat_1on1 TO service_role;


--
-- TOC entry 4417 (class 0 OID 0)
-- Dependencies: 294
-- Name: TABLE chat_messages; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.chat_messages TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.chat_messages TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.chat_messages TO service_role;


--
-- TOC entry 4418 (class 0 OID 0)
-- Dependencies: 295
-- Name: TABLE chat_rooms; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.chat_rooms TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.chat_rooms TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.chat_rooms TO service_role;


--
-- TOC entry 4419 (class 0 OID 0)
-- Dependencies: 349
-- Name: TABLE chatroom_ban; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.chatroom_ban TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.chatroom_ban TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.chatroom_ban TO service_role;


--
-- TOC entry 4420 (class 0 OID 0)
-- Dependencies: 296
-- Name: TABLE chatroom_members; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.chatroom_members TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.chatroom_members TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.chatroom_members TO service_role;


--
-- TOC entry 4421 (class 0 OID 0)
-- Dependencies: 297
-- Name: TABLE chatrooms; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.chatrooms TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.chatrooms TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.chatrooms TO service_role;


--
-- TOC entry 4422 (class 0 OID 0)
-- Dependencies: 298
-- Name: TABLE comments; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.comments TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.comments TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.comments TO service_role;


--
-- TOC entry 4424 (class 0 OID 0)
-- Dependencies: 299
-- Name: TABLE esports; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.esports TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.esports TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.esports TO service_role;


--
-- TOC entry 4426 (class 0 OID 0)
-- Dependencies: 338
-- Name: SEQUENCE esports_game_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.esports_game_id_seq TO anon;
GRANT ALL ON SEQUENCE public.esports_game_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.esports_game_id_seq TO service_role;


--
-- TOC entry 4427 (class 0 OID 0)
-- Dependencies: 339
-- Name: SEQUENCE esports_game_id_seq1; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.esports_game_id_seq1 TO anon;
GRANT ALL ON SEQUENCE public.esports_game_id_seq1 TO authenticated;
GRANT ALL ON SEQUENCE public.esports_game_id_seq1 TO service_role;


--
-- TOC entry 4428 (class 0 OID 0)
-- Dependencies: 347
-- Name: TABLE esports_records; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.esports_records TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.esports_records TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.esports_records TO service_role;


--
-- TOC entry 4429 (class 0 OID 0)
-- Dependencies: 300
-- Name: TABLE flagged_scores; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.flagged_scores TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.flagged_scores TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.flagged_scores TO service_role;


--
-- TOC entry 4431 (class 0 OID 0)
-- Dependencies: 302
-- Name: TABLE grabbit; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.grabbit TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.grabbit TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.grabbit TO service_role;


--
-- TOC entry 4433 (class 0 OID 0)
-- Dependencies: 301
-- Name: SEQUENCE grabbit_game_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.grabbit_game_id_seq TO anon;
GRANT ALL ON SEQUENCE public.grabbit_game_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.grabbit_game_id_seq TO service_role;


--
-- TOC entry 4434 (class 0 OID 0)
-- Dependencies: 303
-- Name: TABLE grabbit_players; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.grabbit_players TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.grabbit_players TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.grabbit_players TO service_role;


--
-- TOC entry 4435 (class 0 OID 0)
-- Dependencies: 304
-- Name: TABLE grabbit_profile; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.grabbit_profile TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.grabbit_profile TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.grabbit_profile TO service_role;


--
-- TOC entry 4436 (class 0 OID 0)
-- Dependencies: 306
-- Name: TABLE grabbit_wallet; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.grabbit_wallet TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.grabbit_wallet TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.grabbit_wallet TO service_role;


--
-- TOC entry 4438 (class 0 OID 0)
-- Dependencies: 305
-- Name: SEQUENCE grabbit_wallet_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.grabbit_wallet_id_seq TO anon;
GRANT ALL ON SEQUENCE public.grabbit_wallet_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.grabbit_wallet_id_seq TO service_role;


--
-- TOC entry 4439 (class 0 OID 0)
-- Dependencies: 317
-- Name: TABLE order_items; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.order_items TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.order_items TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.order_items TO service_role;
GRANT SELECT,INSERT ON TABLE public.order_items TO PUBLIC;


--
-- TOC entry 4440 (class 0 OID 0)
-- Dependencies: 316
-- Name: TABLE orders; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.orders TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.orders TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.orders TO service_role;
GRANT SELECT,INSERT ON TABLE public.orders TO PUBLIC;


--
-- TOC entry 4441 (class 0 OID 0)
-- Dependencies: 337
-- Name: TABLE payments; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.payments TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.payments TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.payments TO service_role;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.payments TO PUBLIC;


--
-- TOC entry 4442 (class 0 OID 0)
-- Dependencies: 308
-- Name: TABLE platform_settings; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.platform_settings TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.platform_settings TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.platform_settings TO service_role;


--
-- TOC entry 4444 (class 0 OID 0)
-- Dependencies: 307
-- Name: SEQUENCE platform_settings_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.platform_settings_id_seq TO anon;
GRANT ALL ON SEQUENCE public.platform_settings_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.platform_settings_id_seq TO service_role;


--
-- TOC entry 4445 (class 0 OID 0)
-- Dependencies: 310
-- Name: TABLE poll_leader; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.poll_leader TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.poll_leader TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.poll_leader TO service_role;


--
-- TOC entry 4447 (class 0 OID 0)
-- Dependencies: 309
-- Name: SEQUENCE poll_leader_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.poll_leader_id_seq TO anon;
GRANT ALL ON SEQUENCE public.poll_leader_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.poll_leader_id_seq TO service_role;


--
-- TOC entry 4448 (class 0 OID 0)
-- Dependencies: 315
-- Name: TABLE shop_items; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.shop_items TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.shop_items TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.shop_items TO service_role;
GRANT SELECT ON TABLE public.shop_items TO PUBLIC;


--
-- TOC entry 4450 (class 0 OID 0)
-- Dependencies: 318
-- Name: SEQUENCE shop_items_url_friendly_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.shop_items_url_friendly_id_seq TO anon;
GRANT ALL ON SEQUENCE public.shop_items_url_friendly_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.shop_items_url_friendly_id_seq TO service_role;


--
-- TOC entry 4451 (class 0 OID 0)
-- Dependencies: 334
-- Name: TABLE tournament_matches; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.tournament_matches TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.tournament_matches TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.tournament_matches TO service_role;


--
-- TOC entry 4453 (class 0 OID 0)
-- Dependencies: 333
-- Name: SEQUENCE tournament_matches_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.tournament_matches_id_seq TO anon;
GRANT ALL ON SEQUENCE public.tournament_matches_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.tournament_matches_id_seq TO service_role;


--
-- TOC entry 4454 (class 0 OID 0)
-- Dependencies: 332
-- Name: TABLE tournament_players; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.tournament_players TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.tournament_players TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.tournament_players TO service_role;


--
-- TOC entry 4456 (class 0 OID 0)
-- Dependencies: 331
-- Name: SEQUENCE tournament_players_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.tournament_players_id_seq TO anon;
GRANT ALL ON SEQUENCE public.tournament_players_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.tournament_players_id_seq TO service_role;


--
-- TOC entry 4457 (class 0 OID 0)
-- Dependencies: 336
-- Name: TABLE tournament_results; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.tournament_results TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.tournament_results TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.tournament_results TO service_role;


--
-- TOC entry 4458 (class 0 OID 0)
-- Dependencies: 335
-- Name: SEQUENCE tournament_results_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.tournament_results_id_seq TO anon;
GRANT ALL ON SEQUENCE public.tournament_results_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.tournament_results_id_seq TO service_role;


--
-- TOC entry 4460 (class 0 OID 0)
-- Dependencies: 330
-- Name: TABLE tournaments; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.tournaments TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.tournaments TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.tournaments TO service_role;


--
-- TOC entry 4462 (class 0 OID 0)
-- Dependencies: 344
-- Name: SEQUENCE tournaments_game_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.tournaments_game_id_seq TO anon;
GRANT ALL ON SEQUENCE public.tournaments_game_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.tournaments_game_id_seq TO service_role;


--
-- TOC entry 4463 (class 0 OID 0)
-- Dependencies: 320
-- Name: TABLE user_address; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.user_address TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.user_address TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.user_address TO service_role;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.user_address TO PUBLIC;


--
-- TOC entry 4464 (class 0 OID 0)
-- Dependencies: 311
-- Name: TABLE user_deposit_addresses; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.user_deposit_addresses TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.user_deposit_addresses TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.user_deposit_addresses TO service_role;


--
-- TOC entry 4465 (class 0 OID 0)
-- Dependencies: 312
-- Name: TABLE user_testing_games; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.user_testing_games TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.user_testing_games TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.user_testing_games TO service_role;


--
-- TOC entry 4466 (class 0 OID 0)
-- Dependencies: 313
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.users TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.users TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.users TO service_role;


--
-- TOC entry 4467 (class 0 OID 0)
-- Dependencies: 314
-- Name: TABLE votes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.votes TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.votes TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.votes TO service_role;


--
-- TOC entry 4476 (class 0 OID 0)
-- Dependencies: 341
-- Name: TABLE wallets; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.wallets TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.wallets TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.wallets TO service_role;


--
-- TOC entry 4478 (class 0 OID 0)
-- Dependencies: 340
-- Name: SEQUENCE wallets_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.wallets_id_seq TO anon;
GRANT ALL ON SEQUENCE public.wallets_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.wallets_id_seq TO service_role;


--
-- TOC entry 4479 (class 0 OID 0)
-- Dependencies: 348
-- Name: TABLE withdraws; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.withdraws TO anon;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.withdraws TO authenticated;
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE public.withdraws TO service_role;


-- Completed on 2025-03-12 23:09:02 EDT

--
-- PostgreSQL database dump complete
--