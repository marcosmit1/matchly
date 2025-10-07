-- Setup test league with minimum required participants
-- This script creates the minimum 4 participants needed to start a league
-- Replace 'YOUR_LEAGUE_ID' with your actual league ID

-- First, let's see what participants currently exist
SELECT 
    lp.id,
    lp.league_id,
    lp.user_id,
    lp.status,
    u.email,
    u.username
FROM league_participants lp
LEFT JOIN users u ON lp.user_id = u.id
WHERE lp.league_id = 'YOUR_LEAGUE_ID';

-- Get the current user ID (you'll need to replace this with your actual user ID)
-- You can find your user ID by running: SELECT auth.uid();

-- Let's create 3 additional test participants using your user ID
-- We'll use a workaround by temporarily disabling the unique constraint
-- or by using different user IDs that we create

-- Option 1: Create test users first (if you want real test users)
-- Run the create_test_users_bypass_rls.sql script first, then:

-- Add test users to the league
INSERT INTO league_participants (league_id, user_id, status, joined_at) VALUES
('YOUR_LEAGUE_ID', '11111111-1111-1111-1111-111111111111', 'confirmed', NOW()),
('YOUR_LEAGUE_ID', '22222222-2222-2222-2222-222222222222', 'confirmed', NOW()),
('YOUR_LEAGUE_ID', '33333333-3333-3333-3333-333333333333', 'confirmed', NOW())
ON CONFLICT (league_id, user_id) DO NOTHING;

-- Option 2: Simple approach - just update the league to have enough players
-- This bypasses the participant check in the start_league function
UPDATE leagues 
SET current_players = 20
WHERE id = 'YOUR_LEAGUE_ID';

-- Check the results
SELECT 
    l.name,
    l.current_players,
    COUNT(lp.id) as actual_participants
FROM leagues l
LEFT JOIN league_participants lp ON l.id = lp.league_id AND lp.status = 'confirmed'
WHERE l.id = 'YOUR_LEAGUE_ID'
GROUP BY l.id, l.name, l.current_players;
