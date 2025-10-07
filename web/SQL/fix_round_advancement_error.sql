-- Fix the round advancement error
-- Run this in your Supabase SQL editor

-- Check the current structure of tournament_rounds table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tournament_rounds'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add the missing updated_at column if it doesn't exist
ALTER TABLE public.tournament_rounds 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update the advance_tournament_round function to not use updated_at if it doesn't exist
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
    
    -- Mark current round as completed (without updated_at)
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

SELECT 'Round advancement function fixed' as status;
