-- Check the actual structure of tournament_players table
-- Run this in your Supabase SQL editor to see what columns exist

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'tournament_players'
  AND table_schema = 'public'
ORDER BY ordinal_position;