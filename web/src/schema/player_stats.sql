-- Aggregated per-player stats table maintained from public.player_game_stats
-- Run this in Supabase SQL editor (or via migration) before deploying code that reads from it.

begin;

-- Create aggregated table
create table if not exists public.player_stats (
  player_id uuid primary key references public.users(id) on delete cascade,
  games_played integer not null default 0,
  games_won integer not null default 0,
  shots_attempted integer not null default 0,
  shots_made integer not null default 0,
  cups_hit integer not null default 0,
  catches integer not null default 0,
  redemption_shots integer not null default 0,
  total_final_score integer not null default 0,
  last_game_at timestamptz,
  -- derived metrics
  accuracy numeric generated always as (
    case when shots_attempted > 0 then round(shots_made::numeric / greatest(shots_attempted, 1), 4) else 0 end
  ) stored,
  win_rate numeric generated always as (
    case when games_played > 0 then round(games_won::numeric / greatest(games_played, 1), 4) else 0 end
  ) stored,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists player_stats_last_game_at_idx on public.player_stats (last_game_at desc);

-- Keep updated_at fresh
do $$ begin
  perform 1 from pg_trigger where tgname = 'update_player_stats_updated_at';
  if not found then
    create trigger update_player_stats_updated_at before update on public.player_stats for each row execute function public.handle_updated_at();
  end if;
end $$;

-- Recompute helper
create or replace function public.recompute_player_stats(p_player_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  agg record;
begin
  select
    count(*)::int as games_played,
    count(*) filter (where won)::int as games_won,
    coalesce(sum(shots_attempted), 0)::int as shots_attempted,
    coalesce(sum(shots_made), 0)::int as shots_made,
    coalesce(sum(cups_hit), 0)::int as cups_hit,
    coalesce(sum(catches), 0)::int as catches,
    coalesce(sum(redemption_shots), 0)::int as redemption_shots,
    coalesce(sum(final_score), 0)::int as total_final_score,
    max(created_at) as last_game_at
  into agg
  from public.player_game_stats
  where player_id = p_player_id;

  if agg.games_played is null then
    delete from public.player_stats where player_id = p_player_id;
  else
    insert into public.player_stats as ps (
      player_id, games_played, games_won, shots_attempted, shots_made, cups_hit, catches, redemption_shots, total_final_score, last_game_at, updated_at
    ) values (
      p_player_id, agg.games_played, agg.games_won, agg.shots_attempted, agg.shots_made, agg.cups_hit, agg.catches, agg.redemption_shots, agg.total_final_score, agg.last_game_at, timezone('utc'::text, now())
    )
    on conflict (player_id) do update
      set games_played = excluded.games_played,
          games_won = excluded.games_won,
          shots_attempted = excluded.shots_attempted,
          shots_made = excluded.shots_made,
          cups_hit = excluded.cups_hit,
          catches = excluded.catches,
          redemption_shots = excluded.redemption_shots,
          total_final_score = excluded.total_final_score,
          last_game_at = excluded.last_game_at,
          updated_at = excluded.updated_at;
  end if;
end $$;

-- Trigger wrapper: reacts to changes on player_game_stats
create or replace function public.tg_recompute_player_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.recompute_player_stats(new.player_id);
  elsif tg_op = 'UPDATE' then
    if new.player_id <> old.player_id then
      perform public.recompute_player_stats(old.player_id);
    end if;
    perform public.recompute_player_stats(new.player_id);
  elsif tg_op = 'DELETE' then
    perform public.recompute_player_stats(old.player_id);
  end if;
  return null;
end $$;

drop trigger if exists tr_player_game_stats_agg on public.player_game_stats;
create trigger tr_player_game_stats_agg
after insert or update or delete on public.player_game_stats
for each row execute function public.tg_recompute_player_stats();

-- Initial backfill
insert into public.player_stats (
  player_id, games_played, games_won, shots_attempted, shots_made, cups_hit, catches, redemption_shots, total_final_score, last_game_at
)
select
  player_id,
  count(*)::int as games_played,
  count(*) filter (where won)::int as games_won,
  coalesce(sum(shots_attempted), 0)::int,
  coalesce(sum(shots_made), 0)::int,
  coalesce(sum(cups_hit), 0)::int,
  coalesce(sum(catches), 0)::int,
  coalesce(sum(redemption_shots), 0)::int,
  coalesce(sum(final_score), 0)::int,
  max(created_at) as last_game_at
from public.player_game_stats
group by player_id
on conflict (player_id) do update
  set games_played = excluded.games_played,
      games_won = excluded.games_won,
      shots_attempted = excluded.shots_attempted,
      shots_made = excluded.shots_made,
      cups_hit = excluded.cups_hit,
      catches = excluded.catches,
      redemption_shots = excluded.redemption_shots,
      total_final_score = excluded.total_final_score,
      last_game_at = excluded.last_game_at;

-- RLS
alter table public.player_stats enable row level security;

drop policy if exists "Users can view their own player stats" on public.player_stats;
create policy "Users can view their own player stats"
on public.player_stats
for select
to authenticated
using (player_id = auth.uid());

drop policy if exists "No client writes to player_stats" on public.player_stats;
create policy "No client writes to player_stats"
on public.player_stats
for all
to authenticated
using (false)
with check (false);

commit;


