-- Squash Game Events Schema
-- Transformed from beer pong to squash tournament system

create table public.game_events (
  id uuid not null default gen_random_uuid (),
  game_id uuid not null,
  player_id uuid not null,
  event_type text not null,
  player_number integer not null, -- 1 or 2 (instead of team_number)
  -- Squash-specific event data
  score_after_event jsonb not null default '{
    "player1_points": 0,
    "player2_points": 0,
    "player1_games": 0,
    "player2_games": 0,
    "player1_sets": 0,
    "player2_sets": 0,
    "current_game": 1,
    "current_set": 1,
    "serving_player": 1
  }'::jsonb,
  event_data jsonb null, -- Additional event-specific data
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint game_events_pkey primary key (id),
  constraint game_events_game_id_fkey foreign KEY (game_id) references games (id) on delete CASCADE,
  constraint game_events_player_id_fkey foreign KEY (player_id) references users (id),
  constraint game_events_event_type_check check (
    (
      event_type = any (
        array[
          'match_start'::text,
          'match_end'::text,
          'game_start'::text,
          'game_end'::text,
          'set_start'::text,
          'set_end'::text,
          'point_won'::text,
          'point_lost'::text,
          'serve'::text,
          'fault'::text,
          'let'::text,
          'stroke'::text,
          'timeout'::text,
          'injury'::text
        ]
      )
    )
  ),
  constraint game_events_player_number_check check ((player_number = any (array[1, 2])))
) TABLESPACE pg_default;

create index IF not exists game_events_game_id_idx on public.game_events using btree (game_id) TABLESPACE pg_default;

create index IF not exists game_events_player_id_idx on public.game_events using btree (player_id) TABLESPACE pg_default;

create index IF not exists game_events_event_type_idx on public.game_events using btree (event_type) TABLESPACE pg_default;

create index IF not exists game_events_created_at_idx on public.game_events using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists game_events_player_number_idx on public.game_events using btree (player_number) TABLESPACE pg_default;

-- RLS policies: allow players in the game OR the tournament owner to insert/select
alter table public.game_events enable row level security;

drop policy if exists "Players or owner can insert game events" on public.game_events;
create policy "Players or owner can insert game events"
on public.game_events
for insert
to authenticated
with check (
  exists (
    select 1 from public.games g
    left join public.tournaments t on t.id = g.tournament_id
    where g.id = game_events.game_id
      and (
        -- player1
        (g.player1->>'userId')::uuid = auth.uid()
        or
        -- player2
        (g.player2->>'userId')::uuid = auth.uid()
        or
        -- tournament owner
        (g.is_part_of_tournament = true and t.created_by = auth.uid())
      )
  )
);

drop policy if exists "Players or owner can view game events" on public.game_events;
create policy "Players or owner can view game events"
on public.game_events
for select
to authenticated
using (
  exists (
    select 1 from public.games g
    left join public.tournaments t on t.id = g.tournament_id
    where g.id = game_events.game_id
      and (
        (g.player1->>'userId')::uuid = auth.uid()
        or (g.player2->>'userId')::uuid = auth.uid()
        or (g.is_part_of_tournament = true and t.created_by = auth.uid())
      )
  )
);
