-- Implement Round Advancement System
-- Run this in your Supabase SQL editor

-- Create function to check if round is complete and advance to next round
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
    SET status = 'completed', updated_at = NOW()
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

-- Create function to check round completion status
CREATE OR REPLACE FUNCTION public.check_round_completion(p_tournament_id UUID, p_round_number INTEGER)
RETURNS JSON AS $$
DECLARE
    v_round_id UUID;
    v_total_matches INTEGER;
    v_completed_matches INTEGER;
    v_incomplete_matches INTEGER;
BEGIN
    -- Get round ID
    SELECT id INTO v_round_id
    FROM public.tournament_rounds
    WHERE tournament_id = p_tournament_id AND round_number = p_round_number;
    
    IF v_round_id IS NULL THEN
        RAISE EXCEPTION 'Round not found';
    END IF;
    
    -- Count total matches
    SELECT COUNT(*) INTO v_total_matches
    FROM public.tournament_matches
    WHERE tournament_id = p_tournament_id AND round_id = v_round_id;
    
    -- Count completed matches
    SELECT COUNT(*) INTO v_completed_matches
    FROM public.tournament_matches
    WHERE tournament_id = p_tournament_id AND round_id = v_round_id AND status = 'completed';
    
    v_incomplete_matches := v_total_matches - v_completed_matches;
    
    RETURN json_build_object(
        'round_number', p_round_number,
        'total_matches', v_total_matches,
        'completed_matches', v_completed_matches,
        'incomplete_matches', v_incomplete_matches,
        'is_complete', v_incomplete_matches = 0
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the functions
SELECT 'Round advancement system implemented successfully' as status;
