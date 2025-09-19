-- Update invite links to use Vercel URL instead of matchly.app
-- Run this in your Supabase SQL editor

-- Update the create_league function to use the correct Vercel URL
CREATE OR REPLACE FUNCTION create_league(
    p_name TEXT,
    p_description TEXT DEFAULT NULL,
    p_sport TEXT DEFAULT 'squash',
    p_max_players INTEGER DEFAULT 8,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_location TEXT DEFAULT NULL,
    p_entry_fee DECIMAL(10,2) DEFAULT 0,
    p_prize_pool DECIMAL(10,2) DEFAULT 0,
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
        RAISE EXCEPTION 'User must be authenticated to create a league';
    END IF;
    
    -- Generate unique invite code
    v_invite_code := substring(md5(random()::text) from 1 for 8);
    
    -- Create invite link with Vercel URL
    v_invite_link := 'https://matchly-jet.vercel.app/join/' || v_invite_code;
    
    -- Insert league
    INSERT INTO leagues (
        name, description, sport, max_players, start_date, 
        location, entry_fee, prize_pool, invite_code, invite_link, created_by,
        number_of_boxes, min_players_per_box, max_players_per_box
    ) VALUES (
        p_name, p_description, p_sport, p_max_players, p_start_date,
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

-- Update existing leagues to use the correct Vercel URL
UPDATE leagues 
SET invite_link = 'https://matchly-jet.vercel.app/join/' || invite_code
WHERE invite_link LIKE 'https://matchly.app/join/%' 
   OR invite_link LIKE 'https://tournamator.app/join/%';

-- Show the updated leagues
SELECT id, name, invite_code, invite_link 
FROM leagues 
ORDER BY created_at DESC 
LIMIT 5;
