-- Create users table
CREATE TABLE public.users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  wallet TEXT UNIQUE NOT NULL,
  username TEXT,
  avatar_url TEXT,
  credits INTEGER DEFAULT 0
);

-- Create user_deposit_addresses table
CREATE TABLE public.user_deposit_addresses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT REFERENCES public.users(wallet),
  deposit_address TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create games table
CREATE TABLE public.games (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_wallet TEXT REFERENCES public.users(wallet),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  play_fee DECIMAL(10, 2) NOT NULL,
  top_payout INTEGER NOT NULL,
  category TEXT NOT NULL,
  rules TEXT,
  game_code TEXT NOT NULL,
  game_css TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_users_wallet ON public.users(wallet);
CREATE INDEX idx_user_deposit_addresses_user_id ON public.user_deposit_addresses(user_id);
CREATE INDEX idx_games_creator_wallet ON public.games(creator_wallet);

