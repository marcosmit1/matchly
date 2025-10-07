-- Create a test match directly in the database
-- Run this in your Supabase SQL editor

-- Insert a test match directly into league_matches
INSERT INTO league_matches (
    league_id,
    box_id,
    player1_id,
    player2_id,
    player1_username,
    player2_username,
    status,
    scheduled_at,
    created_at,
    updated_at
) VALUES (
    'bc4db93f-b703-402f-9c4f-3e51135d5788',
    'f9ba5d0e-5eea-4bfa-9ee7-d7d2e1adff81',
    '675d39a2-d1fa-4d4a-8a94-47c28e92b2ff',
    '675d39a2-d1fa-4d4a-8a94-47c28e92b2ff',
    'TestPlayer1',
    'TestPlayer2',
    'scheduled',
    NOW(),
    NOW(),
    NOW()
);

-- Verify the match was created
SELECT 'Match created:' as info;
SELECT COUNT(*) as total_matches FROM league_matches WHERE league_id = 'bc4db93f-b703-402f-9c4f-3e51135d5788';

-- Show the match details
SELECT 
    id,
    league_id,
    box_id,
    player1_username,
    player2_username,
    status,
    scheduled_at
FROM league_matches 
WHERE league_id = 'bc4db93f-b703-402f-9c4f-3e51135d5788';
