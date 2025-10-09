-- Create golf_fines table
CREATE TABLE IF NOT EXISTS golf_fines (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES golf_tournaments(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES golf_tournament_participants(id) ON DELETE CASCADE,
  fine_type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  reason TEXT NOT NULL,
  stat_value TEXT, -- Display the actual stat (e.g., "15 bogeys", "3 three-putts")
  created_at TIMESTAMPTZ DEFAULT now(),
  paid BOOLEAN DEFAULT false
);

-- Add RLS policies
ALTER TABLE golf_fines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
  ON golf_fines FOR SELECT
  USING (true);

-- Function to automatically create fines when tournament ends
CREATE OR REPLACE FUNCTION create_tournament_fines()
RETURNS TRIGGER AS $$
DECLARE
  total_holes INTEGER;
  total_scores INTEGER;
  total_participants INTEGER;
  winner_id UUID;
  worst_scorer_id UUID;
  worst_score INTEGER;
  v_participant_id UUID;
  v_player_name TEXT;
  v_count INTEGER;
  v_total INTEGER;
  v_percentage NUMERIC;
BEGIN
  -- Only run when tournament status changes to 'completed'
  IF NEW.status = 'completed' AND OLD.status = 'active' THEN
    -- Get total number of holes and participants
    SELECT COUNT(*) INTO total_holes FROM golf_holes WHERE tournament_id = NEW.id;
    SELECT COUNT(*) INTO total_participants FROM golf_tournament_participants WHERE tournament_id = NEW.id;
    
    -- Check if all scores are entered
    SELECT COUNT(*) INTO total_scores 
    FROM golf_scores 
    WHERE tournament_id = NEW.id;

    -- Only proceed if all holes are completed
    IF total_scores = (total_holes * total_participants) THEN
      -- Clear existing fines for this tournament
      DELETE FROM golf_fines WHERE tournament_id = NEW.id;

      -- 1. WOODEN SPOON 🥄 - Highest Total Score (Last Place)
      SELECT participant_id, SUM(strokes) as total INTO v_participant_id, v_total
      FROM golf_scores
      WHERE tournament_id = NEW.id
      GROUP BY participant_id
      ORDER BY SUM(strokes) DESC
      LIMIT 1;
      
      IF v_participant_id IS NOT NULL THEN
        SELECT player_name INTO v_player_name FROM golf_tournament_participants WHERE id = v_participant_id;
        INSERT INTO golf_fines (tournament_id, participant_id, fine_type, title, reason, stat_value)
        VALUES (NEW.id, v_participant_id, 'wooden_spoon', '🥄 The Wooden Spoon', 
                'Awarded to ' || v_player_name || ' for the highest total score', v_total || ' strokes');
      END IF;

      -- 2. MOST BOGEYS 😬
      SELECT participant_id, COUNT(*) as cnt INTO v_participant_id, v_count
      FROM golf_scores
      WHERE tournament_id = NEW.id AND is_bogey = true
      GROUP BY participant_id
      ORDER BY COUNT(*) DESC
      LIMIT 1;
      
      IF v_participant_id IS NOT NULL AND v_count > 0 THEN
        SELECT player_name INTO v_player_name FROM golf_tournament_participants WHERE id = v_participant_id;
        INSERT INTO golf_fines (tournament_id, participant_id, fine_type, title, reason, stat_value)
        VALUES (NEW.id, v_participant_id, 'most_bogeys', '😬 Bogey King/Queen', 
                v_player_name || ' recorded the most bogeys', v_count || ' bogeys');
      END IF;

      -- 3. MOST DOUBLE BOGEYS OR WORSE 💀
      SELECT participant_id, COUNT(*) as cnt INTO v_participant_id, v_count
      FROM golf_scores
      WHERE tournament_id = NEW.id AND is_double_bogey_plus = true
      GROUP BY participant_id
      ORDER BY COUNT(*) DESC
      LIMIT 1;
      
      IF v_participant_id IS NOT NULL AND v_count > 0 THEN
        SELECT player_name INTO v_player_name FROM golf_tournament_participants WHERE id = v_participant_id;
        INSERT INTO golf_fines (tournament_id, participant_id, fine_type, title, reason, stat_value)
        VALUES (NEW.id, v_participant_id, 'most_double_plus', '💀 Double Trouble', 
                v_player_name || ' had the most double bogeys or worse', v_count || ' holes');
      END IF;

      -- 4. MOST THREE-PUTTS 🎳
      SELECT participant_id, COUNT(*) as cnt INTO v_participant_id, v_count
      FROM golf_scores
      WHERE tournament_id = NEW.id AND putts >= 3
      GROUP BY participant_id
      ORDER BY COUNT(*) DESC
      LIMIT 1;
      
      IF v_participant_id IS NOT NULL AND v_count > 0 THEN
        SELECT player_name INTO v_player_name FROM golf_tournament_participants WHERE id = v_participant_id;
        INSERT INTO golf_fines (tournament_id, participant_id, fine_type, title, reason, stat_value)
        VALUES (NEW.id, v_participant_id, 'most_three_putts', '🎳 Three-Putt Master', 
                v_player_name || ' leads in three-putts', v_count || ' three-putts');
      END IF;

      -- 5. HIGHEST TOTAL PUTTS ⛳
      SELECT participant_id, SUM(putts) as total INTO v_participant_id, v_total
      FROM golf_scores
      WHERE tournament_id = NEW.id AND putts IS NOT NULL
      GROUP BY participant_id
      ORDER BY SUM(putts) DESC
      LIMIT 1;
      
      IF v_participant_id IS NOT NULL AND v_total > 0 THEN
        SELECT player_name INTO v_player_name FROM golf_tournament_participants WHERE id = v_participant_id;
        INSERT INTO golf_fines (tournament_id, participant_id, fine_type, title, reason, stat_value)
        VALUES (NEW.id, v_participant_id, 'most_putts', '⛳ Putting Struggles', 
                v_player_name || ' needed the most putts', v_total || ' total putts');
      END IF;

      -- 6. WORST FAIRWAY ACCURACY 🎯
      SELECT participant_id, 
             COUNT(CASE WHEN fairway_hit THEN 1 END)::float / NULLIF(COUNT(*), 0) * 100 as percentage,
             COUNT(CASE WHEN fairway_hit THEN 1 END) as hits
      INTO v_participant_id, v_percentage, v_count
      FROM golf_scores
      WHERE tournament_id = NEW.id
      GROUP BY participant_id
      ORDER BY COUNT(CASE WHEN fairway_hit THEN 1 END)::float / NULLIF(COUNT(*), 0) ASC
      LIMIT 1;
      
      IF v_participant_id IS NOT NULL THEN
        SELECT player_name INTO v_player_name FROM golf_tournament_participants WHERE id = v_participant_id;
        INSERT INTO golf_fines (tournament_id, participant_id, fine_type, title, reason, stat_value)
        VALUES (NEW.id, v_participant_id, 'worst_accuracy', '🎯 Wayward Warrior', 
                v_player_name || ' had the worst fairway accuracy', ROUND(v_percentage, 1) || '% (' || v_count || '/' || total_holes || ')');
      END IF;

      -- 7. MOST WATER HAZARDS 💦
      SELECT participant_id, COUNT(*) as cnt INTO v_participant_id, v_count
      FROM golf_scores
      WHERE tournament_id = NEW.id AND water_hazard = true
      GROUP BY participant_id
      ORDER BY COUNT(*) DESC
      LIMIT 1;
      
      IF v_participant_id IS NOT NULL AND v_count > 0 THEN
        SELECT player_name INTO v_player_name FROM golf_tournament_participants WHERE id = v_participant_id;
        INSERT INTO golf_fines (tournament_id, participant_id, fine_type, title, reason, stat_value)
        VALUES (NEW.id, v_participant_id, 'most_water', '💦 Splash Zone Champion', 
                v_player_name || ' found the most water hazards', v_count || ' water balls');
      END IF;

      -- 8. MOST BUNKERS 🏖️
      SELECT participant_id, COUNT(*) as cnt INTO v_participant_id, v_count
      FROM golf_scores
      WHERE tournament_id = NEW.id AND bunker = true
      GROUP BY participant_id
      ORDER BY COUNT(*) DESC
      LIMIT 1;
      
      IF v_participant_id IS NOT NULL AND v_count > 0 THEN
        SELECT player_name INTO v_player_name FROM golf_tournament_participants WHERE id = v_participant_id;
        INSERT INTO golf_fines (tournament_id, participant_id, fine_type, title, reason, stat_value)
        VALUES (NEW.id, v_participant_id, 'most_bunkers', '🏖️ Beach Lover', 
                v_player_name || ' spent the most time in bunkers', v_count || ' bunker shots');
      END IF;

      -- 9. WORST SINGLE HOLE 🔥
      SELECT participant_id, hole_number, strokes INTO v_participant_id, v_count, v_total
      FROM golf_scores
      WHERE tournament_id = NEW.id
      ORDER BY strokes DESC
      LIMIT 1;
      
      IF v_participant_id IS NOT NULL THEN
        SELECT player_name INTO v_player_name FROM golf_tournament_participants WHERE id = v_participant_id;
        INSERT INTO golf_fines (tournament_id, participant_id, fine_type, title, reason, stat_value)
        VALUES (NEW.id, v_participant_id, 'worst_hole', '🔥 Meltdown Moment', 
                v_player_name || ' had the worst single hole score', v_total || ' strokes on hole ' || v_count);
      END IF;

      -- 10. TOURNAMENT WINNER 🏆 (Gets to skip one fine!)
      SELECT participant_id INTO winner_id
      FROM golf_scores
      WHERE tournament_id = NEW.id
      GROUP BY participant_id
      ORDER BY SUM(strokes) ASC
      LIMIT 1;
      
      IF winner_id IS NOT NULL THEN
        SELECT player_name INTO v_player_name FROM golf_tournament_participants WHERE id = winner_id;
        SELECT SUM(strokes) INTO v_total FROM golf_scores WHERE tournament_id = NEW.id AND participant_id = winner_id;
        INSERT INTO golf_fines (tournament_id, participant_id, fine_type, title, reason, stat_value)
        VALUES (NEW.id, winner_id, 'tournament_winner', '🏆 Tournament Champion', 
                v_player_name || ' won the tournament - Skip one fine!', v_total || ' strokes (Winner!)');
      END IF;

    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to golf_tournaments table
DROP TRIGGER IF EXISTS tournament_completion_fines ON golf_tournaments;
CREATE TRIGGER tournament_completion_fines
  AFTER UPDATE ON golf_tournaments
  FOR EACH ROW
  EXECUTE FUNCTION create_tournament_fines();
