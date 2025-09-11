-- Create notifications for existing bookings
-- Run this AFTER the main setup_notifications.sql has been executed

INSERT INTO public.invitations (type, recipient_id, booking_id, message, metadata, status, sender_id)
SELECT 
  'booking_confirmation',
  b.user_id,
  b.id,
  'Your table booking at ' || v.name || ' has been confirmed!',
  json_build_object(
    'venue_name', v.name,
    'venue_address', v.address || ', ' || v.city,
    'start_time', b.start_time,
    'end_time', b.end_time,
    'table_number', b.table_number,
    'total_amount', b.total_amount,
    'booking_status', b.status
  ),
  'unread',
  null
FROM public.bookings b
JOIN public.venues v ON v.id = b.venue_id
WHERE b.status = 'confirmed'
AND NOT EXISTS (
  SELECT 1 FROM public.invitations i 
  WHERE i.booking_id = b.id 
  AND i.type = 'booking_confirmation'
);
