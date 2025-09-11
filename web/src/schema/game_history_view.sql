create view public.game_history_view as
select
  id as game_id,
  status,
  winner,
  cup_formation,
  total_cups_per_team,
  created_at as game_created_at,
  updated_at as game_updated_at,
  (team1 ->> 'score'::text)::integer as team1_final_score,
  (team2 ->> 'score'::text)::integer as team2_final_score,
  case
    when winner = 1 then (team1 ->> 'score'::text)::integer
    else (team2 ->> 'score'::text)::integer
  end as winning_score,
  case
    when winner = 1 then (team2 ->> 'score'::text)::integer
    else (team1 ->> 'score'::text)::integer
  end as losing_score
from
  games g
where
  status = 'completed'::text;