-- Fix tournament RLS properly - allow both creators and invited players

-- First, let's create a simpler policy that definitely works for creators
-- and gradually add invited player access

-- Drop all existing policies
drop policy if exists "Users can view and manage relevant tournaments" on public.tournaments;
drop policy if exists "Users can view teams in relevant tournaments" on public.tournament_teams;
drop policy if exists "Users can view matches in relevant tournaments" on public.tournament_matches;
drop policy if exists "Users can view players in relevant tournaments" on public.tournament_team_players;

-- Start with basic creator-only policy (should work)
create policy "Tournament creators and players can view"
on public.tournaments
for select
to authenticated
using (
  -- Tournament creator can view
  created_by = auth.uid()
  -- OR invited players can view (commented out for now to test creator access first)
  -- OR exists (
  --   select 1 
  --   from public.tournament_teams tt
  --   join public.tournament_team_players ttp on ttp.tournament_team_id = tt.id
  --   join public.users u on u.email = ttp.player_name
  --   where tt.tournament_id = tournaments.id 
  --   and u.id = auth.uid()
  -- )
);

-- Separate policies for tournament modifications (creators only)
create policy "Tournament creators can insert"
on public.tournaments
for insert
to authenticated
with check (created_by = auth.uid());

create policy "Tournament creators can update"
on public.tournaments
for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

create policy "Tournament creators can delete"
on public.tournaments
for delete
to authenticated
using (created_by = auth.uid());

-- Teams policy - creators only for now
create policy "Tournament teams select"
on public.tournament_teams
for select
to authenticated
using (
  exists (select 1 from public.tournaments t where t.id = tournament_id and t.created_by = auth.uid())
);

create policy "Tournament teams insert"
on public.tournament_teams
for insert
to authenticated
with check (
  exists (select 1 from public.tournaments t where t.id = tournament_id and t.created_by = auth.uid())
);

create policy "Tournament teams update"
on public.tournament_teams
for update
to authenticated
using (
  exists (select 1 from public.tournaments t where t.id = tournament_id and t.created_by = auth.uid())
)
with check (
  exists (select 1 from public.tournaments t where t.id = tournament_id and t.created_by = auth.uid())
);

create policy "Tournament teams delete"
on public.tournament_teams
for delete
to authenticated
using (
  exists (select 1 from public.tournaments t where t.id = tournament_id and t.created_by = auth.uid())
);

-- Matches policy - creators only for now
create policy "Tournament matches select"
on public.tournament_matches
for select
to authenticated
using (
  exists (select 1 from public.tournaments t where t.id = tournament_id and t.created_by = auth.uid())
);

create policy "Tournament matches insert"
on public.tournament_matches
for insert
to authenticated
with check (
  exists (select 1 from public.tournaments t where t.id = tournament_id and t.created_by = auth.uid())
);

create policy "Tournament matches update"
on public.tournament_matches
for update
to authenticated
using (
  exists (select 1 from public.tournaments t where t.id = tournament_id and t.created_by = auth.uid())
)
with check (
  exists (select 1 from public.tournaments t where t.id = tournament_id and t.created_by = auth.uid())
);

create policy "Tournament matches delete"
on public.tournament_matches
for delete
to authenticated
using (
  exists (select 1 from public.tournaments t where t.id = tournament_id and t.created_by = auth.uid())
);

-- Players policy - creators only for now
create policy "Tournament players select"
on public.tournament_team_players
for select
to authenticated
using (
  exists (
    select 1 from public.tournament_teams tt 
    join public.tournaments t on t.id = tt.tournament_id
    where tt.id = tournament_team_id and t.created_by = auth.uid()
  )
);

create policy "Tournament players insert"
on public.tournament_team_players
for insert
to authenticated
with check (
  exists (
    select 1 from public.tournament_teams tt 
    join public.tournaments t on t.id = tt.tournament_id
    where tt.id = tournament_team_id and t.created_by = auth.uid()
  )
);

create policy "Tournament players update"
on public.tournament_team_players
for update
to authenticated
using (
  exists (
    select 1 from public.tournament_teams tt 
    join public.tournaments t on t.id = tt.tournament_id
    where tt.id = tournament_team_id and t.created_by = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.tournament_teams tt 
    join public.tournaments t on t.id = tt.tournament_id
    where tt.id = tournament_team_id and t.created_by = auth.uid()
  )
);

create policy "Tournament players delete"
on public.tournament_team_players
for delete
to authenticated
using (
  exists (
    select 1 from public.tournament_teams tt 
    join public.tournaments t on t.id = tt.tournament_id
    where tt.id = tournament_team_id and t.created_by = auth.uid()
  )
);
