-- Check the constraints on tournament_matches table
-- Run this in your Supabase SQL editor

-- Check table constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.tournament_matches'::regclass;

-- Check what status values are allowed
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'tournament_matches'
AND table_schema = 'public'
AND column_name = 'status';
