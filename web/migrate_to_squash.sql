-- Migration script to transform beer pong app to squash tournament app
-- Run this script on your new Supabase project

-- Create utility functions first
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create player game stats function (placeholder - you can customize this)
CREATE OR REPLACE FUNCTION public.create_player_game_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- This function can be customized to create player statistics
  -- For now, it's a placeholder that does nothing
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- First, drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS public.game_events CASCADE;
DROP TABLE IF EXISTS public.tournament_matches CASCADE;
DROP TABLE IF EXISTS public.tournament_team_players CASCADE;
DROP TABLE IF EXISTS public.tournament_teams CASCADE;
DROP TABLE IF EXISTS public.tournaments CASCADE;
DROP TABLE IF EXISTS public.games CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.venues CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Create the users table first (required for foreign keys)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own data
CREATE POLICY "Users can manage own profile" ON public.users
  FOR ALL USING (auth.uid() = id);

-- Create trigger for users updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create the updated games table for squash
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

-- Create indexes for games
create index IF not exists games_status_idx on public.games using btree (status) TABLESPACE pg_default;
create index IF not exists games_is_part_of_tournament_idx on public.games using btree (is_part_of_tournament) TABLESPACE pg_default;
create index IF not exists games_tournament_id_idx on public.games using btree (tournament_id) TABLESPACE pg_default;
create index IF not exists games_created_at_idx on public.games using btree (created_at desc) TABLESPACE pg_default;
create index IF not exists games_player1_idx on public.games using gin (player1) TABLESPACE pg_default;
create index IF not exists games_player2_idx on public.games using gin (player2) TABLESPACE pg_default;
create index IF not exists games_best_of_games_idx on public.games using btree (best_of_games) TABLESPACE pg_default;
create index IF not exists games_detailed_tracking_idx on public.games using btree (detailed_tracking) TABLESPACE pg_default;
create index IF not exists games_game_state_idx on public.games using gin (game_state) TABLESPACE pg_default;

-- Create the updated game events table for squash
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

-- Create indexes for game events
create index IF not exists game_events_game_id_idx on public.game_events using btree (game_id) TABLESPACE pg_default;
create index IF not exists game_events_player_id_idx on public.game_events using btree (player_id) TABLESPACE pg_default;
create index IF not exists game_events_event_type_idx on public.game_events using btree (event_type) TABLESPACE pg_default;
create index IF not exists game_events_created_at_idx on public.game_events using btree (created_at desc) TABLESPACE pg_default;
create index IF not exists game_events_player_number_idx on public.game_events using btree (player_number) TABLESPACE pg_default;

-- Create the updated tournaments table for squash
create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.users(id) on delete cascade,
  name text not null,
  status text not null default 'setup', -- setup | active | completed | canceled
  join_token text not null unique default encode(gen_random_bytes(6), 'hex'),
  -- Squash-specific tournament settings
  tournament_type text not null default 'single_elimination', -- single_elimination | double_elimination | round_robin
  best_of_games integer not null default 3, -- 3 or 5 games per match
  points_to_win_game integer not null default 11, -- points needed to win a game
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- Create the updated tournament players table (individual players instead of teams)
create table if not exists public.tournament_players (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  player_name text not null,
  player_user_id uuid references public.users(id) on delete set null,
  seed integer, -- seeding for bracket placement
  -- Player stats for this tournament
  matches_played integer not null default 0,
  matches_won integer not null default 0,
  games_won integer not null default 0,
  games_lost integer not null default 0,
  points_won integer not null default 0,
  points_lost integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now())
);
create index if not exists tournament_players_tournament_idx on public.tournament_players(tournament_id);
create index if not exists tournament_players_user_idx on public.tournament_players(player_user_id);

-- Create the updated tournament matches table (individual vs individual)
create table if not exists public.tournament_matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  round integer not null,
  match_index integer not null,
  player_a_id uuid references public.tournament_players(id) on delete set null,
  player_b_id uuid references public.tournament_players(id) on delete set null,
  winner_player_id uuid references public.tournament_players(id) on delete set null,
  status text not null default 'pending', -- pending | in_progress | complete
  game_id uuid references public.games(id) on delete set null,
  -- Match details
  best_of_games integer not null default 3,
  points_to_win_game integer not null default 11,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);
create index if not exists tournament_matches_tournament_idx on public.tournament_matches(tournament_id);

-- Create the updated venues table for squash courts
create table public.venues (
  id uuid not null default gen_random_uuid(),
  name text not null,
  address text not null,
  city text not null,
  state text not null,
  zip_code text not null,
  phone text null,
  email text null,
  description text null,
  number_of_courts integer not null default 1, -- Changed from tables to courts
  price_per_hour decimal(10,2) not null default 25.00, -- Typical squash court pricing
  hours_of_operation jsonb null default '{
    "monday": {"open": "06:00", "close": "22:00"}, 
    "tuesday": {"open": "06:00", "close": "22:00"}, 
    "wednesday": {"open": "06:00", "close": "22:00"}, 
    "thursday": {"open": "06:00", "close": "22:00"}, 
    "friday": {"open": "06:00", "close": "22:00"}, 
    "saturday": {"open": "08:00", "close": "20:00"}, 
    "sunday": {"open": "08:00", "close": "20:00"}
  }'::jsonb,
  amenities jsonb null default '[
    "Changing rooms",
    "Shower facilities", 
    "Equipment rental",
    "Pro shop",
    "Parking",
    "WiFi"
  ]'::jsonb,
  images jsonb null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  constraint venues_pkey primary key (id),
  constraint venues_number_of_courts_check check (number_of_courts > 0),
  constraint venues_price_per_hour_check check (price_per_hour >= 0)
) tablespace pg_default;

-- Create the updated bookings table for squash courts
create table public.bookings (
  id uuid not null default gen_random_uuid(),
  venue_id uuid not null,
  user_id uuid not null,
  court_number integer not null, -- Changed from table_number to court_number
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  status text not null default 'pending',
  total_amount decimal(10,2) not null,
  payment_status text not null default 'pending',
  payment_intent_id text null,
  special_requests text null,
  number_of_players integer not null default 2, -- Squash is typically 2 players (singles) or 4 (doubles)
  booking_type text not null default 'singles', -- singles | doubles | practice | lesson
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  constraint bookings_pkey primary key (id),
  constraint bookings_venue_id_fkey foreign key (venue_id) references public.venues (id) on delete cascade,
  constraint bookings_user_id_fkey foreign key (user_id) references public.users (id) on delete cascade,
  constraint bookings_status_check check (
    status = any (array[
      'pending'::text,
      'confirmed'::text,
      'active'::text,
      'completed'::text,
      'cancelled'::text,
      'no_show'::text
    ])
  ),
  constraint bookings_payment_status_check check (
    payment_status = any (array[
      'pending'::text,
      'processing'::text,
      'succeeded'::text,
      'failed'::text,
      'cancelled'::text,
      'refunded'::text
    ])
  ),
  constraint bookings_court_number_check check (court_number > 0),
  constraint bookings_time_check check (end_time > start_time),
  constraint bookings_total_amount_check check (total_amount >= 0),
  constraint bookings_number_of_players_check check (number_of_players between 1 and 4),
  constraint bookings_booking_type_check check (
    booking_type = any (array[
      'singles'::text,
      'doubles'::text,
      'practice'::text,
      'lesson'::text
    ])
  )
) tablespace pg_default;

-- Create all necessary indexes
create index if not exists venues_city_idx on public.venues using btree (city) tablespace pg_default;
create index if not exists venues_state_idx on public.venues using btree (state) tablespace pg_default;
create index if not exists venues_is_active_idx on public.venues using btree (is_active) tablespace pg_default;
create index if not exists venues_created_at_idx on public.venues using btree (created_at desc) tablespace pg_default;

create index if not exists bookings_venue_id_idx on public.bookings using btree (venue_id) tablespace pg_default;
create index if not exists bookings_user_id_idx on public.bookings using btree (user_id) tablespace pg_default;
create index if not exists bookings_status_idx on public.bookings using btree (status) tablespace pg_default;
create index if not exists bookings_payment_status_idx on public.bookings using btree (payment_status) tablespace pg_default;
create index if not exists bookings_start_time_idx on public.bookings using btree (start_time) tablespace pg_default;
create index if not exists bookings_end_time_idx on public.bookings using btree (end_time) tablespace pg_default;
create index if not exists bookings_created_at_idx on public.bookings using btree (created_at desc) tablespace pg_default;
create index if not exists bookings_booking_type_idx on public.bookings using btree (booking_type) tablespace pg_default;

-- Compound index for checking availability
create index if not exists bookings_venue_court_time_idx on public.bookings 
using btree (venue_id, court_number, start_time, end_time) tablespace pg_default;

-- Create triggers
create trigger update_games_updated_at BEFORE
update on games for EACH row
execute FUNCTION handle_updated_at ();

create trigger create_player_game_stats_trigger
after INSERT
or
update on games for EACH row
execute FUNCTION create_player_game_stats ();

create trigger update_venues_updated_at before update
on venues for each row execute function handle_updated_at();

create trigger update_bookings_updated_at before update
on bookings for each row execute function handle_updated_at();

create trigger update_tournaments_updated_at before update on public.tournaments for each row execute function public.handle_updated_at();

create trigger update_tournament_matches_updated_at before update on public.tournament_matches for each row execute function public.handle_updated_at();

-- Enable RLS
alter table public.tournaments enable row level security;
alter table public.tournament_players enable row level security;
alter table public.tournament_matches enable row level security;
alter table public.game_events enable row level security;

-- Create RLS policies
drop policy if exists "Users can manage own tournaments" on public.tournaments;
create policy "Users can manage own tournaments"
on public.tournaments
for all
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

drop policy if exists "Users can manage players in own tournaments" on public.tournament_players;
create policy "Users can manage players in own tournaments"
on public.tournament_players
for all
to authenticated
using (exists (select 1 from public.tournaments t where t.id = tournament_id and t.created_by = auth.uid()))
with check (exists (select 1 from public.tournaments t where t.id = tournament_id and t.created_by = auth.uid()));

drop policy if exists "Users can manage matches in own tournaments" on public.tournament_matches;
create policy "Users can manage matches in own tournaments"
on public.tournament_matches
for all
to authenticated
using (exists (select 1 from public.tournaments t where t.id = tournament_id and t.created_by = auth.uid()))
with check (exists (select 1 from public.tournaments t where t.id = tournament_id and t.created_by = auth.uid()));

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
        (g.player1->>'userId')::uuid = auth.uid()
        or
        (g.player2->>'userId')::uuid = auth.uid()
        or
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

-- Create tournament functions
create or replace function public.create_tournament_squash(
  p_name text,
  p_player_names text[],
  p_tournament_type text default 'single_elimination',
  p_best_of_games integer default 3,
  p_points_to_win_game integer default 11
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tournament_id uuid;
  v_player_ids uuid[] := '{}';
  v_player_id uuid;
  v_count int;
  i int;
begin
  if array_length(p_player_names, 1) is null or array_length(p_player_names, 1) < 2 then
    raise exception 'At least two players required';
  end if;
  
  if p_tournament_type not in ('single_elimination', 'double_elimination', 'round_robin') then
    raise exception 'Invalid tournament type';
  end if;
  
  if p_best_of_games not in (3, 5) then
    raise exception 'Best of games must be 3 or 5';
  end if;
  
  if p_points_to_win_game not in (9, 11) then
    raise exception 'Points to win game must be 9 or 11';
  end if;
  
  v_count := array_length(p_player_names, 1);

  insert into public.tournaments (created_by, name, tournament_type, best_of_games, points_to_win_game)
  values (auth.uid(), p_name, p_tournament_type, p_best_of_games, p_points_to_win_game)
  returning id into v_tournament_id;

  -- insert players
  for i in 1..v_count loop
    insert into public.tournament_players (tournament_id, player_name, seed)
    values (v_tournament_id, trim(p_player_names[i]), i)
    returning id into v_player_id;
    v_player_ids := array_append(v_player_ids, v_player_id);
  end loop;

  -- Generate bracket based on tournament type
  if p_tournament_type = 'single_elimination' then
    -- Single elimination bracket generation
    declare
      round_num int := 1;
      current_players uuid[] := v_player_ids;
      match_idx int;
      players_in_round int;
      byes_needed int;
      j int;
    begin
      -- Round 1: Handle any number of players
      players_in_round := array_length(current_players, 1);
      
      -- If odd number of players, one player gets a bye to the next round
      if mod(players_in_round, 2) = 1 then
        byes_needed := 1;
        players_in_round := players_in_round - 1; -- Pairs we can make
      else
        byes_needed := 0;
      end if;
      
      -- Create first round matches for pairs
      match_idx := 1;
      j := 1;
      while j <= players_in_round loop
        insert into public.tournament_matches (tournament_id, round, match_index, player_a_id, player_b_id, best_of_games, points_to_win_game)
        values (v_tournament_id, round_num, match_idx, current_players[j], current_players[j+1], p_best_of_games, p_points_to_win_game);
        match_idx := match_idx + 1;
        j := j + 2;
      end loop;
      
      -- If there was a bye, create a bye match (player plays against null)
      if byes_needed > 0 then
        insert into public.tournament_matches (tournament_id, round, match_index, player_a_id, player_b_id, best_of_games, points_to_win_game)
        values (v_tournament_id, round_num, match_idx, current_players[players_in_round + 1], null, p_best_of_games, p_points_to_win_game);
      end if;

      -- Create placeholder matches for subsequent rounds
      declare
        available_players int := (players_in_round / 2) + byes_needed; -- Round 1 winners
        next_round int := 2;
        matches_this_round int;
        match_counter int;
      begin
        while available_players > 1 loop
          matches_this_round := available_players / 2;
          
          for match_counter in 1..matches_this_round loop
            insert into public.tournament_matches (tournament_id, round, match_index, player_a_id, player_b_id, best_of_games, points_to_win_game)
            values (v_tournament_id, next_round, match_counter, null, null, p_best_of_games, p_points_to_win_game);
          end loop;
          
          if mod(available_players, 2) = 1 then
            available_players := matches_this_round + 1;
          else
            available_players := matches_this_round;
          end if;
          
          next_round := next_round + 1;
        end loop;
      end;
    end;
  end if;

  return v_tournament_id;
end $$;

-- Create public read function
create or replace function public.get_tournament_by_token_squash(p_token text)
returns table (
  id uuid,
  name text,
  status text,
  created_by uuid,
  tournament_type text,
  best_of_games integer,
  points_to_win_game integer,
  player_id uuid,
  player_name text,
  player_user_id uuid,
  seed integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select t.id, t.name, t.status, t.created_by, t.tournament_type, t.best_of_games, t.points_to_win_game, 
         tp.id as player_id, tp.player_name, tp.player_user_id, tp.seed
  from public.tournaments t
  left join public.tournament_players tp on tp.tournament_id = t.id
  where t.join_token = p_token;
end $$;

-- Create public join function
create or replace function public.join_tournament_squash(
  p_token text,
  p_player_name text,
  p_user_id uuid default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tid uuid;
  v_player_id uuid;
begin
  select id into v_tid from public.tournaments where join_token = p_token and status = 'setup';
  if v_tid is null then
    raise exception 'Tournament not accepting new players';
  end if;

  insert into public.tournament_players (tournament_id, player_name, player_user_id)
  values (v_tid, trim(p_player_name), p_user_id)
  returning id into v_player_id;

  return v_player_id;
end $$;

-- Prevent overlapping bookings for the same court
create unique index bookings_no_overlap_idx on public.bookings (
  venue_id, 
  court_number, 
  tstzrange(start_time, end_time, '[)')
) where status in ('pending', 'confirmed', 'active');

-- Insert some sample squash venues
INSERT INTO public.venues (name, address, city, state, zip_code, phone, email, description, number_of_courts, price_per_hour, amenities) VALUES
('Downtown Squash Club', '123 Main St', 'New York', 'NY', '10001', '(555) 123-4567', 'info@downtownsquash.com', 'Premium squash facility in the heart of downtown', 4, 35.00, '["Changing rooms", "Shower facilities", "Equipment rental", "Pro shop", "Parking", "WiFi", "Cafe"]'),
('Metro Sports Center', '456 Oak Ave', 'Los Angeles', 'CA', '90210', '(555) 987-6543', 'contact@metrosports.com', 'Modern sports facility with multiple squash courts', 6, 30.00, '["Changing rooms", "Shower facilities", "Equipment rental", "Parking", "WiFi"]'),
('Elite Squash Academy', '789 Pine St', 'Chicago', 'IL', '60601', '(555) 456-7890', 'info@elitesquash.com', 'Professional squash training and court rental', 3, 40.00, '["Changing rooms", "Shower facilities", "Equipment rental", "Pro shop", "Parking", "WiFi", "Coaching services"]');

COMMIT;
