-- Fix league invite codes to match tournament 5-digit format
-- Run this in your Supabase SQL editor

-- Update the create_league function to use the same invite code generation as tournaments
CREATE OR REPLACE FUNCTION public.create_league(
    p_name TEXT,
    p_description TEXT DEFAULT NULL,
    p_sport TEXT DEFAULT 'squash',
    p_max_players INTEGER DEFAULT 8,
    p_start_date TEXT DEFAULT NULL,
    p_location TEXT DEFAULT NULL,
    p_entry_fee DECIMAL(10,2) DEFAULT 0,
    p_prize_pool DECIMAL(10,2) DEFAULT 0,
    -- Box configuration parameters
    p_number_of_boxes INTEGER DEFAULT NULL,
    p_min_players_per_box INTEGER DEFAULT NULL,
    p_max_players_per_box INTEGER DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_league_id UUID;
    v_invite_code TEXT;
    v_invite_link TEXT;
    v_creator_id UUID;
    v_exists BOOLEAN;
BEGIN
    -- Get current user
    v_creator_id := auth.uid();

    IF v_creator_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;

    -- Generate unique 5-digit invite code (same as tournaments)
    LOOP
        -- Generate 5-digit code (numbers only for easier sharing)
        v_invite_code := LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');

        -- Check if code already exists in tournaments OR leagues
        SELECT EXISTS(
            SELECT 1 FROM tournaments WHERE invite_code = v_invite_code
            UNION
            SELECT 1 FROM leagues WHERE invite_code = v_invite_code
        ) INTO v_exists;

        -- If code doesn't exist, we can use it
        IF NOT v_exists THEN
            EXIT;
        END IF;
    END LOOP;

    -- Create invite link
    v_invite_link := 'https://matchly-jet.vercel.app/join/' || v_invite_code;

    -- Insert league with box configuration
    INSERT INTO leagues (
        name, description, sport, max_players, start_date,
        location, entry_fee, prize_pool, invite_code, invite_link, created_by,
        number_of_boxes, min_players_per_box, max_players_per_box
    ) VALUES (
        p_name, p_description, p_sport, p_max_players,
        CASE WHEN p_start_date IS NOT NULL THEN p_start_date::date ELSE NULL END,
        p_location, p_entry_fee, p_prize_pool, v_invite_code, v_invite_link, v_creator_id,
        p_number_of_boxes, p_min_players_per_box, p_max_players_per_box
    ) RETURNING id INTO v_league_id;

    -- Add creator as confirmed participant
    INSERT INTO league_participants (league_id, user_id, status)
    VALUES (v_league_id, v_creator_id, 'confirmed');

    -- Update current_players count
    UPDATE leagues SET current_players = 1 WHERE id = v_league_id;

    RETURN json_build_object(
        'id', v_league_id,
        'invite_code', v_invite_code,
        'invite_link', v_invite_link
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also update the generate_unique_invite_code function to check both tournaments and leagues
CREATE OR REPLACE FUNCTION generate_unique_invite_code()
RETURNS TEXT AS $$
DECLARE
    v_code TEXT;
    v_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate 5-digit code (numbers only for easier sharing)
        v_code := LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');

        -- Check if code already exists in tournaments OR leagues
        SELECT EXISTS(
            SELECT 1 FROM tournaments WHERE invite_code = v_code
            UNION
            SELECT 1 FROM leagues WHERE invite_code = v_code
        ) INTO v_exists;

        -- If code doesn't exist, we can use it
        IF NOT v_exists THEN
            EXIT;
        END IF;
    END LOOP;

    RETURN v_code;
END;
$$ LANGUAGE plpgsql;