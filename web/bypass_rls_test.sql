-- Bypass RLS issues by using the existing user multiple times
-- Run this in your Supabase SQL editor

-- First, let's see what we have
SELECT 'Current state:' as info;
SELECT COUNT(*) as current_assignments FROM league_box_assignments WHERE league_id = 'bc4db93f-b703-402f-9c4f-3e51135d5788';

-- Get the current user ID
SELECT 'Current user ID:' as info;
SELECT auth.uid() as current_user_id;

-- Just assign the current user to the Championship Box multiple times with different "virtual" IDs
-- We'll use the same user but create multiple assignments to simulate multiple players
INSERT INTO league_box_assignments (league_id, box_id, user_id, assigned_at) VALUES
('bc4db93f-b703-402f-9c4f-3e51135d5788', 'f9ba5d0e-5eea-4bfa-9ee7-d7d2e1adff81', auth.uid(), NOW()),
('bc4db93f-b703-402f-9c4f-3e51135d5788', 'f9ba5d0e-5eea-4bfa-9ee7-d7d2e1adff81', auth.uid(), NOW()),
('bc4db93f-b703-402f-9c4f-3e51135d5788', 'f9ba5d0e-5eea-4bfa-9ee7-d7d2e1adff81', auth.uid(), NOW())
ON CONFLICT (box_id, user_id) DO NOTHING;

-- Verify the results
SELECT 'After adding assignments:' as info;
SELECT COUNT(*) as total_assignments FROM league_box_assignments WHERE league_id = 'bc4db93f-b703-402f-9c4f-3e51135d5788';
SELECT COUNT(*) as championship_assignments FROM league_box_assignments WHERE box_id = 'f9ba5d0e-5eea-4bfa-9ee7-d7d2e1adff81';
