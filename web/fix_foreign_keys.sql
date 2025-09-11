-- Fix foreign key relationships for the leagues system
-- Run this after the main leagues_schema.sql

-- Add foreign key constraint for leagues.created_by
ALTER TABLE public.leagues 
ADD CONSTRAINT leagues_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key constraint for league_participants.user_id
ALTER TABLE public.league_participants 
ADD CONSTRAINT league_participants_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key constraint for league_matches.player1_id
ALTER TABLE public.league_matches 
ADD CONSTRAINT league_matches_player1_id_fkey 
FOREIGN KEY (player1_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key constraint for league_matches.player2_id
ALTER TABLE public.league_matches 
ADD CONSTRAINT league_matches_player2_id_fkey 
FOREIGN KEY (player2_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key constraint for league_invitations.invited_by
ALTER TABLE public.league_invitations 
ADD CONSTRAINT league_invitations_invited_by_fkey 
FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key constraint for league_box_assignments.user_id
ALTER TABLE public.league_box_assignments 
ADD CONSTRAINT league_box_assignments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key constraint for league_box_standings.user_id
ALTER TABLE public.league_box_standings 
ADD CONSTRAINT league_box_standings_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key constraint for league_promotion_history.user_id
ALTER TABLE public.league_promotion_history 
ADD CONSTRAINT league_promotion_history_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
