-- Create a test golf tournament
INSERT INTO golf_tournaments (
  id,
  name,
  description,
  course_name,
  course_par,
  holes_count,
  format,
  status,
  created_by,
  location,
  max_players,
  current_players,
  invite_code,
  handicap_enabled,
  side_bets_enabled
) VALUES (
  'a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6',
  'Test Tournament',
  'Tournament for testing fourball assignments',
  'Test Golf Club',
  72,
  18,
  'stroke_play',
  'setup',
  '675d39a2-d1fa-4d4a-8a94-47c28e92b2ff', -- Replace with your user ID if different
  'Test Location',
  8,
  8,
  'TEST1',
  false,
  true
);

-- Create 18 holes
INSERT INTO golf_holes (
  tournament_id,
  hole_number,
  par,
  has_closest_to_pin,
  has_longest_drive
)
SELECT 
  'a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6',
  generate_series,
  CASE 
    WHEN generate_series IN (3, 7, 12, 16) THEN 3
    WHEN generate_series IN (4, 8, 13, 17) THEN 5
    ELSE 4
  END,
  generate_series IN (3, 12, 16),
  generate_series IN (4, 8, 13)
FROM generate_series(1, 18);

-- Add 8 test players
INSERT INTO golf_tournament_participants (
  id,
  tournament_id,
  user_id,
  player_name,
  handicap,
  status,
  is_guest
) VALUES
  ('11111111-1111-1111-1111-111111111111', 'a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6', '675d39a2-d1fa-4d4a-8a94-47c28e92b2ff', 'Player 1', 0, 'active', false),
  ('22222222-2222-2222-2222-222222222222', 'a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6', NULL, 'Player 2', 0, 'active', true),
  ('33333333-3333-3333-3333-333333333333', 'a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6', NULL, 'Player 3', 0, 'active', true),
  ('44444444-4444-4444-4444-444444444444', 'a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6', NULL, 'Player 4', 0, 'active', true),
  ('55555555-5555-5555-5555-555555555555', 'a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6', NULL, 'Player 5', 0, 'active', true),
  ('66666666-6666-6666-6666-666666666666', 'a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6', NULL, 'Player 6', 0, 'active', true),
  ('77777777-7777-7777-7777-777777777777', 'a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6', NULL, 'Player 7', 0, 'active', true),
  ('88888888-8888-8888-8888-888888888888', 'a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6', NULL, 'Player 8', 0, 'active', true);

-- To clean up (if needed):
-- DELETE FROM golf_tournament_participants WHERE tournament_id = 'a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6';
-- DELETE FROM golf_holes WHERE tournament_id = 'a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6';
-- DELETE FROM golf_tournaments WHERE id = 'a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6';