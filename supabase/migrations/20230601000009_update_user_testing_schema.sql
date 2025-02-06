-- Add a new table to track games being tested by users
CREATE TABLE public.user_testing_games (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  game_id UUID REFERENCES public.games(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'in_progress',
  UNIQUE(user_id, game_id)
);

-- Add a column to track tester earnings for each user
ALTER TABLE public.users
ADD COLUMN tester_earnings DECIMAL(10, 2) DEFAULT 0;

-- Update the allocate_tester_credits function to track tester earnings
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

  -- Update user's total earnings, tester earnings, and credits
  UPDATE public.users
  SET total_earnings = total_earnings + v_tester_earnings,
      tester_earnings = tester_earnings + v_tester_earnings,
      credits = credits + (v_tester_earnings * 100) -- Assuming 1 SOL = 100 credits
  WHERE id = p_tester_id;

  -- Reset game's tester earnings
  UPDATE public.games
  SET tester_earnings = 0
  WHERE id = p_game_id;

  -- Update the status of the tested game
  UPDATE public.user_testing_games
  SET status = 'completed'
  WHERE user_id = p_tester_id AND game_id = p_game_id;
END;
$$ LANGUAGE plpgsql;

