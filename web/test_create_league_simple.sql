-- Simple test to create a league manually
-- Run this in your Supabase SQL editor

-- First, let's see what user you're logged in as
SELECT auth.uid() as current_user_id;

-- Then create a simple test league
INSERT INTO leagues (
    name, 
    description, 
    sport, 
    max_players, 
    invite_code, 
    invite_link, 
    created_by
) VALUES (
    'Test League', 
    'Simple test league', 
    'squash', 
    8, 
    'test123', 
    'https://tournamator.app/join/test123', 
    auth.uid()
) RETURNING id, name, invite_code;
