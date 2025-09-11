-- Fix start_league_test function to work with real users
-- Run this in your Supabase SQL editor

DROP FUNCTION IF EXISTS start_league_test(UUID);

CREATE OR REPLACE FUNCTION start_league_test(p_league_id UUID)
RETURNS JSON AS $$
DECLARE
    v_league RECORD;
    v_box_id UUID;
    v_box_level INTEGER;
    v_box_name TEXT;
    v_participant RECORD;
    v_total_assignments INTEGER := 0;
    v_participant_count INTEGER;
BEGIN
    -- Get league details
    SELECT * INTO v_league FROM leagues WHERE id = p_league_id;

    IF v_league IS NULL THEN
        RAISE EXCEPTION 'League not found';
    END IF;

    IF v_league.created_by != auth.uid() THEN
        RAISE EXCEPTION 'Only league creator can start the league';
    END IF;

    IF v_league.status != 'open' THEN
        RAISE EXCEPTION 'League is not open for starting';
    END IF;

    -- Count actual participants
    SELECT COUNT(*) INTO v_participant_count 
    FROM league_participants 
    WHERE league_id = p_league_id AND status = 'confirmed';

    -- Create boxes based on participant count
    -- If we have 4+ participants, create 4 boxes
    -- If we have fewer, create fewer boxes
    IF v_participant_count >= 4 THEN
        -- Create 4 boxes
        FOR v_box_level IN 1..4 LOOP
            v_box_name := CASE
                WHEN v_box_level = 1 THEN 'Championship Box'
                WHEN v_box_level = 2 THEN 'Premier Box'
                WHEN v_box_level = 3 THEN 'Division 1 Box'
                ELSE 'Division 2 Box'
            END;

            INSERT INTO league_boxes (league_id, level, name, max_players)
            VALUES (p_league_id, v_box_level, v_box_name, 5)
            RETURNING id INTO v_box_id;
        END LOOP;
    ELSIF v_participant_count >= 2 THEN
        -- Create 2 boxes for smaller leagues
        FOR v_box_level IN 1..2 LOOP
            v_box_name := CASE
                WHEN v_box_level = 1 THEN 'Championship Box'
                ELSE 'Premier Box'
            END;

            INSERT INTO league_boxes (league_id, level, name, max_players)
            VALUES (p_league_id, v_box_level, v_box_name, 5)
            RETURNING id INTO v_box_id;
        END LOOP;
    ELSE
        RAISE EXCEPTION 'League needs at least 2 participants to start';
    END IF;

    -- Assign participants to boxes
    -- Get the first box (Championship Box)
    SELECT id INTO v_box_id FROM league_boxes
    WHERE league_id = p_league_id AND level = 1;

    -- Assign all confirmed participants to the Championship Box initially
    FOR v_participant IN
        SELECT user_id FROM league_participants
        WHERE league_id = p_league_id AND status = 'confirmed'
    LOOP
        INSERT INTO league_box_assignments (league_id, box_id, user_id, assigned_at)
        VALUES (p_league_id, v_box_id, v_participant.user_id, NOW())
        ON CONFLICT (box_id, user_id) DO NOTHING;

        v_total_assignments := v_total_assignments + 1;
    END LOOP;

    -- Update league status
    UPDATE leagues SET status = 'started' WHERE id = p_league_id;

    RETURN json_build_object(
        'message', 'League started successfully',
        'boxes_created', CASE WHEN v_participant_count >= 4 THEN 4 ELSE 2 END,
        'participants_assigned', v_total_assignments,
        'note', 'All participants assigned to Championship Box initially'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
