-- Simple Fix for Missing Columns
-- Run this in your Supabase SQL editor

-- Add missing columns to league_boxes table
ALTER TABLE public.league_boxes 
ADD COLUMN IF NOT EXISTS current_players INTEGER DEFAULT 0;

-- Add missing columns to leagues table  
ALTER TABLE public.leagues 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;

-- Add missing columns to league_boxes table
ALTER TABLE public.league_boxes 
ADD COLUMN IF NOT EXISTS level INTEGER;

ALTER TABLE public.league_boxes 
ADD COLUMN IF NOT EXISTS name TEXT;
