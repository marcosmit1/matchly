-- Utility functions needed for the squash tournament app
-- Run this script FIRST before running the main migration

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create player game statistics (placeholder)
CREATE OR REPLACE FUNCTION public.create_player_game_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- This function can be customized to create player statistics
  -- For now, it's a placeholder that does nothing
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
