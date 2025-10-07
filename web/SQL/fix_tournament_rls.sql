-- Fix tournament RLS to allow invited players to view tournaments

-- Drop existing restrictive policy
drop policy if exists "Users can manage own tournaments" on public.tournaments;

-- Create new policy that allows both creators and invited players to view tournaments
create policy "Users can view and manage relevant tournaments"
on public.tournaments
for all
to authenticated
using (
  -- Tournament creator can do everything
  created_by = auth.uid()
  OR
  -- Users who are players in the tournament can view it
  exists (
    select 1 
    from public.tournament_teams tt
    join public.tournament_team_players ttp on ttp.tournament_team_id = tt.id
    join public.users u on u.email = ttp.player_name  -- assuming player_name contains email
    where tt.tournament_id = tournaments.id 
    and u.id = auth.uid()
  )
)
with check (
  -- Only creators can modify tournaments
  created_by = auth.uid()
);

-- Also update team policy to allow invited players to view teams
drop policy if exists "Users can manage teams in own tournaments" on public.tournament_teams;
create policy "Users can view teams in relevant tournaments"
on public.tournament_teams
for all
to authenticated
using (
  -- Tournament creator can do everything
  exists (select 1 from public.tournaments t where t.id = tournament_id and t.created_by = auth.uid())
  OR
  -- Users who are players in the tournament can view teams
  exists (
    select 1 
    from public.tournament_team_players ttp
    join public.users u on u.email = ttp.player_name
    where ttp.tournament_team_id = tournament_teams.id 
    and u.id = auth.uid()
  )
)
with check (
  -- Only creators can modify teams
  exists (select 1 from public.tournaments t where t.id = tournament_id and t.created_by = auth.uid())
);

-- Update matches policy to allow invited players to view matches
drop policy if exists "Users can manage matches in own tournaments" on public.tournament_matches;
create policy "Users can view matches in relevant tournaments"
on public.tournament_matches
for all
to authenticated
using (
  -- Tournament creator can do everything
  exists (
    select 1 from public.tournaments t where t.id = tournament_id and t.created_by = auth.uid()
  )
  OR
  -- Users who are players in the tournament can view matches
  exists (
    select 1 
    from public.tournament_teams tt
    join public.tournament_team_players ttp on ttp.tournament_team_id = tt.id
    join public.users u on u.email = ttp.player_name
    where tt.tournament_id = tournament_matches.tournament_id 
    and u.id = auth.uid()
  )
)
with check (
  -- Only creators can modify matches, but system can update match results
  exists (select 1 from public.tournaments t where t.id = tournament_id and t.created_by = auth.uid())
);

-- Update players policy to allow invited players to view other players
drop policy if exists "Users can manage players in own tournaments" on public.tournament_team_players;
create policy "Users can view players in relevant tournaments"
on public.tournament_team_players
for all
to authenticated
using (
  -- Tournament creator can do everything
  exists (
    select 1 from public.tournament_teams tt 
    join public.tournaments t on t.id = tt.tournament_id
    where tt.id = tournament_team_id and t.created_by = auth.uid()
  )
  OR
  -- Users who are players in the tournament can view other players
  exists (
    select 1 
    from public.tournament_teams tt
    join public.tournament_team_players ttp2 on ttp2.tournament_team_id = tt.id
    join public.users u on u.email = ttp2.player_name
    where tt.tournament_id = (
      select t2.tournament_id 
      from public.tournament_teams t2 
      where t2.id = tournament_team_id
    )
    and u.id = auth.uid()
  )
)
with check (
  -- Only creators can modify players
  exists (
    select 1 from public.tournament_teams tt 
    join public.tournaments t on t.id = tt.tournament_id
    where tt.id = tournament_team_id and t.created_by = auth.uid()
  )
);
