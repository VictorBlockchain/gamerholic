-- Add a new column to store the initial super admin address
ALTER TABLE public.platform_settings
ADD COLUMN initial_super_admin_address TEXT;

-- Create a function to set the initial super admin
CREATE OR REPLACE FUNCTION set_initial_super_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the initial_super_admin_address is set and there are no existing admin users
  IF NEW.initial_super_admin_address IS NOT NULL AND (SELECT COUNT(*) FROM public.admin_users) = 0 THEN
    -- Insert the initial super admin into the admin_users table
    INSERT INTO public.admin_users (user_id, role)
    VALUES (NEW.initial_super_admin_address, 'super_admin');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically set the initial super admin
CREATE TRIGGER set_initial_super_admin_trigger
AFTER INSERT OR UPDATE OF initial_super_admin_address ON public.platform_settings
FOR EACH ROW
EXECUTE FUNCTION set_initial_super_admin();

-- Update the add_admin function to check for super admin privileges
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

-- Function to check if a user is a super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  admin_role TEXT;
BEGIN
  SELECT role INTO admin_role FROM public.admin_users WHERE user_id = $1;
  RETURN admin_role = 'super_admin';
END;
$$ LANGUAGE plpgsql;

