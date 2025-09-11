-- Fix RLS policies for game_events table
-- This allows players in a game to log events for that game

-- Drop existing policies if they exist
drop policy if exists "Players can insert game events" on public.game_events;
drop policy if exists "Players can view game events" on public.game_events;

-- Create policy to allow players to insert game events for games they're participating in
create policy "Players can insert game events"
on public.game_events
for insert
to authenticated
with check (
  exists (
    select 1 from public.games g
    where g.id = game_events.game_id
    and (
      -- Check if user is in team1
      exists (
        select 1 from jsonb_array_elements(g.team1->'players') as p
        where p->>'userId' = auth.uid()::text
      )
      or
      -- Check if user is in team2
      exists (
        select 1 from jsonb_array_elements(g.team2->'players') as p
        where p->>'userId' = auth.uid()::text
      )
    )
  )
);

-- Create policy to allow players to view game events for games they're participating in
create policy "Players can view game events"
on public.game_events
for select
to authenticated
using (
  exists (
    select 1 from public.games g
    where g.id = game_events.game_id
    and (
      -- Check if user is in team1
      exists (
        select 1 from jsonb_array_elements(g.team1->'players') as p
        where p->>'userId' = auth.uid()::text
      )
      or
      -- Check if user is in team2
      exists (
        select 1 from jsonb_array_elements(g.team2->'players') as p
        where p->>'userId' = auth.uid()::text
      )
    )
  )
);
