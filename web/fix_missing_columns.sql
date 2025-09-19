-- Fix Missing Columns for Integration Tests
-- Run this in your Supabase SQL editor to add the missing columns

-- Add missing columns to league_boxes table
ALTER TABLE public.league_boxes 
ADD COLUMN IF NOT EXISTS current_players INTEGER DEFAULT 0 CHECK (current_players >= 0);

-- Add missing columns to leagues table  
ALTER TABLE public.leagues 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;

-- Update the league_boxes table to use the correct column names
-- The integration test expects 'level' but some schemas use 'box_level'
-- Let's make sure we have the right structure
ALTER TABLE public.league_boxes 
ADD COLUMN IF NOT EXISTS level INTEGER;

-- If box_level exists but level doesn't, copy the data
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'league_boxes' AND column_name = 'box_level') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'league_boxes' AND column_name = 'level') THEN
        ALTER TABLE public.league_boxes ADD COLUMN level INTEGER;
        UPDATE public.league_boxes SET level = box_level WHERE level IS NULL;
    END IF;
END $$;

-- Also ensure we have the 'name' column (some schemas use 'box_name')
ALTER TABLE public.league_boxes 
ADD COLUMN IF NOT EXISTS name TEXT;

-- If box_name exists but name doesn't, copy the data
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'league_boxes' AND column_name = 'box_name') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'league_boxes' AND column_name = 'name') THEN
        ALTER TABLE public.league_boxes ADD COLUMN name TEXT;
        UPDATE public.league_boxes SET name = box_name WHERE name IS NULL;
    END IF;
END $$;

-- Verify the columns exist
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('leagues', 'league_boxes') 
  AND column_name IN ('started_at', 'current_players', 'level', 'name')
ORDER BY table_name, column_name;
