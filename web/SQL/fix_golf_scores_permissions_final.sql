-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read golf scores" ON public.golf_scores;
DROP POLICY IF EXISTS "Allow creator or participant to insert scores" ON public.golf_scores;
DROP POLICY IF EXISTS "Allow creator or participant to update scores" ON public.golf_scores;

-- Allow reading scores if:
-- 1. User is tournament creator
-- 2. User is a participant in the tournament
CREATE POLICY "Allow authenticated users to read golf scores"
ON public.golf_scores FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.golf_tournaments 
    WHERE id = tournament_id 
    AND created_by = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.golf_tournament_participants 
    WHERE tournament_id = golf_scores.tournament_id 
    AND user_id = auth.uid()
  )
);

-- Allow inserting scores if:
-- 1. User is tournament creator, OR
-- 2. User is in the same fourball as the participant they're scoring for
CREATE POLICY "Allow creator or participant to insert scores"
ON public.golf_scores FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.golf_tournaments 
    WHERE id = tournament_id 
    AND created_by = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.golf_tournament_participants AS scorer
    JOIN public.golf_tournament_participants AS target 
      ON target.tournament_id = scorer.tournament_id 
      AND target.fourball_number = scorer.fourball_number
    WHERE scorer.tournament_id = golf_scores.tournament_id
      AND target.id = golf_scores.participant_id
      AND scorer.user_id = auth.uid()
      AND scorer.fourball_number IS NOT NULL
  )
);

-- Allow updating scores with the same rules as inserting
CREATE POLICY "Allow creator or participant to update scores"
ON public.golf_scores FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.golf_tournaments 
    WHERE id = tournament_id 
    AND created_by = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.golf_tournament_participants AS scorer
    JOIN public.golf_tournament_participants AS target 
      ON target.tournament_id = scorer.tournament_id 
      AND target.fourball_number = scorer.fourball_number
    WHERE scorer.tournament_id = golf_scores.tournament_id
      AND target.id = golf_scores.participant_id
      AND scorer.user_id = auth.uid()
      AND scorer.fourball_number IS NOT NULL
  )
);

-- Allow deleting scores with the same rules
CREATE POLICY "Allow creator or participant to delete scores"
ON public.golf_scores FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.golf_tournaments 
    WHERE id = tournament_id 
    AND created_by = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.golf_tournament_participants AS scorer
    JOIN public.golf_tournament_participants AS target 
      ON target.tournament_id = scorer.tournament_id 
      AND target.fourball_number = scorer.fourball_number
    WHERE scorer.tournament_id = golf_scores.tournament_id
      AND target.id = golf_scores.participant_id
      AND scorer.user_id = auth.uid()
      AND scorer.fourball_number IS NOT NULL
  )
);
