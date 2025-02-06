-- Add boost_fee column to platform_settings table
ALTER TABLE platform_settings ADD COLUMN boost_fee INTEGER NOT NULL DEFAULT 10;

-- Update the boost_game function to handle the boost fee
CREATE OR REPLACE FUNCTION boost_game(p_game_id UUID, p_user_id UUID, p_boost_fee INTEGER)
RETURNS VOID AS $$
DECLARE
    v_admin_id UUID;
BEGIN
    -- Check if user has enough credits
    IF (SELECT credits FROM users WHERE id = p_user_id) < p_boost_fee THEN
        RAISE EXCEPTION 'Insufficient credits to boost the game';
    END IF;

    -- Deduct credits from the user
    UPDATE users SET credits = credits - p_boost_fee WHERE id = p_user_id;

    -- Increase the game's boost count
    UPDATE games SET boosts = boosts + 1 WHERE id = p_game_id;

    -- Get the admin ID
    SELECT id INTO v_admin_id FROM users WHERE role = 'admin' LIMIT 1;

    -- Credit the boost fee to the admin
    UPDATE users SET credits = credits + p_boost_fee WHERE id = v_admin_id;
END;
$$ LANGUAGE plpgsql;

