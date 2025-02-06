-- Update games table
ALTER TABLE public.games
ADD COLUMN rules TEXT,
ADD COLUMN top_payout INTEGER NOT NULL DEFAULT 1;

-- Update existing rows to set a default value for top_payout
UPDATE public.games SET top_payout = 1 WHERE top_payout IS NULL;

-- Add NOT NULL constraint to top_payout after setting default values
ALTER TABLE public.games ALTER COLUMN top_payout SET NOT NULL;

