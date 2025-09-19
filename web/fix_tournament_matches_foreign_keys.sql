-- Fix tournament_matches table to have proper foreign key relationships
-- Run this in your Supabase SQL editor

-- First, let's check the current structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tournament_matches'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add foreign key constraints to tournament_matches table
-- This will allow the UI to fetch player names properly

-- Add foreign key for player1_id
ALTER TABLE public.tournament_matches 
ADD CONSTRAINT fk_tournament_matches_player1 
FOREIGN KEY (player1_id) REFERENCES public.tournament_players(id) ON DELETE CASCADE;

-- Add foreign key for player2_id
ALTER TABLE public.tournament_matches 
ADD CONSTRAINT fk_tournament_matches_player2 
FOREIGN KEY (player2_id) REFERENCES public.tournament_players(id) ON DELETE CASCADE;

-- Add foreign key for player3_id
ALTER TABLE public.tournament_matches 
ADD CONSTRAINT fk_tournament_matches_player3 
FOREIGN KEY (player3_id) REFERENCES public.tournament_players(id) ON DELETE CASCADE;

-- Add foreign key for player4_id
ALTER TABLE public.tournament_matches 
ADD CONSTRAINT fk_tournament_matches_player4 
FOREIGN KEY (player4_id) REFERENCES public.tournament_players(id) ON DELETE CASCADE;

-- Test the foreign key relationships
SELECT 'Foreign key constraints added successfully' as status;
