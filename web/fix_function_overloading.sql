-- Fix function overloading by dropping ALL create_league functions and creating one clean version
-- Run this in your Supabase SQL editor

-- Drop ALL possible create_league function variations
DROP FUNCTION IF EXISTS public.create_league(character varying, text, character varying, integer, date, character varying, numeric, numeric, integer, integer, integer);
DROP FUNCTION IF EXISTS public.create_league(text, text, text, integer, timestamp with time zone, text, numeric, numeric, integer, integer, integer);
DROP FUNCTION IF EXISTS public.create_league(text, text, text, integer, text, text, numeric, numeric, integer, integer, integer);
DROP FUNCTION IF EXISTS public.create_league(varchar, text, varchar, integer, date, varchar, decimal, decimal, integer, integer, integer);

-- Also try dropping without explicit parameter types
DROP FUNCTION IF EXISTS public.create_league CASCADE;

-- Create ONE clean function with consistent types
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
BEGIN
    -- Get current user
    v_creator_id := auth.uid();

    IF v_creator_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;

    -- Generate unique invite code
    v_invite_code := substring(md5(random()::text) from 1 for 8);

    -- Create invite link
    v_invite_link := 'https://matchly.app/join/' || v_invite_code;

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