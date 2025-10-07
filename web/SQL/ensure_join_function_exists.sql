-- Ensure the join_league_by_code function exists
-- Run this in your Supabase SQL editor

-- Drop existing function if it exists (to avoid conflicts)
DROP FUNCTION IF EXISTS public.join_league_by_code(VARCHAR(8));
DROP FUNCTION IF EXISTS public.join_league_by_invite(TEXT);

-- Create the join_league_by_code function
CREATE OR REPLACE FUNCTION public.join_league_by_code(p_invite_code VARCHAR(8))
RETURNS UUID AS $$
DECLARE
    league_id UUID;
    user_id UUID;
    participant_count INTEGER;
    max_players INTEGER;
BEGIN
    -- Get current user
    user_id := auth.uid();
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;
    
    -- Find league by invite code
    SELECT id, max_players INTO league_id, max_players
    FROM public.leagues 
    WHERE invite_code = p_invite_code AND status IN ('open', 'full');
    
    IF league_id IS NULL THEN
        RAISE EXCEPTION 'Invalid or expired invite code';
    END IF;
    
    -- Check if user is already a participant
    IF EXISTS (SELECT 1 FROM public.league_participants WHERE league_id = league_id AND user_id = user_id) THEN
        RAISE EXCEPTION 'You are already a participant in this league';
    END IF;
    
    -- Check if league is full
    SELECT COUNT(*) INTO participant_count
    FROM public.league_participants 
    WHERE league_id = league_id AND status = 'confirmed';
    
    IF participant_count >= max_players THEN
        RAISE EXCEPTION 'League is full';
    END IF;
    
    -- Add user as participant
    INSERT INTO public.league_participants (league_id, user_id, status)
    VALUES (league_id, user_id, 'confirmed');
    
    -- Update league player count
    UPDATE public.leagues 
    SET current_players = current_players + 1
    WHERE id = league_id;
    
    RETURN league_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the function was created
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'join_league_by_code';
