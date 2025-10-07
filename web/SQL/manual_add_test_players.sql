-- Manually add test players to the Championship Box
-- Run this in your Supabase SQL editor

-- First, let's see what box we're working with
SELECT id, name, level FROM league_boxes 
WHERE league_id = 'bc4db93f-b703-402f-9c4f-3e51135d5788' 
AND level = 1;

-- Add 3 test users
INSERT INTO users (id, email, username, created_at, updated_at) VALUES
(gen_random_uuid(), 'testplayer1@test.com', 'TestPlayer1', NOW(), NOW()),
(gen_random_uuid(), 'testplayer2@test.com', 'TestPlayer2', NOW(), NOW()),
(gen_random_uuid(), 'testplayer3@test.com', 'TestPlayer3', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Get the Championship Box ID
WITH championship_box AS (
  SELECT id FROM league_boxes 
  WHERE league_id = 'bc4db93f-b703-402f-9c4f-3e51135d5788' 
  AND level = 1
)
-- Add test users as league participants
INSERT INTO league_participants (league_id, user_id, status, joined_at)
SELECT 
  'bc4db93f-b703-402f-9c4f-3e51135d5788',
  u.id,
  'confirmed',
  NOW()
FROM users u
WHERE u.username IN ('TestPlayer1', 'TestPlayer2', 'TestPlayer3')
ON CONFLICT (league_id, user_id) DO NOTHING;

-- Get the Championship Box ID and add test users to it
WITH championship_box AS (
  SELECT id FROM league_boxes 
  WHERE league_id = 'bc4db93f-b703-402f-9c4f-3e51135d5788' 
  AND level = 1
)
-- Assign test users to Championship Box
INSERT INTO league_box_assignments (league_id, box_id, user_id, assigned_at)
SELECT 
  'bc4db93f-b703-402f-9c4f-3e51135d5788',
  cb.id,
  u.id,
  NOW()
FROM championship_box cb
CROSS JOIN users u
WHERE u.username IN ('TestPlayer1', 'TestPlayer2', 'TestPlayer3')
ON CONFLICT (box_id, user_id) DO NOTHING;

-- Verify the results
SELECT 
  'Boxes' as table_name,
  COUNT(*) as count
FROM league_boxes 
WHERE league_id = 'bc4db93f-b703-402f-9c4f-3e51135d5788'

UNION ALL

SELECT 
  'Participants' as table_name,
  COUNT(*) as count
FROM league_participants 
WHERE league_id = 'bc4db93f-b703-402f-9c4f-3e51135d5788'

UNION ALL

SELECT 
  'Box Assignments' as table_name,
  COUNT(*) as count
FROM league_box_assignments 
WHERE league_id = 'bc4db93f-b703-402f-9c4f-3e51135d5788'

UNION ALL

SELECT 
  'Test Users' as table_name,
  COUNT(*) as count
FROM users 
WHERE username IN ('TestPlayer1', 'TestPlayer2', 'TestPlayer3');
