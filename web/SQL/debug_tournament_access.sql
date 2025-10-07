-- Debug Tournament Access - Temporary Open Access
-- Run this in your Supabase SQL editor

-- Temporarily disable RLS for tournaments to debug
ALTER TABLE public.tournaments DISABLE ROW LEVEL SECURITY;

-- Check what tournaments exist
SELECT 
    id,
    name,
    status,
    created_by,
    created_at
FROM public.tournaments
ORDER BY created_at DESC;

-- Re-enable RLS with open policy
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Public can view open tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Users can view tournaments they created or participate in" ON public.tournaments;

-- Create completely open policy for debugging
CREATE POLICY "Debug: Anyone can view tournaments" ON public.tournaments
    FOR SELECT USING (true);

-- Test
SELECT 'Debug access enabled' as status;
