-- Fix foreign key relationship and create missing users
-- Run this in your Supabase SQL editor

-- 1. First, create the missing users in public.users table
INSERT INTO public.users (id, email, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  au.created_at,
  au.updated_at
FROM auth.users au
WHERE au.id IN ('675d39a2-d1fa-4d4a-8a94-47c28e92b2ff', '5c090dbf-4839-43af-8dc0-62c5f583dd15')
AND NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
);

-- 2. Add the missing foreign key constraint
-- First check if it exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'leagues_created_by_fkey' AND conrelid = 'public.leagues'::regclass
    ) THEN
        ALTER TABLE public.leagues 
        ADD CONSTRAINT leagues_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES public.users(id);
    END IF;
END $$;

-- 3. Create the trigger to auto-create users (if not exists)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the new user into the public.users table
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate key errors
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Verify the fixes
SELECT 'Users created:' as info;
SELECT id, email, username, created_at FROM public.users WHERE id IN ('675d39a2-d1fa-4d4a-8a94-47c28e92b2ff', '5c090dbf-4839-43af-8dc0-62c5f583dd15');

SELECT 'Foreign key constraint:' as info;
SELECT 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'leagues'
  AND tc.constraint_name = 'leagues_created_by_fkey';

SELECT 'Trigger created:' as info;
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
