-- Add platform_wallet_address to platform_settings
ALTER TABLE public.platform_settings
ADD COLUMN platform_wallet_address TEXT;

-- Create a new table to track game creation payments
CREATE TABLE public.game_creation_payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  game_id UUID REFERENCES public.games(id),
  total_amount DECIMAL(10, 2) NOT NULL,
  admin_amount DECIMAL(10, 2) NOT NULL,
  platform_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add a column to track tester earnings for each game
ALTER TABLE public.games
ADD COLUMN tester_earnings DECIMAL(10, 2) DEFAULT 0;

-- Add a column to track total earnings for each user
ALTER TABLE public.users
ADD COLUMN total_earnings DECIMAL(10, 2) DEFAULT 0;

-- Create a function to handle game creation payment
CREATE OR REPLACE FUNCTION handle_game_creation_payment(
  p_game_id UUID,
  p_total_amount DECIMAL(10, 2)
)
RETURNS VOID AS $$
DECLARE
  v_admin_amount DECIMAL(10, 2);
  v_platform_amount DECIMAL(10, 2);
  v_admin_wallet TEXT;
  v_platform_wallet TEXT;
BEGIN
  -- Calculate split amounts
  v_admin_amount := p_total_amount * 0.5;
  v_platform_amount := p_total_amount * 0.5;

  -- Get wallet addresses
  SELECT admin_wallet_address, platform_wallet_address 
  INTO v_admin_wallet, v_platform_wallet
  FROM public.platform_settings
  LIMIT 1;

  -- Insert payment record
  INSERT INTO public.game_creation_payments (
    game_id, total_amount, admin_amount, platform_amount
  ) VALUES (
    p_game_id, p_total_amount, v_admin_amount, v_platform_amount
  );

  -- Update game tester earnings
  UPDATE public.games
  SET tester_earnings = v_platform_amount
  WHERE id = p_game_id;

  -- TODO: Implement actual blockchain transactions here
  -- Send v_admin_amount to v_admin_wallet
  -- Send v_platform_amount to v_platform_wallet
END;
$$ LANGUAGE plpgsql;

-- Create a function to allocate credits to game tester
CREATE OR REPLACE FUNCTION allocate_tester_credits(
  p_game_id UUID,
  p_tester_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_tester_earnings DECIMAL(10, 2);
BEGIN
  -- Get tester earnings for the game
  SELECT tester_earnings INTO v_tester_earnings
  FROM public.games
  WHERE id = p_game_id;

  -- Update user's total earnings and credits
  UPDATE public.users
  SET total_earnings = total_earnings + v_tester_earnings,
      credits = credits + (v_tester_earnings * 100) -- Assuming 1 SOL = 100 credits
  WHERE id = p_tester_id;

  -- Reset game's tester earnings
  UPDATE public.games
  SET tester_earnings = 0
  WHERE id = p_game_id;
END;
$$ LANGUAGE plpgsql;

