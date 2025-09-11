-- Extend invitations table to support booking notifications
-- Add new types to the existing invitations table
ALTER TABLE public.invitations DROP CONSTRAINT IF EXISTS invitations_type_check;
ALTER TABLE public.invitations ADD CONSTRAINT invitations_type_check 
  CHECK (type IN ('game', 'tournament', 'booking_confirmation', 'booking_reminder', 'booking_cancelled'));

-- Add booking-specific fields
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE;
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Index for booking notifications
CREATE INDEX IF NOT EXISTS invitations_booking_id_idx ON public.invitations(booking_id);
CREATE INDEX IF NOT EXISTS invitations_type_idx ON public.invitations(type);

-- Update RLS policies to include booking notifications
DROP POLICY IF EXISTS "Users can create booking notifications" ON public.invitations;
CREATE POLICY "Users can create booking notifications"
ON public.invitations
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid() OR 
  (type IN ('booking_confirmation', 'booking_reminder', 'booking_cancelled') AND sender_id IS NULL)
);

-- Allow system to create booking notifications (sender_id can be null for system notifications)
ALTER TABLE public.invitations ALTER COLUMN sender_id DROP NOT NULL;
