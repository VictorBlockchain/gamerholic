-- Create platform_settings table
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id SERIAL PRIMARY KEY,
  platform_wallet_address TEXT NOT NULL,
  boost_fee INTEGER NOT NULL DEFAULT 10,
  dev_fee_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.10,
  platform_fee_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.05,
  top_player_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.85
);

-- Insert default values
INSERT INTO public.platform_settings (platform_wallet_address)
VALUES ('YOUR_DEFAULT_PLATFORM_WALLET_ADDRESS_HERE')
ON CONFLICT (id) DO NOTHING;

