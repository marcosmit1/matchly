-- Debug script to check what's in the leagues table
-- Run this in your Supabase SQL editor to see what leagues exist

SELECT 
    id,
    name,
    status,
    created_by,
    created_at
FROM leagues 
ORDER BY created_at DESC 
LIMIT 5;
