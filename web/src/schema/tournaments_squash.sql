begin;

-- Squash Tournament Schema
-- Transformed from team-based to individual player tournaments

-- Core tournament entities
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

do $$ begin
  perform 1 from pg_trigger where tgname = 'update_tournaments_updated_at';
  if not found then
    create trigger update_tournaments_updated_at before update on public.tournaments for each row execute function public.handle_updated_at();
  end if;
end $$;

-- Individual players in tournament (instead of teams)
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

-- Tournament matches (individual vs individual)
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

do $$ begin
  perform 1 from pg_trigger where tgname = 'update_tournament_matches_updated_at';
  if not found then
    create trigger update_tournament_matches_updated_at before update on public.tournament_matches for each row execute function public.handle_updated_at();
  end if;
end $$;

-- RLS
alter table public.tournaments enable row level security;
alter table public.tournament_players enable row level security;
alter table public.tournament_matches enable row level security;

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

-- RPC: create tournament with individual players
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

-- Public read via token (security definer)
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

-- Public join via token (inserts player if tournament is in setup)
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

commit;
