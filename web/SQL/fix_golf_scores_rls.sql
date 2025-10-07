-- Drop existing RLS policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.golf_scores;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.golf_scores;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.golf_scores;

-- Create new RLS policies
ALTER TABLE public.golf_scores ENABLE ROW LEVEL SECURITY;

-- Read policy - Allow all authenticated users to read scores
CREATE POLICY "Enable read access for all users" ON public.golf_scores
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Insert/Update policy - Allow if:
-- 1. User is tournament creator, OR
-- 2. Score is for a guest player
CREATE POLICY "Enable insert/update for tournament creators and guest scores" ON public.golf_scores
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.golf_tournaments t
      WHERE t.id = golf_scores.tournament_id
      AND t.created_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.golf_tournament_participants p
      WHERE p.id = golf_scores.participant_id
      AND p.is_guest = true
    )
  );
