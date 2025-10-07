-- Fix Tournament Matches Schema
-- Run this in your Supabase SQL editor to add missing columns

-- Add updated_at column to tournament_matches if it doesn't exist
ALTER TABLE public.tournament_matches 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add any missing score columns
ALTER TABLE public.tournament_matches 
ADD COLUMN IF NOT EXISTS player1_score INTEGER DEFAULT 0;

ALTER TABLE public.tournament_matches 
ADD COLUMN IF NOT EXISTS player2_score INTEGER DEFAULT 0;

ALTER TABLE public.tournament_matches 
ADD COLUMN IF NOT EXISTS player3_score INTEGER DEFAULT 0;

ALTER TABLE public.tournament_matches 
ADD COLUMN IF NOT EXISTS player4_score INTEGER DEFAULT 0;

-- Check the current schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'tournament_matches' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Tournament matches schema updated successfully' as status;
