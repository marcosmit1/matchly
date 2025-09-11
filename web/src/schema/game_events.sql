create table public.game_events (
  id uuid not null default gen_random_uuid (),
  game_id uuid not null,
  player_id uuid not null,
  event_type text not null,
  team_number integer not null,
  cup_position integer null,
  score_after_event jsonb not null default '{"team1_cups": 10, "team2_cups": 10, "team1_score": 0, "team2_score": 0}'::jsonb,
  event_data jsonb null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint game_events_pkey primary key (id),
  constraint game_events_game_id_fkey foreign KEY (game_id) references games (id) on delete CASCADE,
  constraint game_events_player_id_fkey foreign KEY (player_id) references users (id),
  constraint game_events_cup_position_check check (
    (
      (cup_position is null)
      or (
        (cup_position >= 0)
        and (cup_position <= 15)
      )
    )
  ),
  constraint game_events_event_type_check check (
    (
      event_type = any (
        array[
          'game_start'::text,
          'game_end'::text,
          'shot_hit'::text,
          'shot_miss'::text,
          'reshuffle'::text,
          'island'::text,
          'catch'::text,
          'redemption_start'::text,
          'redemption_end'::text
        ]
      )
    )
  ),
  constraint game_events_team_number_check check ((team_number = any (array[1, 2])))
) TABLESPACE pg_default;

create index IF not exists game_events_game_id_idx on public.game_events using btree (game_id) TABLESPACE pg_default;

create index IF not exists game_events_player_id_idx on public.game_events using btree (player_id) TABLESPACE pg_default;

create index IF not exists game_events_event_type_idx on public.game_events using btree (event_type) TABLESPACE pg_default;

create index IF not exists game_events_created_at_idx on public.game_events using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists game_events_team_number_idx on public.game_events using btree (team_number) TABLESPACE pg_default;

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
        -- player in team1
        exists (
          select 1 from jsonb_array_elements(g.team1->'players') as p
          where p->>'userId' = auth.uid()::text
        )
        or
        -- player in team2
        exists (
          select 1 from jsonb_array_elements(g.team2->'players') as p
          where p->>'userId' = auth.uid()::text
        )
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
        exists (
          select 1 from jsonb_array_elements(g.team1->'players') as p
          where p->>'userId' = auth.uid()::text
        )
        or exists (
          select 1 from jsonb_array_elements(g.team2->'players') as p
          where p->>'userId' = auth.uid()::text
        )
        or (g.is_part_of_tournament = true and t.created_by = auth.uid())
      )
  )
);