-- Fix start_league_test function to properly assign players to boxes
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
    v_box_counter INTEGER := 1;
    v_participants_per_box INTEGER := 5;
    v_current_box_participants INTEGER := 0;
    v_total_assignments INTEGER := 0;
    v_test_user_id UUID;
    v_test_username TEXT;
    v_test_email TEXT;
    v_test_counter INTEGER;
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

    -- Create 4 boxes for testing (Championship, Premier, Division 1, Division 2)
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

    -- Get the first box (Championship Box)
    SELECT id INTO v_box_id FROM league_boxes
    WHERE league_id = p_league_id AND level = 1;

    -- Add test players to the Championship Box for testing
    -- We need at least 2 players to generate matches
    FOR v_test_counter IN 1..3 LOOP
        v_test_user_id := gen_random_uuid();
        v_test_username := 'TestPlayer' || v_test_counter;
        v_test_email := 'testplayer' || v_test_counter || '@test.com';
        
        -- Insert test user
        INSERT INTO users (id, email, username, created_at, updated_at)
        VALUES (v_test_user_id, v_test_email, v_test_username, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
        
        -- Add as league participant
        INSERT INTO league_participants (league_id, user_id, status, joined_at)
        VALUES (p_league_id, v_test_user_id, 'confirmed', NOW())
        ON CONFLICT (league_id, user_id) DO NOTHING;
        
        -- Assign to Championship Box
        INSERT INTO league_box_assignments (league_id, box_id, user_id, assigned_at)
        VALUES (p_league_id, v_box_id, v_test_user_id, NOW())
        ON CONFLICT (box_id, user_id) DO NOTHING;
        
        v_total_assignments := v_total_assignments + 1;
    END LOOP;

    -- Assign the current user to the Championship Box as well
    INSERT INTO league_box_assignments (league_id, box_id, user_id, assigned_at)
    VALUES (p_league_id, v_box_id, auth.uid(), NOW())
    ON CONFLICT (box_id, user_id) DO NOTHING;

    v_total_assignments := v_total_assignments + 1;

    -- Update league status
    UPDATE leagues SET status = 'started' WHERE id = p_league_id;

    RETURN json_build_object(
        'message', 'Test league started successfully',
        'boxes_created', 4,
        'participants_assigned', v_total_assignments,
        'note', '4 players assigned to Championship Box for testing (including 3 test players)'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
