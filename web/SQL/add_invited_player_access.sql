-- Add invited player access to tournament viewing
-- This adds to the existing policies without breaking creator access

-- Update the tournaments SELECT policy to include invited players
DROP POLICY IF EXISTS "Tournament creators and players can view" ON public.tournaments;

CREATE POLICY "Tournament creators and players can view"
ON public.tournaments
FOR SELECT
TO authenticated
USING (
  -- Tournament creator can view
  created_by = auth.uid()
  OR
  -- Invited players can view tournaments they're participating in
  EXISTS (
    SELECT 1 
    FROM public.tournament_teams tt
    JOIN public.tournament_team_players ttp ON ttp.tournament_team_id = tt.id
    JOIN public.users u ON u.email = ttp.player_name
    WHERE tt.tournament_id = tournaments.id 
    AND u.id = auth.uid()
  )
);

-- Update teams SELECT policy to include invited players
DROP POLICY IF EXISTS "Tournament teams select" ON public.tournament_teams;

CREATE POLICY "Tournament teams select"
ON public.tournament_teams
FOR SELECT
TO authenticated
USING (
  -- Tournament creator can view
  EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.created_by = auth.uid())
  OR
  -- Invited players can view teams in tournaments they're participating in
  EXISTS (
    SELECT 1 
    FROM public.tournament_team_players ttp
    JOIN public.users u ON u.email = ttp.player_name
    WHERE ttp.tournament_team_id = tournament_teams.id 
    AND u.id = auth.uid()
  )
);

-- Update matches SELECT policy to include invited players
DROP POLICY IF EXISTS "Tournament matches select" ON public.tournament_matches;

CREATE POLICY "Tournament matches select"
ON public.tournament_matches
FOR SELECT
TO authenticated
USING (
  -- Tournament creator can view
  EXISTS (
    SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.created_by = auth.uid()
  )
  OR
  -- Invited players can view matches in tournaments they're participating in
  EXISTS (
    SELECT 1 
    FROM public.tournament_teams tt
    JOIN public.tournament_team_players ttp ON ttp.tournament_team_id = tt.id
    JOIN public.users u ON u.email = ttp.player_name
    WHERE tt.tournament_id = tournament_matches.tournament_id 
    AND u.id = auth.uid()
  )
);

-- Update players SELECT policy to include invited players
DROP POLICY IF EXISTS "Tournament players select" ON public.tournament_team_players;

CREATE POLICY "Tournament players select"
ON public.tournament_team_players
FOR SELECT
TO authenticated
USING (
  -- Tournament creator can view
  EXISTS (
    SELECT 1 FROM public.tournament_teams tt 
    JOIN public.tournaments t ON t.id = tt.tournament_id
    WHERE tt.id = tournament_team_id AND t.created_by = auth.uid()
  )
  OR
  -- Invited players can view all players in tournaments they're participating in
  EXISTS (
    SELECT 1 
    FROM public.tournament_teams tt
    JOIN public.tournament_team_players ttp2 ON ttp2.tournament_team_id = tt.id
    JOIN public.users u ON u.email = ttp2.player_name
    WHERE tt.tournament_id = (
      SELECT t2.tournament_id 
      FROM public.tournament_teams t2 
      WHERE t2.id = tournament_team_id
    )
    AND u.id = auth.uid()
  )
);
