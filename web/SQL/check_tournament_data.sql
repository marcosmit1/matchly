-- Check what tournaments exist in the database
-- Run this in your Supabase SQL editor

-- Check all tournaments (bypassing RLS)
SELECT 
    id,
    name,
    status,
    created_by,
    created_at
FROM public.tournaments
ORDER BY created_at DESC;

-- Check current user
SELECT auth.uid() as current_user_id;

-- Check if any tournaments are public/open
SELECT 
    id,
    name,
    status,
    created_by
FROM public.tournaments
WHERE status = 'open';
