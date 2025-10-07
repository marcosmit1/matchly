-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow authenticated users to read golf tournaments" ON public.golf_tournaments;
DROP POLICY IF EXISTS "Allow creator to insert tournaments" ON public.golf_tournaments;
DROP POLICY IF EXISTS "Allow creator to update own tournaments" ON public.golf_tournaments;

DROP POLICY IF EXISTS "Allow authenticated users to read golf tournament participants" ON public.golf_tournament_participants;
DROP POLICY IF EXISTS "Allow creator to insert participants" ON public.golf_tournament_participants;
DROP POLICY IF EXISTS "Allow creator to update participants" ON public.golf_tournament_participants;
DROP POLICY IF EXISTS "Allow participant to update their own record" ON public.golf_tournament_participants;

DROP POLICY IF EXISTS "Allow authenticated users to read golf scores" ON public.golf_scores;
DROP POLICY IF EXISTS "Allow creator or participant to insert scores" ON public.golf_scores;
DROP POLICY IF EXISTS "Allow creator or participant to update scores" ON public.golf_scores;

-- Golf Tournaments policies
CREATE POLICY "Allow authenticated users to read golf tournaments"
ON public.golf_tournaments FOR SELECT TO authenticated USING (
  status IN ('setup', 'active')
  OR created_by = auth.uid()
);

CREATE POLICY "Allow creator to insert tournaments"
ON public.golf_tournaments FOR INSERT TO authenticated WITH CHECK (
  created_by = auth.uid()
);

CREATE POLICY "Allow creator to update own tournaments"
ON public.golf_tournaments FOR UPDATE TO authenticated USING (
  created_by = auth.uid()
);

-- Golf Tournament Participants policies
CREATE POLICY "Allow authenticated users to read golf tournament participants"
ON public.golf_tournament_participants FOR SELECT TO authenticated USING (
  -- Can see participants if tournament is public
  EXISTS (
    SELECT 1 FROM public.golf_tournaments 
    WHERE id = tournament_id 
    AND status IN ('setup', 'active')
  )
  OR
  -- Can see participants if you're the creator
  EXISTS (
    SELECT 1 FROM public.golf_tournaments 
    WHERE id = tournament_id 
    AND created_by = auth.uid()
  )
  OR
  -- Can see your own record
  user_id = auth.uid()
);

CREATE POLICY "Allow creator to insert participants"
ON public.golf_tournament_participants FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.golf_tournaments 
    WHERE id = tournament_id 
    AND created_by = auth.uid()
  )
);

CREATE POLICY "Allow creator to update participants"
ON public.golf_tournament_participants FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.golf_tournaments 
    WHERE id = tournament_id 
    AND created_by = auth.uid()
  )
  OR
  user_id = auth.uid()
);

-- Golf Scores policies
CREATE POLICY "Allow authenticated users to read golf scores"
ON public.golf_scores FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.golf_tournaments 
    WHERE id = tournament_id 
    AND (status IN ('setup', 'active') OR created_by = auth.uid())
  )
);

CREATE POLICY "Allow creator or participant to insert scores"
ON public.golf_scores FOR INSERT TO authenticated WITH CHECK (
  -- Tournament creator can insert any score
  EXISTS (
    SELECT 1 FROM public.golf_tournaments 
    WHERE id = tournament_id 
    AND created_by = auth.uid()
  )
  OR
  -- Players can insert scores for their own record
  EXISTS (
    SELECT 1 FROM public.golf_tournament_participants
    WHERE tournament_id = golf_scores.tournament_id
    AND id = golf_scores.participant_id
    AND user_id = auth.uid()
  )
  OR
  -- Players can insert scores for guest players in their fourball
  EXISTS (
    SELECT 1 FROM public.golf_tournament_participants AS my_record
    JOIN public.golf_tournament_participants AS target
    ON target.tournament_id = my_record.tournament_id
    AND target.fourball_number = my_record.fourball_number
    WHERE my_record.user_id = auth.uid()
    AND target.id = golf_scores.participant_id
    AND target.is_guest = true
  )
);

-- Use the same rules for updating scores
CREATE POLICY "Allow creator or participant to update scores"
ON public.golf_scores FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.golf_tournaments 
    WHERE id = tournament_id 
    AND created_by = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.golf_tournament_participants
    WHERE tournament_id = golf_scores.tournament_id
    AND id = golf_scores.participant_id
    AND user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.golf_tournament_participants AS my_record
    JOIN public.golf_tournament_participants AS target
    ON target.tournament_id = my_record.tournament_id
    AND target.fourball_number = my_record.fourball_number
    WHERE my_record.user_id = auth.uid()
    AND target.id = golf_scores.participant_id
    AND target.is_guest = true
  )
);
