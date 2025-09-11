-- Squash Games Schema
-- Transformed from beer pong to squash tournament system

create table public.games (
  id uuid not null default gen_random_uuid (),
  current_player_index integer not null default 0,
  current_player integer not null default 1, -- 1 or 2 (instead of team)
  is_part_of_tournament boolean not null default false,
  status text not null default 'pending'::text,
  tournament_id uuid null,
  winner integer null, -- 1 or 2 (player number)
  player1 jsonb not null default '{"score": 0, "name": "Player 1", "games_won": 0, "sets_won": 0}'::jsonb,
  player2 jsonb not null default '{"score": 0, "name": "Player 2", "games_won": 0, "sets_won": 0}'::jsonb,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  -- Squash-specific fields
  best_of_games integer not null default 3, -- 3 or 5 games
  points_to_win_game integer not null default 11, -- usually 11, can be 9
  current_game integer not null default 1, -- which game we're in (1, 2, 3, etc.)
  current_set integer not null default 1, -- which set we're in (1, 2, 3, etc.)
  detailed_tracking boolean not null default true,
  -- Game state tracking
  game_state jsonb not null default '{
    "current_game": 1,
    "current_set": 1,
    "player1_games": 0,
    "player2_games": 0,
    "player1_sets": 0,
    "player2_sets": 0,
    "player1_current_game_points": 0,
    "player2_current_game_points": 0,
    "serving_player": 1,
    "game_history": []
  }'::jsonb,
  constraint games_pkey primary key (id),
  constraint games_current_player_check check ((current_player = any (array[1, 2]))),
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
  ),
  constraint games_best_of_games_check check ((best_of_games = any (array[3, 5]))),
  constraint games_points_to_win_check check ((points_to_win_game = any (array[9, 11])))
) TABLESPACE pg_default;

create index IF not exists games_status_idx on public.games using btree (status) TABLESPACE pg_default;

create index IF not exists games_is_part_of_tournament_idx on public.games using btree (is_part_of_tournament) TABLESPACE pg_default;

create index IF not exists games_tournament_id_idx on public.games using btree (tournament_id) TABLESPACE pg_default;

create index IF not exists games_created_at_idx on public.games using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists games_player1_idx on public.games using gin (player1) TABLESPACE pg_default;

create index IF not exists games_player2_idx on public.games using gin (player2) TABLESPACE pg_default;

create index IF not exists games_best_of_games_idx on public.games using btree (best_of_games) TABLESPACE pg_default;

create index IF not exists games_detailed_tracking_idx on public.games using btree (detailed_tracking) TABLESPACE pg_default;

create index IF not exists games_game_state_idx on public.games using gin (game_state) TABLESPACE pg_default;

create trigger update_games_updated_at BEFORE
update on games for EACH row
execute FUNCTION handle_updated_at ();

create trigger create_player_game_stats_trigger
after INSERT
or
update on games for EACH row
execute FUNCTION create_player_game_stats ();
