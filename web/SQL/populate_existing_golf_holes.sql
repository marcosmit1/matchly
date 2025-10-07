-- Populate holes for existing tournaments
DO $$
DECLARE
    t RECORD;
BEGIN
    FOR t IN SELECT id FROM public.golf_tournaments
    LOOP
        PERFORM public.create_default_golf_holes(t.id);
    END LOOP;
END $$;
