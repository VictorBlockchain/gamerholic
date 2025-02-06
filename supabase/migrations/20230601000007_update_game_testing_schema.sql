-- Add new columns to the games table
ALTER TABLE public.games
ADD COLUMN status TEXT NOT NULL DEFAULT 'pending_test',
ADD COLUMN current_tester_id UUID,
ADD COLUMN last_test_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN test_feedback TEXT;

-- Create a new table for game test history
CREATE TABLE public.game_test_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  game_id UUID REFERENCES public.games(id),
  tester_id UUID REFERENCES auth.users(id),
  test_result TEXT NOT NULL,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a function to update game status and manage testing process
CREATE OR REPLACE FUNCTION manage_game_testing()
RETURNS TRIGGER AS $$
BEGIN
  -- If a new tester is assigned
  IF NEW.current_tester_id IS NOT NULL AND OLD.current_tester_id IS NULL THEN
    NEW.status = 'in_testing';
    NEW.last_test_date = NOW();
  -- If the game is marked as tested (either passed or failed)
  ELSIF NEW.status IN ('test_passed', 'test_failed') AND OLD.status = 'in_testing' THEN
    -- Record the test result in game_test_history
    INSERT INTO public.game_test_history (game_id, tester_id, test_result, feedback)
    VALUES (NEW.id, NEW.current_tester_id, NEW.status, NEW.test_feedback);
    
    -- Clear the current tester
    NEW.current_tester_id = NULL;
    
    -- If the test failed, set status back to pending_test
    IF NEW.status = 'test_failed' THEN
      NEW.status = 'pending_test';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to manage game testing
CREATE TRIGGER manage_game_testing_trigger
BEFORE UPDATE ON public.games
FOR EACH ROW
EXECUTE FUNCTION manage_game_testing();

-- Create a function to reassign games if not tested within 48 hours
CREATE OR REPLACE FUNCTION reassign_untested_games()
RETURNS VOID AS $$
BEGIN
  UPDATE public.games
  SET status = 'pending_test', current_tester_id = NULL
  WHERE status = 'in_testing'
    AND last_test_date < NOW() - INTERVAL '48 hours';
END;
$$ LANGUAGE plpgsql;

-- Schedule the reassign_untested_games function to run every hour
SELECT cron.schedule('reassign_untested_games_hourly', '0 * * * *', 'SELECT reassign_untested_games()');

