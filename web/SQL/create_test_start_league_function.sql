-- Create a test version of the start_league function that works with simulated players
-- This function will start a league even with simulated player counts

CREATE OR REPLACE FUNCTION public.start_league_test(p_league_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_id UUID;
    participant_count INTEGER;
    current_players_count INTEGER;
    min_players INTEGER := 4;
BEGIN
    -- Get current user
    user_id := auth.uid();
    
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;
    
    -- Check if user is the league creator
    IF NOT EXISTS (
        SELECT 1 FROM public.leagues 
        WHERE id = p_league_id AND created_by = user_id
    ) THEN
        RAISE EXCEPTION 'Only the league creator can start the league';
    END IF;
    
    -- Check if league exists and is in 'open' status
    IF NOT EXISTS (
        SELECT 1 FROM public.leagues 
        WHERE id = p_league_id AND status = 'open'
    ) THEN
        RAISE EXCEPTION 'League not found or not in open status';
    END IF;
    
    -- Get the current_players count from the leagues table (our simulation)
    SELECT current_players INTO current_players_count
    FROM public.leagues 
    WHERE id = p_league_id;
    
    -- Use the simulated player count instead of actual participants
    IF current_players_count < min_players THEN
        RAISE EXCEPTION 'League needs at least % players to start (currently has % simulated players)', min_players, current_players_count;
    END IF;
    
    -- Update league status
    UPDATE public.leagues 
    SET status = 'started', started_at = timezone('utc'::text, now())
    WHERE id = p_league_id;
    
    -- TODO: Generate tournament bracket and matches
    -- This will be implemented in the next phase
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
