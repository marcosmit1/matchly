-- EMERGENCY: Restore creator access immediately
-- This restores the working creator-only policies

-- Drop all policies that might be causing issues
DROP POLICY IF EXISTS "Tournament creators and players can view" ON public.tournaments;
DROP POLICY IF EXISTS "Tournament teams select" ON public.tournament_teams;
DROP POLICY IF EXISTS "Tournament matches select" ON public.tournament_matches;
DROP POLICY IF EXISTS "Tournament players select" ON public.tournament_team_players;

-- Restore simple creator-only policies that we know work
CREATE POLICY "Tournament creators only"
ON public.tournaments
FOR SELECT
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Tournament teams creators only"
ON public.tournament_teams
FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.created_by = auth.uid())
);

CREATE POLICY "Tournament matches creators only"
ON public.tournament_matches
FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.created_by = auth.uid())
);

CREATE POLICY "Tournament players creators only"
ON public.tournament_team_players
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tournament_teams tt 
    JOIN public.tournaments t ON t.id = tt.tournament_id
    WHERE tt.id = tournament_team_id AND t.created_by = auth.uid()
  )
);

