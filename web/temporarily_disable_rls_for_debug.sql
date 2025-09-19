-- Temporarily disable RLS for debugging tournament data access
-- Run this in your Supabase SQL editor

-- Disable RLS temporarily for debugging
ALTER TABLE tournament_players DISABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_rounds DISABLE ROW LEVEL SECURITY;

-- Check if data is now accessible
SELECT 'tournament_players' as table_name, COUNT(*) as count FROM tournament_players WHERE tournament_id = '05138795-471e-4680-8ad8-33f87a029f5c'
UNION ALL
SELECT 'tournament_matches' as table_name, COUNT(*) as count FROM tournament_matches WHERE tournament_id = '05138795-471e-4680-8ad8-33f87a029f5c'
UNION ALL
SELECT 'tournament_rounds' as table_name, COUNT(*) as count FROM tournament_rounds WHERE tournament_id = '05138795-471e-4680-8ad8-33f87a029f5c';

-- Re-enable RLS after debugging
-- ALTER TABLE tournament_players ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tournament_rounds ENABLE ROW LEVEL SECURITY;
