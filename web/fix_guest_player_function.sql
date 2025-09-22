-- Fix the add_guest_player_to_tournament function to remove status column reference
-- Run this in your Supabase SQL editor
-- This only updates the function, not the tables or policies

CREATE OR REPLACE FUNCTION public.add_guest_player_to_tournament(
    p_tournament_id UUID,
    p_name VARCHAR(100),
    p_email VARCHAR(255) DEFAULT NULL,
    p_phone VARCHAR(20) DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_guest_id UUID;
    v_tournament RECORD;
BEGIN
    -- Get current user
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;

    -- Check if user can add guests to this tournament
    SELECT * INTO v_tournament FROM public.tournaments WHERE id = p_tournament_id;

    IF v_tournament IS NULL THEN
        RAISE EXCEPTION 'Tournament not found';
    END IF;

    IF v_tournament.created_by != auth.uid() THEN
        RAISE EXCEPTION 'Only tournament creator can add guest players';
    END IF;

    -- Check if tournament is still open for participants
    IF v_tournament.status != 'open' THEN
        RAISE EXCEPTION 'Cannot add participants to a tournament that is not open';
    END IF;

    -- Check if tournament has space for more players
    IF v_tournament.current_players >= v_tournament.max_players THEN
        RAISE EXCEPTION 'Tournament is full';
    END IF;

    -- Create guest player
    INSERT INTO public.tournament_guest_players (tournament_id, name, email, phone, created_by)
    VALUES (p_tournament_id, p_name, p_email, p_phone, auth.uid())
    RETURNING id INTO v_guest_id;

    -- Add guest player as participant using actual schema with required columns
    INSERT INTO public.tournament_players (tournament_id, guest_player_id, name, created_by)
    VALUES (p_tournament_id, v_guest_id, p_name, auth.uid());

    -- Update tournament player count
    UPDATE public.tournaments
    SET current_players = current_players + 1
    WHERE id = p_tournament_id;

    RETURN json_build_object(
        'success', true,
        'guest_player_id', v_guest_id,
        'message', 'Guest player added successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;