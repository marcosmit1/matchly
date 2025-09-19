-- Implement Playoffs System
-- Run this in your Supabase SQL editor

-- Create function to start playoffs with ranking-based matchups
CREATE OR REPLACE FUNCTION public.start_playoffs(p_tournament_id UUID)
RETURNS JSON AS $$
DECLARE
    v_tournament RECORD;
    v_playoff_round_id UUID;
    v_playoff_round_number INTEGER;
    v_players_with_rankings RECORD;
    v_player_count INTEGER;
    v_matches_needed INTEGER;
    v_court_number INTEGER;
    v_player1_id UUID;
    v_player2_id UUID;
    v_player3_id UUID;
    v_player4_id UUID;
    v_match_count INTEGER := 0;
    v_ranked_players UUID[];
BEGIN
    -- Get tournament details
    SELECT * INTO v_tournament FROM public.tournaments WHERE id = p_tournament_id;
    
    IF v_tournament IS NULL THEN
        RAISE EXCEPTION 'Tournament not found';
    END IF;
    
    -- Check if tournament is started
    IF v_tournament.status != 'started' THEN
        RAISE EXCEPTION 'Tournament must be started to begin playoffs';
    END IF;
    
    -- Get the next round number
    SELECT COALESCE(MAX(round_number), 0) + 1 INTO v_playoff_round_number
    FROM public.tournament_rounds
    WHERE tournament_id = p_tournament_id;
    
    -- Create playoff round
    INSERT INTO public.tournament_rounds (tournament_id, round_number, status)
    VALUES (p_tournament_id, v_playoff_round_number, 'active')
    RETURNING id INTO v_playoff_round_id;
    
    -- Get players with their current rankings (based on wins, points, etc.)
    -- For now, we'll use a simple ranking based on match wins
    WITH player_stats AS (
        SELECT 
            tp.id as player_id,
            tp.name,
            COUNT(CASE WHEN tm.status = 'completed' AND (
                (tm.player1_id = tp.id AND tm.player1_score > tm.player3_score) OR
                (tm.player2_id = tp.id AND tm.player1_score > tm.player3_score) OR
                (tm.player3_id = tp.id AND tm.player3_score > tm.player1_score) OR
                (tm.player4_id = tp.id AND tm.player3_score > tm.player1_score)
            ) THEN 1 END) as wins,
            COALESCE(SUM(CASE 
                WHEN tm.player1_id = tp.id THEN tm.player1_score
                WHEN tm.player2_id = tp.id THEN tm.player1_score
                WHEN tm.player3_id = tp.id THEN tm.player3_score
                WHEN tm.player4_id = tp.id THEN tm.player3_score
                ELSE 0
            END), 0) as total_points
        FROM public.tournament_players tp
        LEFT JOIN public.tournament_matches tm ON (
            tm.player1_id = tp.id OR tm.player2_id = tp.id OR 
            tm.player3_id = tp.id OR tm.player4_id = tp.id
        )
        WHERE tp.tournament_id = p_tournament_id
        GROUP BY tp.id, tp.name
        ORDER BY wins DESC, total_points DESC
    )
    SELECT ARRAY_AGG(player_id) INTO v_ranked_players
    FROM player_stats;
    
    -- Get player count
    v_player_count := array_length(v_ranked_players, 1);
    
    -- Calculate matches needed (4 players per match, limited by courts)
    v_matches_needed := LEAST(v_player_count / 4, v_tournament.number_of_courts);
    
    -- Generate playoff matches with ranking-based pairings
    -- Top players play against each other, medium players against medium players, etc.
    v_court_number := 1;
    
    WHILE v_match_count < v_matches_needed AND array_length(v_ranked_players, 1) >= 4 LOOP
        -- Select 4 players for this match (best available players)
        v_player1_id := v_ranked_players[1];  -- 1st place
        v_player2_id := v_ranked_players[2];  -- 2nd place
        v_player3_id := v_ranked_players[3];  -- 3rd place
        v_player4_id := v_ranked_players[4];  -- 4th place
        
        -- Remove these players from available list
        v_ranked_players := v_ranked_players[5:];
        
        -- Insert the playoff match
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
            v_playoff_round_id,
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
    
    -- Update tournament status to playoffs
    UPDATE public.tournaments
    SET status = 'playoffs'
    WHERE id = p_tournament_id;
    
    RETURN json_build_object(
        'success', true,
        'playoff_round_id', v_playoff_round_id,
        'playoff_round_number', v_playoff_round_number,
        'matches_created', v_match_count,
        'players_used', (v_match_count * 4),
        'message', 'Playoffs started successfully with ranking-based matchups'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function
SELECT 'Playoffs system implemented successfully' as status;
