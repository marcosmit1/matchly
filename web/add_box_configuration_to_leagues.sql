-- Add Box Configuration Fields to Leagues Table
-- Run this in your Supabase SQL editor to add box configuration support

-- Add box configuration columns to leagues table
ALTER TABLE public.leagues
ADD COLUMN IF NOT EXISTS number_of_boxes INTEGER,
ADD COLUMN IF NOT EXISTS min_players_per_box INTEGER,
ADD COLUMN IF NOT EXISTS max_players_per_box INTEGER;

-- Add constraints for the new columns
ALTER TABLE public.leagues
ADD CONSTRAINT check_number_of_boxes CHECK (number_of_boxes IS NULL OR number_of_boxes > 0),
ADD CONSTRAINT check_min_players_per_box CHECK (min_players_per_box IS NULL OR (min_players_per_box >= 2 AND min_players_per_box <= 12)),
ADD CONSTRAINT check_max_players_per_box CHECK (max_players_per_box IS NULL OR (max_players_per_box >= 2 AND max_players_per_box <= 12));

-- Update the create_league function to accept box configuration parameters
CREATE OR REPLACE FUNCTION public.create_league(
    p_name VARCHAR(100),
    p_description TEXT DEFAULT NULL,
    p_sport VARCHAR(50) DEFAULT 'squash',
    p_max_players INTEGER DEFAULT 8,
    p_start_date DATE DEFAULT NULL,
    p_location VARCHAR(255) DEFAULT NULL,
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
    v_invite_code VARCHAR(8);
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

-- Update the start_league function to use flexible box configuration
CREATE OR REPLACE FUNCTION start_league(p_league_id UUID)
RETURNS JSON AS $$
DECLARE
    v_league RECORD;
    v_participant_count INTEGER;
    v_boxes_needed INTEGER;
    v_box_id UUID;
    v_participant RECORD;
    v_box_level INTEGER;
    v_box_name TEXT;
    v_participants_per_box INTEGER;
    v_remaining_participants INTEGER;
    v_current_box_participants INTEGER;
    v_box_sizes INTEGER[];
    v_players_per_box INTEGER;
    v_remainder INTEGER;
BEGIN
    -- Get league details including box configuration
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
    
    -- Count confirmed participants
    SELECT COUNT(*) INTO v_participant_count 
    FROM league_participants 
    WHERE league_id = p_league_id AND status = 'confirmed';
    
    IF v_participant_count < 4 THEN
        RAISE EXCEPTION 'League needs at least 4 players to start';
    END IF;
    
    -- Calculate box configuration using flexible logic
    IF v_league.number_of_boxes IS NOT NULL THEN
        -- Use specified number of boxes
        v_boxes_needed := v_league.number_of_boxes;
        v_players_per_box := FLOOR(v_participant_count::DECIMAL / v_boxes_needed);
        v_remainder := v_participant_count % v_boxes_needed;
        
        -- Generate box sizes array
        v_box_sizes := ARRAY[]::INTEGER[];
        FOR i IN 1..v_boxes_needed LOOP
            IF i = v_boxes_needed AND v_remainder > 0 THEN
                v_box_sizes := v_box_sizes || (v_players_per_box + v_remainder);
            ELSE
                v_box_sizes := v_box_sizes || v_players_per_box;
            END IF;
        END LOOP;
        
    ELSIF v_league.min_players_per_box IS NOT NULL OR v_league.max_players_per_box IS NOT NULL THEN
        -- Use min/max players per box constraints
        DECLARE
            v_min_players INTEGER := COALESCE(v_league.min_players_per_box, 2);
            v_max_players INTEGER := COALESCE(v_league.max_players_per_box, 8);
        BEGIN
            -- Start with maximum possible boxes (using min players per box)
            v_boxes_needed := FLOOR(v_participant_count::DECIMAL / v_min_players);
            v_players_per_box := FLOOR(v_participant_count::DECIMAL / v_boxes_needed);
            
            -- Adjust if we exceed maximum players per box
            WHILE v_players_per_box > v_max_players AND v_boxes_needed < v_participant_count LOOP
                v_boxes_needed := v_boxes_needed + 1;
                v_players_per_box := FLOOR(v_participant_count::DECIMAL / v_boxes_needed);
            END LOOP;
            
            -- Check if it's possible with given constraints
            IF v_players_per_box < v_min_players THEN
                RAISE EXCEPTION 'Cannot create boxes with minimum % players. Try reducing min players or increasing total players.', v_min_players;
            END IF;
            
            v_remainder := v_participant_count % v_boxes_needed;
            
            -- Generate box sizes array
            v_box_sizes := ARRAY[]::INTEGER[];
            FOR i IN 1..v_boxes_needed LOOP
                IF i = v_boxes_needed AND v_remainder > 0 THEN
                    v_box_sizes := v_box_sizes || (v_players_per_box + v_remainder);
                ELSE
                    v_box_sizes := v_box_sizes || v_players_per_box;
                END IF;
            END LOOP;
            
            -- Final validation: ensure no box exceeds max players
            IF v_max_players < 8 AND (SELECT MAX(unnest) FROM unnest(v_box_sizes)) > v_max_players THEN
                RAISE EXCEPTION 'Cannot create boxes with maximum % players. The optimal configuration would have % players in some boxes. Try increasing max players or reducing total players.', v_max_players, (SELECT MAX(unnest) FROM unnest(v_box_sizes));
            END IF;
        END;
        
    ELSE
        -- Use default automatic calculation (existing logic)
        v_boxes_needed := CEIL(v_participant_count::DECIMAL / 5);
        v_players_per_box := CEIL(v_participant_count::DECIMAL / v_boxes_needed);
        v_remainder := v_participant_count % v_boxes_needed;
        
        -- Generate box sizes array
        v_box_sizes := ARRAY[]::INTEGER[];
        FOR i IN 1..v_boxes_needed LOOP
            IF i = v_boxes_needed AND v_remainder > 0 THEN
                v_box_sizes := v_box_sizes || (v_players_per_box + v_remainder);
            ELSE
                v_box_sizes := v_box_sizes || v_players_per_box;
            END IF;
        END LOOP;
    END IF;
    
    -- Create boxes
    FOR v_box_level IN 1..v_boxes_needed LOOP
        v_box_name := CASE 
            WHEN v_box_level = 1 THEN 'Championship Box'
            WHEN v_box_level = 2 THEN 'Premier Box'
            ELSE 'Division ' || (v_box_level - 2) || ' Box'
        END;
        
        INSERT INTO league_boxes (league_id, level, name, max_players, current_players)
        VALUES (p_league_id, v_box_level, v_box_name, v_box_sizes[v_box_level], v_box_sizes[v_box_level])
        RETURNING id INTO v_box_id;
    END LOOP;
    
    -- Assign participants to boxes randomly
    v_remaining_participants := v_participant_count;
    v_current_box_participants := 0;
    v_box_level := 1;
    
    FOR v_participant IN 
        SELECT user_id FROM league_participants 
        WHERE league_id = p_league_id AND status = 'confirmed'
        ORDER BY RANDOM()
    LOOP
        -- Get current box ID
        SELECT id INTO v_box_id FROM league_boxes 
        WHERE league_id = p_league_id AND level = v_box_level;
        
        -- Insert box assignment
        INSERT INTO league_box_assignments (league_id, box_id, user_id, assigned_at, status)
        VALUES (p_league_id, v_box_id, v_participant.user_id, NOW(), 'active');
        
        v_current_box_participants := v_current_box_participants + 1;
        v_remaining_participants := v_remaining_participants - 1;
        
        -- Move to next box if current box is full
        IF v_current_box_participants >= v_box_sizes[v_box_level] THEN
            v_box_level := v_box_level + 1;
            v_current_box_participants := 0;
        END IF;
    END LOOP;
    
    -- Update league status
    UPDATE leagues 
    SET status = 'started', started_at = NOW()
    WHERE id = p_league_id;
    
    RETURN json_build_object(
        'success', true,
        'boxes_created', v_boxes_needed,
        'box_sizes', v_box_sizes,
        'total_participants', v_participant_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the changes
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'leagues'
  AND column_name IN ('number_of_boxes', 'min_players_per_box', 'max_players_per_box')
ORDER BY column_name;
