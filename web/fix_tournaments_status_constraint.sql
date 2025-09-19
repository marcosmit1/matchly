-- Fix tournaments status constraint to allow 'playoffs' status
-- Run this in your Supabase SQL editor

-- First, let's check the current constraint
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.tournaments'::regclass
AND conname LIKE '%status%';

-- Drop the existing status check constraint
ALTER TABLE public.tournaments 
DROP CONSTRAINT IF EXISTS tournaments_status_check;

-- Add the new constraint that includes 'playoffs'
ALTER TABLE public.tournaments 
ADD CONSTRAINT tournaments_status_check 
CHECK (status IN ('open', 'started', 'playoffs', 'completed', 'cancelled'));

-- Verify the constraint was updated
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.tournaments'::regclass
AND conname = 'tournaments_status_check';

SELECT 'Tournaments status constraint updated to include playoffs' as status;
