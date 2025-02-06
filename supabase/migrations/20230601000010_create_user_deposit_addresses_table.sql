-- Create user_deposit_addresses table
CREATE TABLE public.user_deposit_addresses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id TEXT REFERENCES public.users(wallet),
  deposit_address TEXT UNIQUE NOT NULL,
  encrypted_private_key TEXT NOT NULL,
  iv TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_user_deposit_addresses_user_id ON public.user_deposit_addresses(user_id);

-- Add RLS policies
ALTER TABLE public.user_deposit_addresses ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own deposit addresses
CREATE POLICY "Users can view own deposit addresses"
  ON public.user_deposit_addresses FOR SELECT
  USING (auth.uid()::text = user_id);

-- Policy to allow insert of deposit addresses (typically done by the system)
CREATE POLICY "System can insert deposit addresses"
  ON public.user_deposit_addresses FOR INSERT
  WITH CHECK (true);  -- You might want to restrict this further based on your system's logic

-- Policy to prevent updates (deposit addresses should not be modified once created)
CREATE POLICY "Prevent updates on deposit addresses"
  ON public.user_deposit_addresses FOR UPDATE
  USING (false);

-- Policy to prevent deletions (deposit addresses should not be deleted)
CREATE POLICY "Prevent deletions of deposit addresses"
  ON public.user_deposit_addresses FOR DELETE
  USING (false);

