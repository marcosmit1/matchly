-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read golf tournaments" ON public.golf_tournaments;
DROP POLICY IF EXISTS "Allow creator to insert tournaments" ON public.golf_tournaments;
DROP POLICY IF EXISTS "Allow creator to update own tournaments" ON public.golf_tournaments;

-- Allow reading tournaments if:
-- 1. Tournament is public (status is 'setup' or 'active')
-- 2. User is the creator
-- 3. User is a participant
CREATE POLICY "Allow authenticated users to read golf tournaments"
ON public.golf_tournaments FOR SELECT TO authenticated USING (
  status IN ('setup', 'active')
  OR
  created_by = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.golf_tournament_participants 
    WHERE tournament_id = id 
    AND user_id = auth.uid()
  )
);

-- Allow users to create tournaments
CREATE POLICY "Allow creator to insert tournaments"
ON public.golf_tournaments FOR INSERT TO authenticated WITH CHECK (
  created_by = auth.uid()
);

-- Allow creator to update their own tournaments
CREATE POLICY "Allow creator to update own tournaments"
ON public.golf_tournaments FOR UPDATE TO authenticated USING (
  created_by = auth.uid()
);
