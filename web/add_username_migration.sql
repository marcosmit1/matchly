-- Migration: Add username column to existing users table
-- Run this in your Supabase SQL editor

-- Step 1: Add username column to existing users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS username text;

-- Step 2: Add unique constraint for username (allows nulls but ensures uniqueness when set)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_username_key' AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users 
        ADD CONSTRAINT users_username_key UNIQUE (username);
    END IF;
END $$;

-- Step 3: Add index for username for better query performance
CREATE INDEX IF NOT EXISTS users_username_idx 
ON public.users USING btree (username);

-- Step 4: Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users' 
AND column_name = 'username';

-- Optional: Update existing users to have a default username based on email
-- Uncomment the following lines if you want to auto-generate usernames for existing users
-- UPDATE public.users 
-- SET username = LOWER(REPLACE(SPLIT_PART(email, '@', 1), '.', '_'))
-- WHERE username IS NULL AND email IS NOT NULL;
