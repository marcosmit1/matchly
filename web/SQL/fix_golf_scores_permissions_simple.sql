-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read golf scores" ON public.golf_scores;
DROP POLICY IF EXISTS "Allow creator or participant to insert scores" ON public.golf_scores;
DROP POLICY IF EXISTS "Allow creator or participant to update scores" ON public.golf_scores;
DROP POLICY IF EXISTS "Allow creator or participant to delete scores" ON public.golf_scores;

-- First, create a function to check if a user is in the same fourball
CREATE OR REPLACE FUNCTION public.is_in_same_fourball(tournament_id UUID, participant_id UUID, user_uid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_fourball INT;
    target_fourball INT;
BEGIN
    -- Get user's fourball number
    SELECT fourball_number INTO user_fourball
    FROM public.golf_tournament_participants
    WHERE tournament_id = $1 AND user_id = $3;

    -- Get target participant's fourball number
    SELECT fourball_number INTO target_fourball
    FROM public.golf_tournament_participants
    WHERE id = $2;

    -- Return true if they're in the same fourball
    RETURN (user_fourball IS NOT NULL AND user_fourball = target_fourball);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  public.is_in_same_fourball(tournament_id, participant_id, auth.uid())
);

-- Allow updating scores with the same rules
CREATE POLICY "Allow creator or participant to update scores"
ON public.golf_scores FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.golf_tournaments 
    WHERE id = tournament_id 
    AND created_by = auth.uid()
  )
  OR
  public.is_in_same_fourball(tournament_id, participant_id, auth.uid())
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
  public.is_in_same_fourball(tournament_id, participant_id, auth.uid())
);
