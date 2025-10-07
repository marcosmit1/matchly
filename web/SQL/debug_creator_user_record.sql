-- Debug script to check if league creators have proper user records
-- Run this in your Supabase SQL editor

-- Check all leagues and their creators
SELECT 
    l.id as league_id,
    l.name as league_name,
    l.created_by as creator_id,
    u.username as creator_username,
    u.email as creator_email,
    CASE 
        WHEN u.id IS NULL THEN 'MISSING USER RECORD'
        WHEN u.username IS NULL THEN 'MISSING USERNAME'
        ELSE 'OK'
    END as status
FROM leagues l
LEFT JOIN users u ON l.created_by = u.id
ORDER BY l.created_at DESC;

-- Check participants and their user records
SELECT 
    lp.league_id,
    l.name as league_name,
    lp.user_id,
    u.username,
    u.email,
    lp.status as participant_status,
    CASE 
        WHEN u.id IS NULL THEN 'MISSING USER RECORD'
        WHEN u.username IS NULL THEN 'MISSING USERNAME'
        ELSE 'OK'
    END as user_status
FROM league_participants lp
JOIN leagues l ON lp.league_id = l.id
LEFT JOIN users u ON lp.user_id = u.id
ORDER BY l.created_at DESC, lp.joined_at;

-- Check if there are any users without usernames
SELECT 
    id,
    email,
    username,
    created_at
FROM users 
WHERE username IS NULL OR username = ''
ORDER BY created_at DESC;
