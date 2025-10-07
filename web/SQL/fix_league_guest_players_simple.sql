-- Fix league guest player system to follow tournament pattern (name only)
-- Run this in your Supabase SQL editor

-- Create OR replace the add_guest_player_to_league function to match tournament logic
CREATE OR REPLACE FUNCTION public.add_guest_player_to_league(
    p_league_id UUID,
    p_name VARCHAR(100),
    p_email VARCHAR(255) DEFAULT NULL,
    p_phone VARCHAR(20) DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_guest_id UUID;
    v_league RECORD;
BEGIN
    -- Get current user
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;

    -- Check if user can add guests to this league
    SELECT * INTO v_league FROM public.leagues WHERE id = p_league_id;

    IF v_league IS NULL THEN
        RAISE EXCEPTION 'League not found';
    END IF;

    IF v_league.created_by != auth.uid() THEN
        RAISE EXCEPTION 'Only league creator can add guest players';
    END IF;

    -- Check if league is still open for participants
    IF v_league.status != 'open' THEN
        RAISE EXCEPTION 'Cannot add participants to a league that is not open';
    END IF;

    -- Check if league has space for more players
    IF v_league.current_players >= v_league.max_players THEN
        RAISE EXCEPTION 'League is full';
    END IF;

    -- Create guest player (simplified - just store league_id and name)
    INSERT INTO public.guest_players (league_id, name, created_by)
    VALUES (p_league_id, p_name, auth.uid())
    RETURNING id INTO v_guest_id;

    -- Add guest player as participant following tournament pattern
    INSERT INTO public.league_participants (league_id, guest_player_id, user_id)
    VALUES (p_league_id, v_guest_id, NULL);

    -- Update league player count
    UPDATE public.leagues
    SET current_players = current_players + 1
    WHERE id = p_league_id;

    RETURN json_build_object(
        'success', true,
        'guest_player_id', v_guest_id,
        'message', 'Guest player added successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;