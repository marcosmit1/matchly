-- Fix create_league function overloading issue
-- Run this in your Supabase SQL editor

-- Drop all existing create_league functions to resolve overloading conflicts
DROP FUNCTION IF EXISTS create_league(TEXT, TEXT, TEXT, INTEGER, TIMESTAMP WITH TIME ZONE, TEXT, DECIMAL, DECIMAL);
DROP FUNCTION IF EXISTS create_league(character varying, text, character varying, integer, date, character varying, numeric, numeric);
DROP FUNCTION IF EXISTS create_league(text, text, text, integer, timestamp with time zone, text, numeric, numeric);

-- Create a single, clean create_league function
CREATE OR REPLACE FUNCTION create_league(
    p_name TEXT,
    p_description TEXT DEFAULT NULL,
    p_sport TEXT DEFAULT 'squash',
    p_max_players INTEGER DEFAULT 8,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_location TEXT DEFAULT NULL,
    p_entry_fee DECIMAL(10,2) DEFAULT 0,
    p_prize_pool DECIMAL(10,2) DEFAULT 0
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
    v_invite_link := 'https://tournamator.app/join/' || v_invite_code;
    
    -- Insert league
    INSERT INTO leagues (
        name, description, sport, max_players, start_date, 
        location, entry_fee, prize_pool, invite_code, invite_link, created_by
    ) VALUES (
        p_name, p_description, p_sport, p_max_players, p_start_date,
        p_location, p_entry_fee, p_prize_pool, v_invite_code, v_invite_link, v_creator_id
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
