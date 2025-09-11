create table public.player_game_stats (
  id uuid not null default gen_random_uuid (),
  game_id uuid not null,
  player_id uuid not null,
  team_number integer not null,
  shots_attempted integer not null default 0,
  shots_made integer not null default 0,
  cups_hit integer not null default 0,
  catches integer not null default 0,
  redemption_shots integer not null default 0,
  final_score integer not null default 0,
  won boolean not null default false,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint player_game_stats_pkey primary key (id),
  constraint player_game_stats_unique_player_game unique (game_id, player_id),
  constraint player_game_stats_game_id_fkey foreign KEY (game_id) references games (id) on delete CASCADE,
  constraint player_game_stats_player_id_fkey foreign KEY (player_id) references users (id),
  constraint player_game_stats_team_number_check check ((team_number = any (array[1, 2])))
) TABLESPACE pg_default;

create index IF not exists player_game_stats_game_id_idx on public.player_game_stats using btree (game_id) TABLESPACE pg_default;

create index IF not exists player_game_stats_player_id_idx on public.player_game_stats using btree (player_id) TABLESPACE pg_default;

create index IF not exists player_game_stats_won_idx on public.player_game_stats using btree (won) TABLESPACE pg_default;

create index IF not exists player_game_stats_created_at_idx on public.player_game_stats using btree (created_at desc) TABLESPACE pg_default;

create trigger update_player_game_stats_updated_at BEFORE
update on player_game_stats for EACH row
execute FUNCTION handle_updated_at ();