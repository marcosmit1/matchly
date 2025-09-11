-- Complete setup for notifications system
-- This combines invitations and notifications into one comprehensive table

begin;

-- First, let's create the invitations table if it doesn't exist
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('game','tournament','booking_confirmation','booking_reminder','booking_cancelled')),
  entity_id uuid,
  booking_id uuid references public.bookings(id) on delete cascade,
  sender_id uuid references public.users(id) on delete cascade,
  recipient_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined','read','unread')),
  message text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- Create indexes for performance
create index if not exists invitations_recipient_idx on public.invitations(recipient_id);
create index if not exists invitations_sender_idx on public.invitations(sender_id);
create index if not exists invitations_booking_id_idx on public.invitations(booking_id);
create index if not exists invitations_type_idx on public.invitations(type);
create index if not exists invitations_created_at_idx on public.invitations(created_at desc);

-- Create updated_at trigger function if it doesn't exist
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create trigger for updated_at
do $$ begin
  perform 1 from pg_trigger where tgname = 'update_invitations_updated_at';
  if not found then
    create trigger update_invitations_updated_at before update on public.invitations for each row execute function public.handle_updated_at();
  end if;
end $$;

-- Enable RLS
alter table public.invitations enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Invites visible to sender or recipient" on public.invitations;
drop policy if exists "Users can create invites as sender" on public.invitations;
drop policy if exists "Users can create booking notifications" on public.invitations;
drop policy if exists "Recipient can update status" on public.invitations;

-- Create comprehensive RLS policies
create policy "Invites visible to sender or recipient"
on public.invitations
for select
to authenticated
using (sender_id = auth.uid() or recipient_id = auth.uid());

create policy "Users can create invites as sender"
on public.invitations
for insert
to authenticated
with check (sender_id = auth.uid());

create policy "System can create booking notifications"
on public.invitations
for insert
to authenticated
with check (
  sender_id = auth.uid() OR 
  (type in ('booking_confirmation', 'booking_reminder', 'booking_cancelled') and sender_id is null)
);

create policy "Recipient can update status"
on public.invitations
for update
to authenticated
using (recipient_id = auth.uid())
with check (recipient_id = auth.uid());

-- Create sample notifications for existing bookings
-- Note: Run this separately after the main schema is created
-- INSERT INTO public.invitations (type, recipient_id, booking_id, message, metadata, status, sender_id)
-- SELECT 
--   'booking_confirmation',
--   b.user_id,
--   b.id,
--   'Your table booking at ' || v.name || ' has been confirmed!',
--   json_build_object(
--     'venue_name', v.name,
--     'venue_address', v.address || ', ' || v.city,
--     'start_time', b.start_time,
--     'end_time', b.end_time,
--     'table_number', b.table_number,
--     'total_amount', b.total_amount,
--     'booking_status', b.status
--   ),
--   'unread',
--   null
-- FROM public.bookings b
-- JOIN public.venues v ON v.id = b.venue_id
-- WHERE b.status = 'confirmed'
-- AND NOT EXISTS (
--   SELECT 1 FROM public.invitations i 
--   WHERE i.booking_id = b.id 
--   AND i.type = 'booking_confirmation'
-- );

commit;
