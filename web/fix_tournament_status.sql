-- Fix Tournament Status to Make it Public
-- Run this in your Supabase SQL editor

-- Check current tournament status
SELECT 
    id,
    name,
    status,
    created_by,
    created_at
FROM public.tournaments
ORDER BY created_at DESC;

-- Update the most recent tournament to 'open' status
UPDATE public.tournaments
SET status = 'open'
WHERE id = (
    SELECT id
    FROM public.tournaments
    ORDER BY created_at DESC
    LIMIT 1
);

-- Verify the update
SELECT 
    id,
    name,
    status,
    created_by
FROM public.tournaments
WHERE status = 'open';
