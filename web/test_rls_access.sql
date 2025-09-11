-- Test RLS access for different users
-- Run this in your Supabase SQL editor

-- First, let's see what leagues exist
SELECT 'All leagues in database:' as info;
SELECT id, name, status, created_by FROM leagues ORDER BY created_at DESC;

-- Test if we can see leagues (this should work for any authenticated user)
SELECT 'Leagues visible to current user:' as info;
SELECT id, name, status, created_by FROM leagues ORDER BY created_at DESC;

-- Test if we can see league participants
SELECT 'League participants visible to current user:' as info;
SELECT lp.league_id, lp.user_id, lp.status, l.name as league_name
FROM league_participants lp
JOIN leagues l ON lp.league_id = l.id
ORDER BY lp.league_id;

-- Test if we can see users (this might be restricted)
SELECT 'Users visible to current user:' as info;
SELECT id, username, email FROM users LIMIT 5;

-- Check current user
SELECT 'Current authenticated user:' as info;
SELECT auth.uid() as current_user_id;
