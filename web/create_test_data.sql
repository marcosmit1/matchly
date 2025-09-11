-- Test Data Script for Tournamator
-- This script creates 20 test players and adds them to your league
-- Replace 'YOUR_LEAGUE_ID' with your actual league ID

-- First, let's create some test users (these will be fake users for testing)
-- Note: In a real scenario, you'd want to create actual user accounts
-- For testing purposes, we'll insert directly into the users table

-- Insert test users with proper UUIDs
INSERT INTO users (id, email, username, full_name, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', 'player1@test.com', 'player1', 'Alex Johnson', NOW(), NOW()),
('22222222-2222-2222-2222-222222222222', 'player2@test.com', 'player2', 'Sarah Williams', NOW(), NOW()),
('33333333-3333-3333-3333-333333333333', 'player3@test.com', 'player3', 'Mike Chen', NOW(), NOW()),
('44444444-4444-4444-4444-444444444444', 'player4@test.com', 'player4', 'Emma Davis', NOW(), NOW()),
('55555555-5555-5555-5555-555555555555', 'player5@test.com', 'player5', 'James Wilson', NOW(), NOW()),
('66666666-6666-6666-6666-666666666666', 'player6@test.com', 'player6', 'Lisa Brown', NOW(), NOW()),
('77777777-7777-7777-7777-777777777777', 'player7@test.com', 'player7', 'David Miller', NOW(), NOW()),
('88888888-8888-8888-8888-888888888888', 'player8@test.com', 'player8', 'Anna Garcia', NOW(), NOW()),
('99999999-9999-9999-9999-999999999999', 'player9@test.com', 'player9', 'Tom Anderson', NOW(), NOW()),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'player10@test.com', 'player10', 'Kate Taylor', NOW(), NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'player11@test.com', 'player11', 'Chris Martinez', NOW(), NOW()),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'player12@test.com', 'player12', 'Rachel Lee', NOW(), NOW()),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'player13@test.com', 'player13', 'Mark Thompson', NOW(), NOW()),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'player14@test.com', 'player14', 'Sophie White', NOW(), NOW()),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'player15@test.com', 'player15', 'Ben Harris', NOW(), NOW()),
('10101010-1010-1010-1010-101010101010', 'player16@test.com', 'player16', 'Olivia Clark', NOW(), NOW()),
('20202020-2020-2020-2020-202020202020', 'player17@test.com', 'player17', 'Ryan Lewis', NOW(), NOW()),
('30303030-3030-3030-3030-303030303030', 'player18@test.com', 'player18', 'Grace Walker', NOW(), NOW()),
('40404040-4040-4040-4040-404040404040', 'player19@test.com', 'player19', 'Jake Hall', NOW(), NOW()),
('50505050-5050-5050-5050-505050505050', 'player20@test.com', 'player20', 'Maya Young', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Now add these players to your league
-- Replace 'YOUR_LEAGUE_ID' with your actual league ID from the database
-- You can find your league ID by running: SELECT id, name FROM leagues ORDER BY created_at DESC LIMIT 1;

-- Example: If your league ID is '6c1c13db-3f83-47df-8e7f-39e4ac34380d', replace YOUR_LEAGUE_ID with that
INSERT INTO league_participants (league_id, user_id, joined_at, status) VALUES
('YOUR_LEAGUE_ID', '11111111-1111-1111-1111-111111111111', NOW(), 'active'),
('YOUR_LEAGUE_ID', '22222222-2222-2222-2222-222222222222', NOW(), 'active'),
('YOUR_LEAGUE_ID', '33333333-3333-3333-3333-333333333333', NOW(), 'active'),
('YOUR_LEAGUE_ID', '44444444-4444-4444-4444-444444444444', NOW(), 'active'),
('YOUR_LEAGUE_ID', '55555555-5555-5555-5555-555555555555', NOW(), 'active'),
('YOUR_LEAGUE_ID', '66666666-6666-6666-6666-666666666666', NOW(), 'active'),
('YOUR_LEAGUE_ID', '77777777-7777-7777-7777-777777777777', NOW(), 'active'),
('YOUR_LEAGUE_ID', '88888888-8888-8888-8888-888888888888', NOW(), 'active'),
('YOUR_LEAGUE_ID', '99999999-9999-9999-9999-999999999999', NOW(), 'active'),
('YOUR_LEAGUE_ID', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW(), 'active'),
('YOUR_LEAGUE_ID', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW(), 'active'),
('YOUR_LEAGUE_ID', 'cccccccc-cccc-cccc-cccc-cccccccccccc', NOW(), 'active'),
('YOUR_LEAGUE_ID', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NOW(), 'active'),
('YOUR_LEAGUE_ID', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', NOW(), 'active'),
('YOUR_LEAGUE_ID', 'ffffffff-ffff-ffff-ffff-ffffffffffff', NOW(), 'active'),
('YOUR_LEAGUE_ID', '10101010-1010-1010-1010-101010101010', NOW(), 'active'),
('YOUR_LEAGUE_ID', '20202020-2020-2020-2020-202020202020', NOW(), 'active'),
('YOUR_LEAGUE_ID', '30303030-3030-3030-3030-303030303030', NOW(), 'active'),
('YOUR_LEAGUE_ID', '40404040-4040-4040-4040-404040404040', NOW(), 'active'),
('YOUR_LEAGUE_ID', '50505050-5050-5050-5050-505050505050', NOW(), 'active')
ON CONFLICT (league_id, user_id) DO NOTHING;

-- Update the league's current_players count
UPDATE leagues 
SET current_players = (
  SELECT COUNT(*) 
  FROM league_participants 
  WHERE league_id = 'YOUR_LEAGUE_ID' AND status = 'active'
)
WHERE id = 'YOUR_LEAGUE_ID';

-- Show the results
SELECT 
  l.name as league_name,
  l.max_players,
  l.current_players,
  COUNT(lp.user_id) as actual_participants
FROM leagues l
LEFT JOIN league_participants lp ON l.id = lp.league_id AND lp.status = 'active'
WHERE l.id = 'YOUR_LEAGUE_ID'
GROUP BY l.id, l.name, l.max_players, l.current_players;
