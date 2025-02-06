-- Add is_paused column to platform_settings
ALTER TABLE public.platform_settings
ADD COLUMN is_paused BOOLEAN NOT NULL DEFAULT false;

-- Add is_paused column to games table
ALTER TABLE public.games
ADD COLUMN is_paused BOOLEAN NOT NULL DEFAULT false;

-- Create admin_users table
CREATE TABLE public.admin_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint to platform_wallet_address
ALTER TABLE public.platform_settings
ADD CONSTRAINT unique_platform_wallet_address UNIQUE (platform_wallet_address);

-- Create function to ensure only one platform_settings row
CREATE OR REPLACE FUNCTION ensure_single_platform_settings()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.platform_settings) > 0 THEN
    RAISE EXCEPTION 'Only one row is allowed in platform_settings';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce single platform_settings row
CREATE TRIGGER enforce_single_platform_settings
BEFORE INSERT ON public.platform_settings
FOR EACH ROW
EXECUTE FUNCTION ensure_single_platform_settings();

-- Create function to toggle platform pause
CREATE OR REPLACE FUNCTION toggle_platform_pause(admin_user_id UUID)
RETURNS VOID AS $$
DECLARE
  admin_role TEXT;
BEGIN
  -- Check if the user is a super admin
  SELECT role INTO admin_role FROM public.admin_users WHERE user_id = admin_user_id;
  
  IF admin_role != 'super_admin' THEN
    RAISE EXCEPTION 'Only super admins can toggle platform pause';
  END IF;

  UPDATE public.platform_settings
  SET is_paused = NOT is_paused,
      updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to toggle game pause
CREATE OR REPLACE FUNCTION toggle_game_pause(admin_user_id UUID, game_id UUID)
RETURNS VOID AS $$
DECLARE
  admin_role TEXT;
BEGIN
  -- Check if the user is an admin or super admin
  SELECT role INTO admin_role FROM public.admin_users WHERE user_id = admin_user_id;
  
  IF admin_role IS NULL THEN
    RAISE EXCEPTION 'User is not an admin';
  END IF;

  UPDATE public.games
  SET is_paused = NOT is_paused,
      updated_at = NOW()
  WHERE id = game_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to update platform settings
CREATE OR REPLACE FUNCTION update_platform_settings(
  admin_user_id UUID,
  p_dev_fee_percentage DECIMAL,
  p_platform_fee_percentage DECIMAL,
  p_top_player_percentage DECIMAL,
  p_boost_fee INTEGER,
  p_platform_wallet_address TEXT
)
RETURNS VOID AS $$
DECLARE
  admin_role TEXT;
BEGIN
  -- Check if the user is a super admin
  SELECT role INTO admin_role FROM public.admin_users WHERE user_id = admin_user_id;
  
  IF admin_role != 'super_admin' THEN
    RAISE EXCEPTION 'Only super admins can update platform settings';
  END IF;

  UPDATE public.platform_settings
  SET dev_fee_percentage = p_dev_fee_percentage,
      platform_fee_percentage = p_platform_fee_percentage,
      top_player_percentage = p_top_player_percentage,
      boost_fee = p_boost_fee,
      platform_wallet_address = p_platform_wallet_address,
      updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to add admin
CREATE OR REPLACE FUNCTION add_admin(super_admin_user_id UUID, new_admin_user_id UUID, admin_role TEXT)
RETURNS VOID AS $$
DECLARE
  super_admin_role TEXT;
BEGIN
  -- Check if the user adding the admin is a super admin
  SELECT role INTO super_admin_role FROM public.admin_users WHERE user_id = super_admin_user_id;
  
  IF super_admin_role != 'super_admin' THEN
    RAISE EXCEPTION 'Only super admins can add new admins';
  END IF;

  -- Check if the new admin already exists
  IF EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = new_admin_user_id) THEN
    RAISE EXCEPTION 'User is already an admin';
  END IF;

  -- Add the new admin
  INSERT INTO public.admin_users (user_id, role)
  VALUES (new_admin_user_id, admin_role);
END;
$$ LANGUAGE plpgsql;

