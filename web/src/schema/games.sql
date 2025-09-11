create table public.games (
  id uuid not null default gen_random_uuid (),
  current_player_index integer not null default 0,
  current_team integer not null default 1,
  is_part_of_tournament boolean not null default false,
  status text not null default 'pending'::text,
  tournament_id uuid null,
  winner integer null,
  team1 jsonb not null default '{"score": 0, "players": [], "team_name": "Team 1"}'::jsonb,
  team2 jsonb not null default '{"score": 0, "players": [], "team_name": "Team 2"}'::jsonb,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  cup_formation text not null default '10'::text,
  total_cups_per_team integer not null default 10,
  detailed_tracking boolean not null default true,
  constraint games_pkey primary key (id),
  constraint games_current_team_check check ((current_team = any (array[1, 2]))),
  constraint games_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'active'::text,
          'completed'::text,
          'cancelled'::text
        ]
      )
    )
  ),
  constraint games_winner_check check (
    (
      (winner = any (array[1, 2]))
      or (winner is null)
    )
  )
) TABLESPACE pg_default;

create index IF not exists games_status_idx on public.games using btree (status) TABLESPACE pg_default;

create index IF not exists games_is_part_of_tournament_idx on public.games using btree (is_part_of_tournament) TABLESPACE pg_default;

create index IF not exists games_tournament_id_idx on public.games using btree (tournament_id) TABLESPACE pg_default;

create index IF not exists games_created_at_idx on public.games using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists games_team1_idx on public.games using gin (team1) TABLESPACE pg_default;

create index IF not exists games_team2_idx on public.games using gin (team2) TABLESPACE pg_default;

create index IF not exists games_cup_formation_idx on public.games using btree (cup_formation) TABLESPACE pg_default;

create index IF not exists games_detailed_tracking_idx on public.games using btree (detailed_tracking) TABLESPACE pg_default;

create trigger update_games_updated_at BEFORE
update on games for EACH row
execute FUNCTION handle_updated_at ();

create trigger create_player_game_stats_trigger
after INSERT
or
update on games for EACH row
execute FUNCTION create_player_game_stats ();