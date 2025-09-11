-- Simple fix: Just add more players to the existing Championship Box
-- Run this in your Supabase SQL editor

-- First, let's see what we have
SELECT 'Current state:' as info;
SELECT COUNT(*) as box_assignments FROM league_box_assignments WHERE league_id = 'bc4db93f-b703-402f-9c4f-3e51135d5788';

-- Get the Championship Box ID
SELECT id as championship_box_id FROM league_boxes 
WHERE league_id = 'bc4db93f-b703-402f-9c4f-3e51135d5788' 
AND level = 1;

-- Create test users with specific UUIDs to avoid conflicts
-- First, let's try to create them without the ON CONFLICT clause
INSERT INTO users (id, email, username, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', 'test1@test.com', 'TestPlayer1', NOW(), NOW()),
('22222222-2222-2222-2222-222222222222', 'test2@test.com', 'TestPlayer2', NOW(), NOW()),
('33333333-3333-3333-3333-333333333333', 'test3@test.com', 'TestPlayer3', NOW(), NOW());

-- Check if users were created
SELECT 'Users created:' as info;
SELECT id, username, email FROM users WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333');

-- Add them as league participants
INSERT INTO league_participants (league_id, user_id, status, joined_at) VALUES
('bc4db93f-b703-402f-9c4f-3e51135d5788', '11111111-1111-1111-1111-111111111111', 'confirmed', NOW()),
('bc4db93f-b703-402f-9c4f-3e51135d5788', '22222222-2222-2222-2222-222222222222', 'confirmed', NOW()),
('bc4db93f-b703-402f-9c4f-3e51135d5788', '33333333-3333-3333-3333-333333333333', 'confirmed', NOW())
ON CONFLICT (league_id, user_id) DO NOTHING;

-- Assign them to the Championship Box
INSERT INTO league_box_assignments (league_id, box_id, user_id, assigned_at) VALUES
('bc4db93f-b703-402f-9c4f-3e51135d5788', 'f9ba5d0e-5eea-4bfa-9ee7-d7d2e1adff81', '11111111-1111-1111-1111-111111111111', NOW()),
('bc4db93f-b703-402f-9c4f-3e51135d5788', 'f9ba5d0e-5eea-4bfa-9ee7-d7d2e1adff81', '22222222-2222-2222-2222-222222222222', NOW()),
('bc4db93f-b703-402f-9c4f-3e51135d5788', 'f9ba5d0e-5eea-4bfa-9ee7-d7d2e1adff81', '33333333-3333-3333-3333-333333333333', NOW())
ON CONFLICT (box_id, user_id) DO NOTHING;

-- Verify the results
SELECT 'After adding test players:' as info;
SELECT COUNT(*) as total_assignments FROM league_box_assignments WHERE league_id = 'bc4db93f-b703-402f-9c4f-3e51135d5788';
SELECT COUNT(*) as championship_assignments FROM league_box_assignments WHERE box_id = 'f9ba5d0e-5eea-4bfa-9ee7-d7d2e1adff81';
SELECT COUNT(*) as total_participants FROM league_participants WHERE league_id = 'bc4db93f-b703-402f-9c4f-3e51135d5788';
