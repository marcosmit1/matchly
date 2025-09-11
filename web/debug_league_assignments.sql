-- Debug script to check what's actually in the database
-- Run this in your Supabase SQL editor

-- Check league boxes
SELECT 
    id, 
    level, 
    name, 
    league_id 
FROM league_boxes 
WHERE league_id = 'bc4db93f-b703-402f-9c4f-3e51135d5788'
ORDER BY level;

-- Check box assignments
SELECT 
    box_id, 
    user_id, 
    league_id,
    assigned_at
FROM league_box_assignments 
WHERE league_id = 'bc4db93f-b703-402f-9c4f-3e51135d5788';

-- Check league participants
SELECT 
    user_id, 
    status, 
    joined_at
FROM league_participants 
WHERE league_id = 'bc4db93f-b703-402f-9c4f-3e51135d5788';

-- Check users table for test users
SELECT 
    id, 
    username, 
    email
FROM users 
WHERE username LIKE 'TestPlayer%' OR email LIKE 'testplayer%@test.com';
