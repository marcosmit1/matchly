-- Create a debug logging function
CREATE OR REPLACE FUNCTION public.log_golf_score_access(
    operation TEXT,
    tournament_id UUID,
    participant_id UUID,
    user_id UUID
) RETURNS void AS $$
BEGIN
    -- Log the attempt
    RAISE NOTICE 'Golf Score Access Check: % (Tournament: %, Participant: %, User: %)',
        operation,
        tournament_id,
        participant_id,
        user_id;

    -- Log tournament info
    RAISE NOTICE 'Tournament Info: %',
        (SELECT json_build_object(
            'id', id,
            'name', name,
            'created_by', created_by,
            'status', status
        ) FROM public.golf_tournaments WHERE id = tournament_id);

    -- Log participant info
    RAISE NOTICE 'Participant Info: %',
        (SELECT json_build_object(
            'id', id,
            'player_name', player_name,
            'user_id', user_id,
            'fourball_number', fourball_number,
            'position_in_fourball', position_in_fourball,
            'is_guest', is_guest
        ) FROM public.golf_tournament_participants WHERE id = participant_id);

    -- Log user's participant info
    RAISE NOTICE 'User Participant Info: %',
        (SELECT json_build_object(
            'id', id,
            'player_name', player_name,
            'user_id', user_id,
            'fourball_number', fourball_number,
            'position_in_fourball', position_in_fourball,
            'is_guest', is_guest
        ) FROM public.golf_tournament_participants 
        WHERE tournament_id = tournament_id AND user_id = user_id);
END;
$$ LANGUAGE plpgsql;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read golf scores" ON public.golf_scores;
DROP POLICY IF EXISTS "Allow creator or participant to insert scores" ON public.golf_scores;
DROP POLICY IF EXISTS "Allow creator or participant to update scores" ON public.golf_scores;
DROP POLICY IF EXISTS "Allow creator or participant to delete scores" ON public.golf_scores;

-- Allow reading scores if you're the creator or a participant
CREATE POLICY "Allow authenticated users to read golf scores"
ON public.golf_scores FOR SELECT TO authenticated USING (
  (
    SELECT EXISTS (
      SELECT 1 
      FROM public.golf_tournaments t
      LEFT JOIN public.golf_tournament_participants p 
        ON p.tournament_id = t.id AND p.user_id = auth.uid()
      WHERE t.id = golf_scores.tournament_id
      AND (t.created_by = auth.uid() OR p.id IS NOT NULL)
    )
  )
);

-- Allow inserting scores if you're the creator or a participant
CREATE POLICY "Allow creator or participant to insert scores"
ON public.golf_scores FOR INSERT TO authenticated WITH CHECK (
  (
    SELECT 
      CASE 
        WHEN EXISTS (
          SELECT 1 
          FROM public.golf_tournaments t
          LEFT JOIN public.golf_tournament_participants p 
            ON p.tournament_id = t.id AND p.user_id = auth.uid()
          WHERE t.id = tournament_id
          AND (t.created_by = auth.uid() OR p.id IS NOT NULL)
        ) THEN
          (SELECT public.log_golf_score_access('INSERT', tournament_id, participant_id, auth.uid())) IS NULL
        ELSE false
      END
  )
);

-- Allow updating scores with the same rules
CREATE POLICY "Allow creator or participant to update scores"
ON public.golf_scores FOR UPDATE USING (
  (
    SELECT 
      CASE 
        WHEN EXISTS (
          SELECT 1 
          FROM public.golf_tournaments t
          LEFT JOIN public.golf_tournament_participants p 
            ON p.tournament_id = t.id AND p.user_id = auth.uid()
          WHERE t.id = tournament_id
          AND (t.created_by = auth.uid() OR p.id IS NOT NULL)
        ) THEN
          (SELECT public.log_golf_score_access('UPDATE', tournament_id, participant_id, auth.uid())) IS NULL
        ELSE false
      END
  )
);

-- Allow deleting scores with the same rules
CREATE POLICY "Allow creator or participant to delete scores"
ON public.golf_scores FOR DELETE USING (
  (
    SELECT 
      CASE 
        WHEN EXISTS (
          SELECT 1 
          FROM public.golf_tournaments t
          LEFT JOIN public.golf_tournament_participants p 
            ON p.tournament_id = t.id AND p.user_id = auth.uid()
          WHERE t.id = tournament_id
          AND (t.created_by = auth.uid() OR p.id IS NOT NULL)
        ) THEN
          (SELECT public.log_golf_score_access('DELETE', tournament_id, participant_id, auth.uid())) IS NULL
        ELSE false
      END
  )
);
