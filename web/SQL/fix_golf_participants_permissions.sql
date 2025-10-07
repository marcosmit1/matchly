-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read golf tournament participants" ON public.golf_tournament_participants;
DROP POLICY IF EXISTS "Allow creator to insert participants" ON public.golf_tournament_participants;
DROP POLICY IF EXISTS "Allow creator to update participants" ON public.golf_tournament_participants;
DROP POLICY IF EXISTS "Allow participant to update their own record" ON public.golf_tournament_participants;

-- Allow users to read participants if:
-- 1. They are the tournament creator
-- 2. They are a participant in the tournament
-- 3. They are in the same fourball as the participant
CREATE POLICY "Allow authenticated users to read golf tournament participants"
ON public.golf_tournament_participants FOR SELECT TO authenticated USING (
  -- Tournament creator can see all
  EXISTS (
    SELECT 1 FROM public.golf_tournaments 
    WHERE id = tournament_id 
    AND created_by = auth.uid()
  )
  OR
  -- User is a participant in this tournament
  EXISTS (
    SELECT 1 FROM public.golf_tournament_participants 
    WHERE tournament_id = golf_tournament_participants.tournament_id 
    AND user_id = auth.uid()
  )
  OR
  -- User is in the same fourball
  EXISTS (
    SELECT 1 FROM public.golf_tournament_participants AS my_participation
    WHERE my_participation.tournament_id = golf_tournament_participants.tournament_id
    AND my_participation.user_id = auth.uid()
    AND my_participation.fourball_number = golf_tournament_participants.fourball_number
    AND my_participation.fourball_number IS NOT NULL
  )
);

-- Allow tournament creator to insert participants
CREATE POLICY "Allow creator to insert participants"
ON public.golf_tournament_participants FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.golf_tournaments 
    WHERE id = tournament_id 
    AND created_by = auth.uid()
  )
);

-- Allow tournament creator to update any participant
CREATE POLICY "Allow creator to update participants"
ON public.golf_tournament_participants FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.golf_tournaments 
    WHERE id = tournament_id 
    AND created_by = auth.uid()
  )
);

-- Allow participants to update their own record
CREATE POLICY "Allow participant to update their own record"
ON public.golf_tournament_participants FOR UPDATE TO authenticated USING (
  user_id = auth.uid()
  OR
  -- Also allow updating guest players in the same fourball
  (
    is_guest = true
    AND EXISTS (
      SELECT 1 FROM public.golf_tournament_participants AS my_participation
      WHERE my_participation.tournament_id = golf_tournament_participants.tournament_id
      AND my_participation.user_id = auth.uid()
      AND my_participation.fourball_number = golf_tournament_participants.fourball_number
      AND my_participation.fourball_number IS NOT NULL
    )
  )
);
