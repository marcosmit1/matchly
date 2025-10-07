-- Fix all tournament issues: court logic, round advancement, and cleanup
-- Run this in your Supabase SQL editor

-- 1. Add missing updated_at column to tournament_rounds
ALTER TABLE public.tournament_rounds 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Clean up existing matches and rounds
DELETE FROM public.tournament_matches 
WHERE tournament_id = '05138795-471e-4680-8ad8-33f87a029f5c';

DELETE FROM public.tournament_rounds 
WHERE tournament_id = '05138795-471e-4680-8ad8-33f87a029f5c';

-- 3. Update the match generation function with proper court logic
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
        'players_remaining', array_length(v_available_players, 1),
        'courts_used', v_match_count,
        'max_courts', v_tournament.number_of_courts
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update the advance_tournament_round function
DROP FUNCTION IF EXISTS public.advance_tournament_round(UUID);

CREATE OR REPLACE FUNCTION public.advance_tournament_round(p_tournament_id UUID)
RETURNS JSON AS $$
DECLARE
    v_tournament RECORD;
    v_current_round RECORD;
    v_incomplete_matches INTEGER;
    v_next_round_number INTEGER;
    v_new_round_id UUID;
BEGIN
    -- Get tournament details
    SELECT * INTO v_tournament FROM public.tournaments WHERE id = p_tournament_id;
    
    IF v_tournament IS NULL THEN
        RAISE EXCEPTION 'Tournament not found';
    END IF;
    
    -- Get current active round
    SELECT * INTO v_current_round 
    FROM public.tournament_rounds 
    WHERE tournament_id = p_tournament_id 
    AND status = 'active'
    ORDER BY round_number DESC
    LIMIT 1;
    
    IF v_current_round IS NULL THEN
        RAISE EXCEPTION 'No active round found';
    END IF;
    
    -- Check if current round has incomplete matches
    SELECT COUNT(*) INTO v_incomplete_matches
    FROM public.tournament_matches
    WHERE tournament_id = p_tournament_id
    AND round_id = v_current_round.id
    AND status != 'completed';
    
    -- If there are incomplete matches, don't advance
    IF v_incomplete_matches > 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Round not complete - ' || v_incomplete_matches || ' matches remaining',
            'incomplete_matches', v_incomplete_matches
        );
    END IF;
    
    -- Mark current round as completed
    UPDATE public.tournament_rounds
    SET status = 'completed'
    WHERE id = v_current_round.id;
    
    -- Create next round
    v_next_round_number := v_current_round.round_number + 1;
    
    INSERT INTO public.tournament_rounds (tournament_id, round_number, status)
    VALUES (p_tournament_id, v_next_round_number, 'active')
    RETURNING id INTO v_new_round_id;
    
    -- Generate matches for the new round
    PERFORM public.generate_round_matches(p_tournament_id, v_next_round_number);
    
    RETURN json_build_object(
        'success', true,
        'message', 'Advanced to round ' || v_next_round_number,
        'new_round_number', v_next_round_number,
        'new_round_id', v_new_round_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Generate the correct number of matches (4 matches for 4 courts, 20 players)
SELECT public.generate_round_matches('05138795-471e-4680-8ad8-33f87a029f5c', 1);

-- 6. Verify the results
SELECT 
    'Tournament fixed successfully!' as status,
    COUNT(*) as matches_created,
    'Should be 4 matches for 4 courts' as expected
FROM public.tournament_matches tm
JOIN public.tournament_rounds tr ON tm.round_id = tr.id
WHERE tr.tournament_id = '05138795-471e-4680-8ad8-33f87a029f5c'
AND tr.round_number = 1;

-- 7. Show the matches with court numbers
SELECT 
    tm.court_number,
    tm.status,
    'Court ' || tm.court_number as court_name
FROM public.tournament_matches tm
JOIN public.tournament_rounds tr ON tm.round_id = tr.id
WHERE tr.tournament_id = '05138795-471e-4680-8ad8-33f87a029f5c'
AND tr.round_number = 1
ORDER BY tm.court_number;
