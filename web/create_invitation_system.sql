-- Create a proper invitation system for leagues
-- Run this in your Supabase SQL editor

-- Create a function to join a league by invite code
CREATE OR REPLACE FUNCTION join_league_by_invite(p_invite_code TEXT)
RETURNS JSON AS $$
DECLARE
    v_league RECORD;
    v_user_id UUID;
    v_existing_participant RECORD;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;

    -- Find league by invite code
    SELECT * INTO v_league FROM leagues 
    WHERE invite_code = p_invite_code AND status = 'open';

    IF v_league IS NULL THEN
        RAISE EXCEPTION 'Invalid invite code or league is not open';
    END IF;

    -- Check if user is already a participant
    SELECT * INTO v_existing_participant FROM league_participants
    WHERE league_id = v_league.id AND user_id = v_user_id;

    IF v_existing_participant IS NOT NULL THEN
        RAISE EXCEPTION 'You are already a participant in this league';
    END IF;

    -- Check if league is full
    IF v_league.current_players >= v_league.max_players THEN
        RAISE EXCEPTION 'League is full';
    END IF;

    -- Add user as participant
    INSERT INTO league_participants (league_id, user_id, status, joined_at)
    VALUES (v_league.id, v_user_id, 'confirmed', NOW());

    -- Update league player count
    UPDATE leagues 
    SET current_players = current_players + 1
    WHERE id = v_league.id;

    RETURN json_build_object(
        'message', 'Successfully joined league',
        'league_id', v_league.id,
        'league_name', v_league.name,
        'current_players', v_league.current_players + 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get league participants with usernames
CREATE OR REPLACE FUNCTION get_league_participants(p_league_id UUID)
RETURNS TABLE (
    user_id UUID,
    username TEXT,
    status TEXT,
    joined_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lp.user_id,
        COALESCE(u.username, 'Unknown User') as username,
        lp.status,
        lp.joined_at
    FROM league_participants lp
    LEFT JOIN users u ON lp.user_id = u.id
    WHERE lp.league_id = p_league_id
    ORDER BY lp.joined_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
