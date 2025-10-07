-- Add invite code and invite link columns to tournaments table
-- Run this in your Supabase SQL editor

-- Add invite code and invite link columns to tournaments table
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS invite_code TEXT,
ADD COLUMN IF NOT EXISTS invite_link TEXT;

-- Create unique index on invite_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_tournaments_invite_code ON tournaments(invite_code);

-- Update existing tournaments to have invite codes
UPDATE tournaments 
SET 
  invite_code = substring(md5(random()::text) from 1 for 5),
  invite_link = 'https://matchly-jet.vercel.app/join/' || substring(md5(random()::text) from 1 for 5)
WHERE invite_code IS NULL;

-- Create function to generate unique 5-digit invite code
CREATE OR REPLACE FUNCTION generate_unique_invite_code()
RETURNS TEXT AS $$
DECLARE
    v_code TEXT;
    v_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate 5-digit code (numbers only for easier sharing)
        v_code := LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
        
        -- Check if code already exists in tournaments
        SELECT EXISTS(SELECT 1 FROM tournaments WHERE invite_code = v_code) INTO v_exists;
        
        -- If code doesn't exist, we can use it
        IF NOT v_exists THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Create function to join tournament with invite code
CREATE OR REPLACE FUNCTION join_tournament_with_code(
    p_invite_code TEXT,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS JSON AS $$
DECLARE
    v_tournament RECORD;
    v_participant_count INTEGER;
    v_user_name TEXT;
    v_user_email TEXT;
BEGIN
    -- Get current user if not provided
    IF p_user_id IS NULL THEN
        p_user_id := auth.uid();
    END IF;
    
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;
    
    -- Find tournament by invite code
    SELECT * INTO v_tournament 
    FROM tournaments 
    WHERE invite_code = p_invite_code;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid invite code';
    END IF;
    
    -- Check if tournament is still open
    IF v_tournament.status != 'open' THEN
        RAISE EXCEPTION 'Tournament is no longer accepting participants';
    END IF;
    
    -- Get current participant count
    SELECT COUNT(*) INTO v_participant_count 
    FROM tournament_players 
    WHERE tournament_id = v_tournament.id;
    
    -- Check if tournament is full
    IF v_participant_count >= v_tournament.max_players THEN
        RAISE EXCEPTION 'Tournament is full';
    END IF;
    
    -- Get user details
    SELECT username, email INTO v_user_name, v_user_email
    FROM users 
    WHERE id = p_user_id;
    
    -- Check if user is already a participant
    IF EXISTS(SELECT 1 FROM tournament_players WHERE tournament_id = v_tournament.id AND created_by = p_user_id) THEN
        RAISE EXCEPTION 'You are already a participant in this tournament';
    END IF;
    
    -- Add user as participant
    INSERT INTO tournament_players (
        tournament_id,
        name,
        email,
        created_by
    ) VALUES (
        v_tournament.id,
        COALESCE(v_user_name, v_user_email, 'Player'),
        v_user_email,
        p_user_id
    );
    
    -- Update participant count
    UPDATE tournaments 
    SET current_players = current_players + 1 
    WHERE id = v_tournament.id;
    
    RETURN json_build_object(
        'success', true,
        'tournament_id', v_tournament.id,
        'tournament_name', v_tournament.name,
        'message', 'Successfully joined tournament'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to join league with invite code
CREATE OR REPLACE FUNCTION join_league_with_code(
    p_invite_code TEXT,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS JSON AS $$
DECLARE
    v_league RECORD;
    v_participant_count INTEGER;
    v_user_name TEXT;
    v_user_email TEXT;
BEGIN
    -- Get current user if not provided
    IF p_user_id IS NULL THEN
        p_user_id := auth.uid();
    END IF;
    
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;
    
    -- Find league by invite code
    SELECT * INTO v_league 
    FROM leagues 
    WHERE invite_code = p_invite_code;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid invite code';
    END IF;
    
    -- Check if league is still open
    IF v_league.status != 'open' THEN
        RAISE EXCEPTION 'League is no longer accepting participants';
    END IF;
    
    -- Get current participant count
    SELECT COUNT(*) INTO v_participant_count 
    FROM league_participants 
    WHERE league_id = v_league.id AND status = 'confirmed';
    
    -- Check if league is full
    IF v_participant_count >= v_league.max_players THEN
        RAISE EXCEPTION 'League is full';
    END IF;
    
    -- Get user details
    SELECT username, email INTO v_user_name, v_user_email
    FROM users 
    WHERE id = p_user_id;
    
    -- Check if user is already a participant
    IF EXISTS(SELECT 1 FROM league_participants WHERE league_id = v_league.id AND user_id = p_user_id) THEN
        RAISE EXCEPTION 'You are already a participant in this league';
    END IF;
    
    -- Add user as participant
    INSERT INTO league_participants (
        league_id,
        user_id,
        status
    ) VALUES (
        v_league.id,
        p_user_id,
        'confirmed'
    );
    
    -- Update participant count
    UPDATE leagues 
    SET current_players = current_players + 1 
    WHERE id = v_league.id;
    
    RETURN json_build_object(
        'success', true,
        'league_id', v_league.id,
        'league_name', v_league.name,
        'message', 'Successfully joined league'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
