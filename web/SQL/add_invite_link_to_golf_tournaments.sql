-- Add invite_link column to golf_tournaments table
ALTER TABLE public.golf_tournaments
ADD COLUMN IF NOT EXISTS invite_link text;
