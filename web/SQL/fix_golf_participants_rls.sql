-- Drop existing RLS policies for golf_tournament_participants if they exist
DROP POLICY IF EXISTS "Enable read access for users" ON public.golf_tournament_participants;
DROP POLICY IF EXISTS "Enable insert for users" ON public.golf_tournament_participants;
DROP POLICY IF EXISTS "Enable update for tournament creators" ON public.golf_tournament_participants;
DROP POLICY IF EXISTS "Enable delete for tournament creators" ON public.golf_tournament_participants;

-- Create comprehensive RLS policies
CREATE POLICY "Enable read access for users"
ON public.golf_tournament_participants
FOR SELECT
TO authenticated
USING (
  -- Allow if user is the tournament creator
  EXISTS (
    SELECT 1 FROM public.golf_tournaments gt
    WHERE gt.id = golf_tournament_participants.tournament_id
    AND gt.created_by = auth.uid()
  )
  OR
  -- Allow if user is a participant
  user_id = auth.uid()
  OR
  -- Allow if tournament is public (status is 'setup' or 'active')
  EXISTS (
    SELECT 1 FROM public.golf_tournaments gt
    WHERE gt.id = golf_tournament_participants.tournament_id
    AND gt.status IN ('setup', 'active')
  )
);

CREATE POLICY "Enable insert for users"
ON public.golf_tournament_participants
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if user is the tournament creator
  EXISTS (
    SELECT 1 FROM public.golf_tournaments gt
    WHERE gt.id = tournament_id
    AND gt.created_by = auth.uid()
  )
  OR
  -- Allow self-registration if tournament is in setup
  (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.golf_tournaments gt
      WHERE gt.id = tournament_id
      AND gt.status = 'setup'
    )
  )
);

CREATE POLICY "Enable update for tournament creators and self"
ON public.golf_tournament_participants
FOR UPDATE
TO authenticated
USING (
  -- Allow if user is the tournament creator
  EXISTS (
    SELECT 1 FROM public.golf_tournaments gt
    WHERE gt.id = golf_tournament_participants.tournament_id
    AND gt.created_by = auth.uid()
  )
  OR
  -- Allow users to update their own records
  user_id = auth.uid()
)
WITH CHECK (
  -- Allow if user is the tournament creator
  EXISTS (
    SELECT 1 FROM public.golf_tournaments gt
    WHERE gt.id = golf_tournament_participants.tournament_id
    AND gt.created_by = auth.uid()
  )
  OR
  -- Allow users to update their own records
  user_id = auth.uid()
);

CREATE POLICY "Enable delete for tournament creators"
ON public.golf_tournament_participants
FOR DELETE
TO authenticated
USING (
  -- Allow if user is the tournament creator
  EXISTS (
    SELECT 1 FROM public.golf_tournaments gt
    WHERE gt.id = golf_tournament_participants.tournament_id
    AND gt.created_by = auth.uid()
  )
  OR
  -- Allow users to delete their own records if tournament is in setup
  (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.golf_tournaments gt
      WHERE gt.id = golf_tournament_participants.tournament_id
      AND gt.status = 'setup'
    )
  )
);
