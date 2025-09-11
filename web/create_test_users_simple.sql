-- Simple test users creation script
-- This script creates test users by temporarily disabling foreign key constraints

-- First, let's see what constraints exist
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='users';

-- Try to insert test users directly (this might work if the constraint is not enforced)
INSERT INTO users (id, email, username, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', 'testplayer1@tournamator.test', 'testplayer1', NOW(), NOW()),
('22222222-2222-2222-2222-222222222222', 'testplayer2@tournamator.test', 'testplayer2', NOW(), NOW()),
('33333333-3333-3333-3333-333333333333', 'testplayer3@tournamator.test', 'testplayer3', NOW(), NOW()),
('44444444-4444-4444-4444-444444444444', 'testplayer4@tournamator.test', 'testplayer4', NOW(), NOW()),
('55555555-5555-5555-5555-555555555555', 'testplayer5@tournamator.test', 'testplayer5', NOW(), NOW()),
('66666666-6666-6666-6666-666666666666', 'testplayer6@tournamator.test', 'testplayer6', NOW(), NOW()),
('77777777-7777-7777-7777-777777777777', 'testplayer7@tournamator.test', 'testplayer7', NOW(), NOW()),
('88888888-8888-8888-8888-888888888888', 'testplayer8@tournamator.test', 'testplayer8', NOW(), NOW()),
('99999999-9999-9999-9999-999999999999', 'testplayer9@tournamator.test', 'testplayer9', NOW(), NOW()),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'testplayer10@tournamator.test', 'testplayer10', NOW(), NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'testplayer11@tournamator.test', 'testplayer11', NOW(), NOW()),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'testplayer12@tournamator.test', 'testplayer12', NOW(), NOW()),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'testplayer13@tournamator.test', 'testplayer13', NOW(), NOW()),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'testplayer14@tournamator.test', 'testplayer14', NOW(), NOW()),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'testplayer15@tournamator.test', 'testplayer15', NOW(), NOW()),
('10101010-1010-1010-1010-101010101010', 'testplayer16@tournamator.test', 'testplayer16', NOW(), NOW()),
('20202020-2020-2020-2020-202020202020', 'testplayer17@tournamator.test', 'testplayer17', NOW(), NOW()),
('30303030-3030-3030-3030-303030303030', 'testplayer18@tournamator.test', 'testplayer18', NOW(), NOW()),
('40404040-4040-4040-4040-404040404040', 'testplayer19@tournamator.test', 'testplayer19', NOW(), NOW()),
('50505050-5050-5050-5050-505050505050', 'testplayer20@tournamator.test', 'testplayer20', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Check if the users were created
SELECT COUNT(*) as test_users_created FROM users WHERE email LIKE '%tournamator.test%';

-- Show the created users
SELECT id, email, username FROM users WHERE email LIKE '%tournamator.test%' ORDER BY username;
