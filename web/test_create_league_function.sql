-- Test the create_league function directly
-- Run this in your Supabase SQL editor to test the function

-- Test with basic parameters
SELECT create_league(
    'Test League',
    'A test league description',
    'squash',
    8,
    '2024-01-01'::date,
    'Test Location',
    0,
    0,
    NULL,
    NULL,
    NULL
);

-- Check if the leagues table has the required columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'leagues'
  AND table_schema = 'public'
ORDER BY ordinal_position;