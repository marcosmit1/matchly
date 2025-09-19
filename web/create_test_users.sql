-- Create test users for matchly
-- This script creates test users that can be used for testing leagues
-- Run this in your Supabase SQL editor

-- First, let's check what columns exist in the users table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Insert test users with proper structure (using only the columns that exist)
INSERT INTO users (id, email, username, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', 'testplayer1@matchly.test', 'testplayer1', NOW(), NOW()),
('22222222-2222-2222-2222-222222222222', 'testplayer2@matchly.test', 'testplayer2', NOW(), NOW()),
('33333333-3333-3333-3333-333333333333', 'testplayer3@matchly.test', 'testplayer3', NOW(), NOW()),
('44444444-4444-4444-4444-444444444444', 'testplayer4@matchly.test', 'testplayer4', NOW(), NOW()),
('55555555-5555-5555-5555-555555555555', 'testplayer5@matchly.test', 'testplayer5', NOW(), NOW()),
('66666666-6666-6666-6666-666666666666', 'testplayer6@matchly.test', 'testplayer6', NOW(), NOW()),
('77777777-7777-7777-7777-777777777777', 'testplayer7@matchly.test', 'testplayer7', NOW(), NOW()),
('88888888-8888-8888-8888-888888888888', 'testplayer8@matchly.test', 'testplayer8', NOW(), NOW()),
('99999999-9999-9999-9999-999999999999', 'testplayer9@matchly.test', 'testplayer9', NOW(), NOW()),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'testplayer10@matchly.test', 'testplayer10', NOW(), NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'testplayer11@matchly.test', 'testplayer11', NOW(), NOW()),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'testplayer12@matchly.test', 'testplayer12', NOW(), NOW()),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'testplayer13@matchly.test', 'testplayer13', NOW(), NOW()),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'testplayer14@matchly.test', 'testplayer14', NOW(), NOW()),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'testplayer15@matchly.test', 'testplayer15', NOW(), NOW()),
('10101010-1010-1010-1010-101010101010', 'testplayer16@matchly.test', 'testplayer16', NOW(), NOW()),
('20202020-2020-2020-2020-202020202020', 'testplayer17@matchly.test', 'testplayer17', NOW(), NOW()),
('30303030-3030-3030-3030-303030303030', 'testplayer18@matchly.test', 'testplayer18', NOW(), NOW()),
('40404040-4040-4040-4040-404040404040', 'testplayer19@matchly.test', 'testplayer19', NOW(), NOW()),
('50505050-5050-5050-5050-505050505050', 'testplayer20@matchly.test', 'testplayer20', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Show the created users
SELECT id, email, username FROM users WHERE email LIKE '%matchly.test%' ORDER BY username;
