-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read golf scores" ON public.golf_scores;
DROP POLICY IF EXISTS "Allow creator or participant to insert scores" ON public.golf_scores;
DROP POLICY IF EXISTS "Allow creator or participant to update scores" ON public.golf_scores;
DROP POLICY IF EXISTS "Allow creator or participant to delete scores" ON public.golf_scores;

-- Allow reading scores if you're in the tournament
CREATE POLICY "Allow authenticated users to read golf scores"
ON public.golf_scores FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.golf_tournament_participants 
    WHERE tournament_id = golf_scores.tournament_id 
    AND user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.golf_tournaments 
    WHERE id = tournament_id 
    AND created_by = auth.uid()
  )
);

-- Allow inserting/updating/deleting scores if:
-- 1. You're the tournament creator, OR
-- 2. You're a participant in the tournament (any participant can score for anyone)
CREATE POLICY "Allow creator or participant to insert scores"
ON public.golf_scores FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.golf_tournament_participants 
    WHERE tournament_id = golf_scores.tournament_id 
    AND user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.golf_tournaments 
    WHERE id = tournament_id 
    AND created_by = auth.uid()
  )
);

CREATE POLICY "Allow creator or participant to update scores"
ON public.golf_scores FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.golf_tournament_participants 
    WHERE tournament_id = tournament_id 
    AND user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.golf_tournaments 
    WHERE id = tournament_id 
    AND created_by = auth.uid()
  )
);

CREATE POLICY "Allow creator or participant to delete scores"
ON public.golf_scores FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.golf_tournament_participants 
    WHERE tournament_id = tournament_id 
    AND user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.golf_tournaments 
    WHERE id = tournament_id 
    AND created_by = auth.uid()
  )
);
