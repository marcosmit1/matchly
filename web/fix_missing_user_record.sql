-- Fix missing user record for the second participant
-- Run this in your Supabase SQL editor

-- First, let's check what users are missing
SELECT 
    'Missing users in public.users table:' as info;

-- Check which participants don't have user records
SELECT 
    lp.user_id,
    lp.status,
    u.username,
    u.email,
    CASE 
        WHEN u.id IS NULL THEN 'MISSING - NEEDS TO BE CREATED'
        ELSE 'EXISTS'
    END as status
FROM league_participants lp
LEFT JOIN users u ON lp.user_id = u.id
WHERE u.id IS NULL;

-- Create the missing user record
-- We need to get the email from auth.users first
INSERT INTO public.users (id, email, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    au.created_at,
    au.updated_at
FROM auth.users au
WHERE au.id = '5c090dbf-4839-43af-8dc0-62c5f583dd15'
AND NOT EXISTS (
    SELECT 1 FROM public.users pu WHERE pu.id = au.id
);

-- Verify the user was created
SELECT 
    'User created successfully:' as info;
SELECT id, email, username, created_at FROM public.users WHERE id = '5c090dbf-4839-43af-8dc0-62c5f583dd15';

-- Check all participants now have user records
SELECT 
    'All participants now have user records:' as info;
SELECT 
    lp.user_id,
    lp.status,
    u.username,
    u.email,
    CASE 
        WHEN u.id IS NULL THEN 'STILL MISSING'
        ELSE 'EXISTS'
    END as status
FROM league_participants lp
LEFT JOIN users u ON lp.user_id = u.id
ORDER BY lp.joined_at;
