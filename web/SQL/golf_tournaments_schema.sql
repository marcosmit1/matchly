-- Golf Tournament System Schema
-- Supports individual and team-based golf tournaments with fourballs, scoring, penalties, and social features

BEGIN;

-- Main golf tournaments table
CREATE TABLE IF NOT EXISTS public.golf_tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  course_name TEXT NOT NULL,
  course_par INTEGER NOT NULL DEFAULT 72,
  holes_count INTEGER NOT NULL DEFAULT 18 CHECK (holes_count IN (9, 18)),
  format TEXT NOT NULL DEFAULT 'stroke_play' CHECK (format IN ('stroke_play', 'best_ball', 'scramble')),
  status TEXT NOT NULL DEFAULT 'setup' CHECK (status IN ('setup', 'active', 'completed', 'cancelled')),
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ,
  location TEXT,
  max_players INTEGER DEFAULT 100,
  current_players INTEGER DEFAULT 0,
  invite_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  handicap_enabled BOOLEAN DEFAULT FALSE,
  side_bets_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Golf tournament participants
CREATE TABLE IF NOT EXISTS public.golf_tournament_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.golf_tournaments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  player_name TEXT NOT NULL,
  handicap INTEGER DEFAULT 0,
  fourball_number INTEGER,
  position_in_fourball INTEGER CHECK (position_in_fourball BETWEEN 1 AND 4),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'withdrawn', 'disqualified')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(tournament_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_golf_participants_tournament ON public.golf_tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_golf_participants_fourball ON public.golf_tournament_participants(tournament_id, fourball_number);

-- Golf holes configuration
CREATE TABLE IF NOT EXISTS public.golf_holes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.golf_tournaments(id) ON DELETE CASCADE,
  hole_number INTEGER NOT NULL CHECK (hole_number BETWEEN 1 AND 18),
  par INTEGER NOT NULL CHECK (par BETWEEN 3 AND 5),
  has_closest_to_pin BOOLEAN DEFAULT FALSE,
  has_longest_drive BOOLEAN DEFAULT FALSE,
  description TEXT,
  UNIQUE(tournament_id, hole_number)
);

CREATE INDEX IF NOT EXISTS idx_golf_holes_tournament ON public.golf_holes(tournament_id);

-- Golf scores (hole-by-hole)
CREATE TABLE IF NOT EXISTS public.golf_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.golf_tournaments(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.golf_tournament_participants(id) ON DELETE CASCADE,
  hole_number INTEGER NOT NULL CHECK (hole_number BETWEEN 1 AND 18),
  strokes INTEGER NOT NULL CHECK (strokes > 0 AND strokes <= 15),
  putts INTEGER CHECK (putts >= 0 AND putts <= 10),
  fairway_hit BOOLEAN DEFAULT NULL,
  green_in_regulation BOOLEAN DEFAULT NULL,
  is_eagle BOOLEAN DEFAULT FALSE,
  is_birdie BOOLEAN DEFAULT FALSE,
  is_par BOOLEAN DEFAULT FALSE,
  is_bogey BOOLEAN DEFAULT FALSE,
  is_double_bogey_plus BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(tournament_id, participant_id, hole_number)
);

CREATE INDEX IF NOT EXISTS idx_golf_scores_tournament ON public.golf_scores(tournament_id);
CREATE INDEX IF NOT EXISTS idx_golf_scores_participant ON public.golf_scores(participant_id);
CREATE INDEX IF NOT EXISTS idx_golf_scores_hole ON public.golf_scores(tournament_id, hole_number);

-- Golf penalties tracking
CREATE TABLE IF NOT EXISTS public.golf_penalties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.golf_tournaments(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.golf_tournament_participants(id) ON DELETE CASCADE,
  hole_number INTEGER NOT NULL CHECK (hole_number BETWEEN 1 AND 18),
  penalty_type TEXT NOT NULL CHECK (penalty_type IN ('water', 'ob', 'bunker', '3_putt', 'lost_ball', 'other')),
  strokes_added INTEGER DEFAULT 1,
  reported_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_golf_penalties_tournament ON public.golf_penalties(tournament_id);
CREATE INDEX IF NOT EXISTS idx_golf_penalties_participant ON public.golf_penalties(participant_id);

-- Golf fines (fun/social feature)
CREATE TABLE IF NOT EXISTS public.golf_fines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.golf_tournaments(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_participant_id UUID NOT NULL REFERENCES public.golf_tournament_participants(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 5.00,
  reason TEXT NOT NULL,
  hole_number INTEGER CHECK (hole_number BETWEEN 1 AND 18),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  responded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_golf_fines_tournament ON public.golf_fines(tournament_id);
CREATE INDEX IF NOT EXISTS idx_golf_fines_to_participant ON public.golf_fines(to_participant_id);

-- Golf hole challenges (closest to pin, longest drive)
CREATE TABLE IF NOT EXISTS public.golf_hole_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.golf_tournaments(id) ON DELETE CASCADE,
  hole_number INTEGER NOT NULL CHECK (hole_number BETWEEN 1 AND 18),
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('closest_to_pin', 'longest_drive')),
  winner_participant_id UUID REFERENCES public.golf_tournament_participants(id) ON DELETE SET NULL,
  measurement DECIMAL(10, 2), -- distance in yards/meters or feet/inches
  measurement_unit TEXT DEFAULT 'yards',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(tournament_id, hole_number, challenge_type)
);

CREATE INDEX IF NOT EXISTS idx_golf_challenges_tournament ON public.golf_hole_challenges(tournament_id);

-- Golf activity feed (for social features)
CREATE TABLE IF NOT EXISTS public.golf_activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.golf_tournaments(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES public.golf_tournament_participants(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('score', 'penalty', 'fine', 'achievement', 'challenge_win', 'comment')),
  hole_number INTEGER CHECK (hole_number BETWEEN 1 AND 18),
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_golf_activity_tournament ON public.golf_activity_feed(tournament_id);
CREATE INDEX IF NOT EXISTS idx_golf_activity_created ON public.golf_activity_feed(created_at DESC);

-- Triggers for updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_updated_at') THEN
    CREATE OR REPLACE FUNCTION public.handle_updated_at()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = timezone('utc'::text, now());
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
END $$;

CREATE TRIGGER update_golf_tournaments_updated_at
  BEFORE UPDATE ON public.golf_tournaments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_golf_scores_updated_at
  BEFORE UPDATE ON public.golf_scores
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_golf_hole_challenges_updated_at
  BEFORE UPDATE ON public.golf_hole_challenges
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Row Level Security
ALTER TABLE public.golf_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.golf_tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.golf_holes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.golf_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.golf_penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.golf_fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.golf_hole_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.golf_activity_feed ENABLE ROW LEVEL SECURITY;

-- RLS Policies for golf_tournaments
DROP POLICY IF EXISTS "Anyone can view golf tournaments" ON public.golf_tournaments;
CREATE POLICY "Anyone can view golf tournaments"
  ON public.golf_tournaments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can create golf tournaments" ON public.golf_tournaments;
CREATE POLICY "Users can create golf tournaments"
  ON public.golf_tournaments FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update own golf tournaments" ON public.golf_tournaments;
CREATE POLICY "Users can update own golf tournaments"
  ON public.golf_tournaments FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- RLS Policies for participants
DROP POLICY IF EXISTS "Anyone can view golf participants" ON public.golf_tournament_participants;
CREATE POLICY "Anyone can view golf participants"
  ON public.golf_tournament_participants FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can join golf tournaments" ON public.golf_tournament_participants;
CREATE POLICY "Users can join golf tournaments"
  ON public.golf_tournament_participants FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.golf_tournaments WHERE id = tournament_id AND created_by = auth.uid()
  ));

-- RLS Policies for holes
DROP POLICY IF EXISTS "Anyone can view golf holes" ON public.golf_holes;
CREATE POLICY "Anyone can view golf holes"
  ON public.golf_holes FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Tournament creators can manage holes" ON public.golf_holes;
CREATE POLICY "Tournament creators can manage holes"
  ON public.golf_holes FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.golf_tournaments WHERE id = tournament_id AND created_by = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.golf_tournaments WHERE id = tournament_id AND created_by = auth.uid()
  ));

-- RLS Policies for scores
DROP POLICY IF EXISTS "Anyone can view golf scores" ON public.golf_scores;
CREATE POLICY "Anyone can view golf scores"
  ON public.golf_scores FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Participants can submit own scores" ON public.golf_scores;
CREATE POLICY "Participants can submit own scores"
  ON public.golf_scores FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.golf_tournament_participants
    WHERE id = participant_id AND user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Participants can update own scores" ON public.golf_scores;
CREATE POLICY "Participants can update own scores"
  ON public.golf_scores FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.golf_tournament_participants
    WHERE id = participant_id AND user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.golf_tournament_participants
    WHERE id = participant_id AND user_id = auth.uid()
  ));

-- RLS Policies for penalties
DROP POLICY IF EXISTS "Anyone can view golf penalties" ON public.golf_penalties;
CREATE POLICY "Anyone can view golf penalties"
  ON public.golf_penalties FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Participants can report penalties" ON public.golf_penalties;
CREATE POLICY "Participants can report penalties"
  ON public.golf_penalties FOR INSERT
  TO authenticated
  WITH CHECK (reported_by_user_id = auth.uid());

-- RLS Policies for fines
DROP POLICY IF EXISTS "Anyone can view golf fines" ON public.golf_fines;
CREATE POLICY "Anyone can view golf fines"
  ON public.golf_fines FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Participants can send fines" ON public.golf_fines;
CREATE POLICY "Participants can send fines"
  ON public.golf_fines FOR INSERT
  TO authenticated
  WITH CHECK (from_user_id = auth.uid());

DROP POLICY IF EXISTS "Recipients can respond to fines" ON public.golf_fines;
CREATE POLICY "Recipients can respond to fines"
  ON public.golf_fines FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.golf_tournament_participants
    WHERE id = to_participant_id AND user_id = auth.uid()
  ));

-- RLS Policies for activity feed
DROP POLICY IF EXISTS "Anyone can view golf activity" ON public.golf_activity_feed;
CREATE POLICY "Anyone can view golf activity"
  ON public.golf_activity_feed FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "System can insert golf activity" ON public.golf_activity_feed;
CREATE POLICY "System can insert golf activity"
  ON public.golf_activity_feed FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Helper function to calculate score vs par
CREATE OR REPLACE FUNCTION calculate_score_vs_par(strokes INTEGER, par INTEGER)
RETURNS INTEGER
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT strokes - par;
$$;

-- Helper function to get participant total score
CREATE OR REPLACE FUNCTION get_participant_total_score(p_participant_id UUID)
RETURNS TABLE (
  total_strokes INTEGER,
  total_vs_par INTEGER,
  holes_completed INTEGER,
  birdies INTEGER,
  eagles INTEGER,
  pars INTEGER,
  bogeys INTEGER
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    COALESCE(SUM(gs.strokes), 0)::INTEGER as total_strokes,
    COALESCE(SUM(gs.strokes) - SUM(gh.par), 0)::INTEGER as total_vs_par,
    COUNT(gs.id)::INTEGER as holes_completed,
    COUNT(*) FILTER (WHERE gs.is_birdie)::INTEGER as birdies,
    COUNT(*) FILTER (WHERE gs.is_eagle)::INTEGER as eagles,
    COUNT(*) FILTER (WHERE gs.is_par)::INTEGER as pars,
    COUNT(*) FILTER (WHERE gs.is_bogey OR gs.is_double_bogey_plus)::INTEGER as bogeys
  FROM public.golf_scores gs
  JOIN public.golf_holes gh ON gh.tournament_id = gs.tournament_id AND gh.hole_number = gs.hole_number
  WHERE gs.participant_id = p_participant_id;
$$;

COMMIT;
