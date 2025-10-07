-- Reset all player stats to 0 for testing the new individual shot tracking
-- Run this in Supabase SQL editor

BEGIN;

-- Reset all individual game stats
UPDATE public.player_game_stats 
SET 
  shots_attempted = 0,
  shots_made = 0,
  cups_hit = 0,
  catches = 0,
  redemption_shots = 0,
  final_score = 0,
  updated_at = timezone('utc'::text, now())
WHERE shots_attempted > 0 OR shots_made > 0 OR cups_hit > 0 OR catches > 0;

-- Reset all aggregated stats
UPDATE public.player_stats 
SET 
  games_played = 0,
  games_won = 0,
  shots_attempted = 0,
  shots_made = 0,
  cups_hit = 0,
  catches = 0,
  redemption_shots = 0,
  total_final_score = 0,
  last_game_at = NULL,
  updated_at = timezone('utc'::text, now())
WHERE games_played > 0 OR shots_attempted > 0 OR shots_made > 0;

-- Verify the reset
SELECT 
  'player_game_stats' as table_name,
  COUNT(*) as total_records,
  SUM(shots_attempted) as total_shots_attempted,
  SUM(shots_made) as total_shots_made,
  SUM(cups_hit) as total_cups_hit
FROM public.player_game_stats

UNION ALL

SELECT 
  'player_stats' as table_name,
  COUNT(*) as total_records,
  SUM(shots_attempted) as total_shots_attempted,
  SUM(shots_made) as total_shots_made,
  SUM(cups_hit) as total_cups_hit
FROM public.player_stats;

COMMIT;

-- Show message
SELECT 'All player stats have been reset to 0 ✅' as status;
