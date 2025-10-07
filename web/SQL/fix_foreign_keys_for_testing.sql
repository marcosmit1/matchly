-- Fix Foreign Key Constraints for Testing
-- Run this in your Supabase SQL editor to allow test data creation

-- Option 1: Temporarily disable foreign key constraints for testing
-- (This is safer than dropping them completely)

-- First, let's check what constraints exist
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'league_matches'
    AND kcu.column_name IN ('player1_id', 'player2_id');

-- Option 2: Create a test-specific version of the table without foreign key constraints
-- This is safer for testing

-- Create a test version of league_matches without foreign key constraints
CREATE TABLE IF NOT EXISTS league_matches_test (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    league_id UUID NOT NULL,
    box_id UUID NOT NULL,
    player1_id UUID NOT NULL,
    player2_id UUID NOT NULL,
    player1_username TEXT NOT NULL,
    player2_username TEXT NOT NULL,
    player1_score INTEGER DEFAULT NULL,
    player2_score INTEGER DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    played_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for the test table
CREATE INDEX IF NOT EXISTS idx_league_matches_test_league_id ON league_matches_test(league_id);
CREATE INDEX IF NOT EXISTS idx_league_matches_test_box_id ON league_matches_test(box_id);
CREATE INDEX IF NOT EXISTS idx_league_matches_test_player1_id ON league_matches_test(player1_id);
CREATE INDEX IF NOT EXISTS idx_league_matches_test_player2_id ON league_matches_test(player2_id);
CREATE INDEX IF NOT EXISTS idx_league_matches_test_status ON league_matches_test(status);
