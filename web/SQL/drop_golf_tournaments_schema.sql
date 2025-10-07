-- Drop Golf Tournament Schema (UNDO)
-- Run this to remove all golf tournament tables and related objects

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS public.golf_activity_feed CASCADE;
DROP TABLE IF EXISTS public.golf_hole_challenges CASCADE;
DROP TABLE IF EXISTS public.golf_fines CASCADE;
DROP TABLE IF EXISTS public.golf_penalties CASCADE;
DROP TABLE IF EXISTS public.golf_scores CASCADE;
DROP TABLE IF EXISTS public.golf_holes CASCADE;
DROP TABLE IF EXISTS public.golf_tournament_participants CASCADE;
DROP TABLE IF EXISTS public.golf_tournaments CASCADE;

-- Drop any custom types that were created
DROP TYPE IF EXISTS golf_tournament_status CASCADE;
DROP TYPE IF EXISTS golf_tournament_format CASCADE;
DROP TYPE IF EXISTS golf_penalty_type CASCADE;
DROP TYPE IF EXISTS golf_fine_status CASCADE;
DROP TYPE IF EXISTS golf_activity_type CASCADE;

-- Drop any functions that were created
DROP FUNCTION IF EXISTS public.calculate_golf_total_score(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.calculate_golf_vs_par(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_golf_leaderboard(UUID) CASCADE;

-- Note: This will remove all golf tournament data permanently
-- Make sure you're running this in the CORRECT Supabase project
