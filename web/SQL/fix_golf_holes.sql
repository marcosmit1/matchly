-- Drop existing function and trigger first
DROP TRIGGER IF EXISTS create_golf_holes_on_tournament ON public.golf_tournaments;
DROP FUNCTION IF EXISTS public.on_golf_tournament_created();
DROP FUNCTION IF EXISTS public.create_default_golf_holes(UUID);

-- Create golf_holes table (if not exists)
CREATE TABLE IF NOT EXISTS public.golf_holes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES public.golf_tournaments(id) ON DELETE CASCADE,
    hole_number INTEGER NOT NULL CHECK (hole_number BETWEEN 1 AND 18),
    par INTEGER NOT NULL CHECK (par BETWEEN 3 AND 6),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tournament_id, hole_number)
);

-- Add RLS policies
ALTER TABLE public.golf_holes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read golf holes" ON public.golf_holes;
CREATE POLICY "Allow authenticated users to read golf holes"
ON public.golf_holes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow tournament creator to insert holes" ON public.golf_holes;
CREATE POLICY "Allow tournament creator to insert holes"
ON public.golf_holes FOR INSERT TO authenticated WITH CHECK (
    (SELECT created_by FROM public.golf_tournaments WHERE id = tournament_id) = auth.uid()
);

-- Function to create default holes for a new tournament
CREATE OR REPLACE FUNCTION public.create_default_golf_holes(p_tournament_id UUID)
RETURNS void AS $$
BEGIN
    -- Insert 18 holes with default par 4
    INSERT INTO public.golf_holes (tournament_id, hole_number, par)
    SELECT 
        p_tournament_id,  -- Use the parameter name to avoid ambiguity
        n,               -- Use n as the series value
        4                -- default par
    FROM generate_series(1, 18) n
    ON CONFLICT (tournament_id, hole_number) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create holes when a tournament is created
CREATE OR REPLACE FUNCTION public.on_golf_tournament_created()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.create_default_golf_holes(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_golf_holes_on_tournament
    AFTER INSERT ON public.golf_tournaments
    FOR EACH ROW
    EXECUTE FUNCTION public.on_golf_tournament_created();

-- Create holes for existing tournaments
DO $$
DECLARE
    t RECORD;
BEGIN
    FOR t IN SELECT id FROM public.golf_tournaments
    LOOP
        PERFORM public.create_default_golf_holes(t.id);
    END LOOP;
END $$;