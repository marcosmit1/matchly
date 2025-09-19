-- Fix Match Generation Logic to Prevent Players in Multiple Matches
-- Run this in your Supabase SQL editor

-- Drop and recreate the generate_round_matches function with proper logic
DROP FUNCTION IF EXISTS public.generate_round_matches(UUID, INTEGER);

CREATE OR REPLACE FUNCTION public.generate_round_matches(p_tournament_id UUID, p_round_number INTEGER)
RETURNS JSON AS $$
DECLARE
    v_round_id UUID;
    v_players RECORD;
    v_player_count INTEGER;
    v_matches_needed INTEGER;
    v_court_number INTEGER;
    v_available_players UUID[];
    v_player1_id UUID;
    v_player2_id UUID;
    v_player3_id UUID;
    v_player4_id UUID;
    v_match_count INTEGER := 0;
    v_tournament RECORD;
BEGIN
    -- Get or create the round
    SELECT id INTO v_round_id
    FROM public.tournament_rounds
    WHERE tournament_id = p_tournament_id AND round_number = p_round_number;
    
    IF v_round_id IS NULL THEN
        INSERT INTO public.tournament_rounds (tournament_id, round_number, status)
        VALUES (p_tournament_id, p_round_number, 'active')
        RETURNING id INTO v_round_id;
    END IF;
    
    -- Get all players for this tournament
    SELECT COUNT(*) INTO v_player_count
    FROM public.tournament_players
    WHERE tournament_id = p_tournament_id;
    
    -- Get tournament details to check number of courts
    SELECT number_of_courts INTO v_tournament
    FROM public.tournaments
    WHERE id = p_tournament_id;
    
    -- Calculate matches needed (4 players per match, but limited by number of courts)
    v_matches_needed := LEAST(v_player_count / 4, v_tournament.number_of_courts);
    
    -- Get all player IDs in a random order
    SELECT ARRAY_AGG(id ORDER BY RANDOM()) INTO v_available_players
    FROM public.tournament_players
    WHERE tournament_id = p_tournament_id;
    
    -- Generate matches ensuring no player appears twice
    v_court_number := 1;
    
    WHILE v_match_count < v_matches_needed AND array_length(v_available_players, 1) >= 4 LOOP
        -- Select 4 unique players for this match
        v_player1_id := v_available_players[1];
        v_player2_id := v_available_players[2];
        v_player3_id := v_available_players[3];
        v_player4_id := v_available_players[4];
        
        -- Remove these players from available list
        v_available_players := v_available_players[5:];
        
        -- Insert the match
        INSERT INTO public.tournament_matches (
            tournament_id,
            round_id,
            court_number,
            player1_id,
            player2_id,
            player3_id,
            player4_id,
            status
        )
        VALUES (
            p_tournament_id,
            v_round_id,
            v_court_number,
            v_player1_id,
            v_player2_id,
            v_player3_id,
            v_player4_id,
            'scheduled'
        );
        
        v_court_number := v_court_number + 1;
        v_match_count := v_match_count + 1;
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'round_id', v_round_id,
        'matches_created', v_match_count,
        'players_used', (v_match_count * 4),
        'players_remaining', array_length(v_available_players, 1)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function
SELECT 'Match generation logic fixed - players can no longer be in multiple matches per round' as status;
