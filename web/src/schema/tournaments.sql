begin;

-- Core tournament entities
create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.users(id) on delete cascade,
  name text not null,
  status text not null default 'setup', -- setup | active | completed | canceled
  join_token text not null unique default encode(gen_random_bytes(6), 'hex'),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

do $$ begin
  perform 1 from pg_trigger where tgname = 'update_tournaments_updated_at';
  if not found then
    create trigger update_tournaments_updated_at before update on public.tournaments for each row execute function public.handle_updated_at();
  end if;
end $$;

create table if not exists public.tournament_teams (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  name text not null,
  seed integer,
  created_at timestamptz not null default timezone('utc'::text, now())
);
create index if not exists tournament_teams_tournament_idx on public.tournament_teams(tournament_id);

-- Players per team (registered or guest)
create table if not exists public.tournament_team_players (
  id uuid primary key default gen_random_uuid(),
  tournament_team_id uuid not null references public.tournament_teams(id) on delete cascade,
  player_name text not null,
  player_user_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now())
);
create index if not exists ttp_team_idx on public.tournament_team_players(tournament_team_id);

create table if not exists public.tournament_matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  round integer not null,
  match_index integer not null,
  team_a_id uuid references public.tournament_teams(id) on delete set null,
  team_b_id uuid references public.tournament_teams(id) on delete set null,
  winner_team_id uuid references public.tournament_teams(id) on delete set null,
  status text not null default 'pending', -- pending | in_progress | complete
  game_id uuid references public.games(id) on delete set null,
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
alter table public.tournament_teams enable row level security;
alter table public.tournament_matches enable row level security;
alter table public.tournament_team_players enable row level security;

drop policy if exists "Users can manage own tournaments" on public.tournaments;
create policy "Users can manage own tournaments"
on public.tournaments
for all
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

drop policy if exists "Users can manage teams in own tournaments" on public.tournament_teams;
create policy "Users can manage teams in own tournaments"
on public.tournament_teams
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

drop policy if exists "Users can manage players in own tournaments" on public.tournament_team_players;
create policy "Users can manage players in own tournaments"
on public.tournament_team_players
for all
to authenticated
using (exists (
  select 1 from public.tournament_teams tt join public.tournaments t on t.id = tt.tournament_id
  where tt.id = tournament_team_id and t.created_by = auth.uid()
))
with check (exists (
  select 1 from public.tournament_teams tt join public.tournaments t on t.id = tt.tournament_id
  where tt.id = tournament_team_id and t.created_by = auth.uid()
));

-- RPC: create tournament with teams and initial round
create or replace function public.create_tournament(
  p_name text,
  p_team_names text[]
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tournament_id uuid;
  v_team_ids uuid[] := '{}';
  v_team_id uuid;
  v_count int;
  i int;
begin
  if array_length(p_team_names, 1) is null or array_length(p_team_names, 1) < 2 then
    raise exception 'At least two teams required';
  end if;
  
  -- allow any number of teams (2 or more)
  v_count := array_length(p_team_names, 1);

  insert into public.tournaments (created_by, name)
  values (auth.uid(), p_name)
  returning id into v_tournament_id;

  -- insert teams
  for i in 1..v_count loop
    insert into public.tournament_teams (tournament_id, name, seed)
    values (v_tournament_id, trim(p_team_names[i]), i)
    returning id into v_team_id;
    v_team_ids := array_append(v_team_ids, v_team_id);
  end loop;

  -- Smart bracket generation for any number of teams
  declare
    round_num int := 1;
    current_teams uuid[] := v_team_ids;
    match_idx int;
    teams_in_round int;
    byes_needed int;
    j int;
  begin
    -- Round 1: Handle any number of teams
    teams_in_round := array_length(current_teams, 1);
    
    -- If odd number of teams, one team gets a bye to the next round
    if mod(teams_in_round, 2) = 1 then
      byes_needed := 1;
      teams_in_round := teams_in_round - 1; -- Pairs we can make
    else
      byes_needed := 0;
    end if;
    
    -- Create first round matches for pairs
    match_idx := 1;
    j := 1;
    while j <= teams_in_round loop
      insert into public.tournament_matches (tournament_id, round, match_index, team_a_id, team_b_id)
      values (v_tournament_id, round_num, match_idx, current_teams[j], current_teams[j+1]);
      match_idx := match_idx + 1;
      j := j + 2;
    end loop;
    
    -- If there was a bye, create a bye match (team plays against null)
    if byes_needed > 0 then
      insert into public.tournament_matches (tournament_id, round, match_index, team_a_id, team_b_id)
      values (v_tournament_id, round_num, match_idx, current_teams[teams_in_round + 1], null);
    end if;

    -- Create placeholder matches for subsequent rounds using correct logic
    -- Each round: available_teams / 2 = number_of_matches (rounded down)
    declare
      available_teams int := (teams_in_round / 2) + byes_needed; -- Round 1 winners
      next_round int := 2;
      matches_this_round int;
      match_counter int;
    begin
      while available_teams > 1 loop
        -- Calculate matches for this round: available_teams / 2 (rounded down)
        matches_this_round := available_teams / 2;
        
        -- Create the calculated number of matches
        for match_counter in 1..matches_this_round loop
          insert into public.tournament_matches (tournament_id, round, match_index, team_a_id, team_b_id)
          values (v_tournament_id, next_round, match_counter, null, null);
        end loop;
        
        -- Calculate how many teams advance to next round
        -- Each match produces 1 winner, plus any byes from odd numbers
        if mod(available_teams, 2) = 1 then
          -- Odd number: matches_this_round winners + 1 bye
          available_teams := matches_this_round + 1;
        else
          -- Even number: matches_this_round winners + 0 byes
          available_teams := matches_this_round;
        end if;
        
        next_round := next_round + 1;
      end loop;
    end;
  end;

  return v_tournament_id;
end $$;

commit;


-- V2: Create tournament with teams and players (JSON payload)
create or replace function public.create_tournament_v2(
  p_name text,
  p_teams jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tournament_id uuid;
  v_team_ids uuid[] := '{}';
  v_team_id uuid;
  v_count int;
  rec record;
  player_rec record;
  idx int := 0;
begin
  if p_teams is null or jsonb_typeof(p_teams) <> 'array' then
    raise exception 'p_teams must be a JSON array';
  end if;

  v_count := (select jsonb_array_length(p_teams));
  if v_count < 2 then
    raise exception 'At least two teams required';
  end if;
  -- Removed even team count requirement - tournaments can handle any number

  insert into public.tournaments (created_by, name)
  values (auth.uid(), p_name)
  returning id into v_tournament_id;

  -- Insert teams and players
  for rec in select * from jsonb_array_elements(p_teams) with ordinality as t(team, ord) loop
    idx := rec.ord::int;
    insert into public.tournament_teams (tournament_id, name, seed)
    values (v_tournament_id, trim((rec.team->>'name')::text), idx)
    returning id into v_team_id;

    -- players array optional
    if (rec.team ? 'players') then
      for player_rec in select * from jsonb_array_elements(rec.team->'players') loop
        insert into public.tournament_team_players (tournament_team_id, player_name, player_user_id)
        values (
          v_team_id,
          case when jsonb_typeof(player_rec.value) = 'object' then trim(coalesce((player_rec.value->>'name')::text, '')) else trim(player_rec.value::text) end,
          case when jsonb_typeof(player_rec.value) = 'object' and (player_rec.value ? 'user_id') then (player_rec.value->>'user_id')::uuid else null end
        );
      end loop;
    end if;

    v_team_ids := array_append(v_team_ids, v_team_id);
  end loop;

  -- Smart bracket generation for any number of teams
  declare
    round_num int := 1;
    current_teams uuid[] := v_team_ids;
    match_idx int;
    teams_in_round int;
    teams_to_pair int;
    byes_needed int;
    k int;
  begin
    -- Round 1: All teams play, no byes in first round
    teams_in_round := array_length(current_teams, 1);
    
    -- For Round 1, pair up as many teams as possible
    if mod(teams_in_round, 2) = 1 then
      -- Odd teams: pair all but one, last team gets bye to Round 2
      teams_to_pair := teams_in_round - 1;
      byes_needed := 1;
    else
      -- Even teams: pair them all
      teams_to_pair := teams_in_round;
      byes_needed := 0;
    end if;
    
    -- Create matches for paired teams
    match_idx := 1;
    k := 1;
    while k <= teams_to_pair loop
      insert into public.tournament_matches (tournament_id, round, match_index, team_a_id, team_b_id)
      values (v_tournament_id, round_num, match_idx, current_teams[k], current_teams[k+1]);
      match_idx := match_idx + 1;
      k := k + 2;
    end loop;

    -- Create placeholder matches for subsequent rounds using correct logic
    -- Each round: available_teams / 2 = number_of_matches (rounded down)
    declare
      available_teams int := (teams_in_round / 2) + byes_needed; -- Round 1 winners
      next_round int := 2;
      matches_this_round int;
      match_counter int;
    begin
      while available_teams > 1 loop
        -- Calculate matches for this round: available_teams / 2 (rounded down)
        matches_this_round := available_teams / 2;
        
        -- Create the calculated number of matches
        for match_counter in 1..matches_this_round loop
          insert into public.tournament_matches (tournament_id, round, match_index, team_a_id, team_b_id)
          values (v_tournament_id, next_round, match_counter, null, null);
        end loop;
        
        -- Calculate how many teams advance to next round
        -- Each match produces 1 winner, plus any byes from odd numbers
        if mod(available_teams, 2) = 1 then
          -- Odd number: matches_this_round winners + 1 bye
          available_teams := matches_this_round + 1;
        else
          -- Even number: matches_this_round winners + 0 byes
          available_teams := matches_this_round;
        end if;
        
        next_round := next_round + 1;
      end loop;
    end;
  end;

  return v_tournament_id;
end $$;

-- Public read via token (security definer)
create or replace function public.get_tournament_by_token(p_token text)
returns table (
  id uuid,
  name text,
  status text,
  created_by uuid,
  team_id uuid,
  team_name text,
  player_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select t.id, t.name, t.status, t.created_by, tt.id as team_id, tt.name as team_name, ttp.player_name
  from public.tournaments t
  left join public.tournament_teams tt on tt.tournament_id = t.id
  left join public.tournament_team_players ttp on ttp.tournament_team_id = tt.id
  where t.join_token = p_token;
end $$;

-- Public join via token (inserts team and players if tournament is in setup)
create or replace function public.join_tournament(
  p_token text,
  p_team_name text,
  p_players jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tid uuid;
  v_team_id uuid;
  rec record;
begin
  select id into v_tid from public.tournaments where join_token = p_token and status = 'setup';
  if v_tid is null then
    raise exception 'Tournament not accepting new teams';
  end if;

  insert into public.tournament_teams (tournament_id, name)
  values (v_tid, trim(p_team_name))
  returning id into v_team_id;

  if p_players is not null and jsonb_typeof(p_players) = 'array' then
    for rec in select * from jsonb_array_elements_text(p_players) loop
      insert into public.tournament_team_players (tournament_team_id, player_name)
      values (v_team_id, trim(rec.value));
    end loop;
  end if;

  return v_team_id;
end $$;


