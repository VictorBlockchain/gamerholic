-- Create a function to decrement boosts
CREATE OR REPLACE FUNCTION decrement_boosts()
RETURNS VOID AS $$
BEGIN
    UPDATE games SET boosts = GREATEST(boosts - 1, 0) WHERE boosts > 0;
END;
$$ LANGUAGE plpgsql;

-- Schedule the function to run every hour
SELECT cron.schedule('decrement_boosts_hourly', '0 * * * *', 'SELECT decrement_boosts()');

