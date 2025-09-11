-- Squash Court Bookings table for court reservations
create table public.bookings (
  id uuid not null default gen_random_uuid(),
  venue_id uuid not null,
  user_id uuid not null,
  court_number integer not null, -- Changed from table_number to court_number
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  status text not null default 'pending',
  total_amount decimal(10,2) not null,
  payment_status text not null default 'pending',
  payment_intent_id text null,
  special_requests text null,
  number_of_players integer not null default 2, -- Squash is typically 2 players (singles) or 4 (doubles)
  booking_type text not null default 'singles', -- singles | doubles | practice | lesson
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  constraint bookings_pkey primary key (id),
  constraint bookings_venue_id_fkey foreign key (venue_id) references public.venues (id) on delete cascade,
  constraint bookings_user_id_fkey foreign key (user_id) references public.users (id) on delete cascade,
  constraint bookings_status_check check (
    status = any (array[
      'pending'::text,
      'confirmed'::text,
      'active'::text,
      'completed'::text,
      'cancelled'::text,
      'no_show'::text
    ])
  ),
  constraint bookings_payment_status_check check (
    payment_status = any (array[
      'pending'::text,
      'processing'::text,
      'succeeded'::text,
      'failed'::text,
      'cancelled'::text,
      'refunded'::text
    ])
  ),
  constraint bookings_court_number_check check (court_number > 0),
  constraint bookings_time_check check (end_time > start_time),
  constraint bookings_total_amount_check check (total_amount >= 0),
  constraint bookings_number_of_players_check check (number_of_players between 1 and 4),
  constraint bookings_booking_type_check check (
    booking_type = any (array[
      'singles'::text,
      'doubles'::text,
      'practice'::text,
      'lesson'::text
    ])
  )
) tablespace pg_default;

-- Indexes for bookings
create index if not exists bookings_venue_id_idx on public.bookings using btree (venue_id) tablespace pg_default;
create index if not exists bookings_user_id_idx on public.bookings using btree (user_id) tablespace pg_default;
create index if not exists bookings_status_idx on public.bookings using btree (status) tablespace pg_default;
create index if not exists bookings_payment_status_idx on public.bookings using btree (payment_status) tablespace pg_default;
create index if not exists bookings_start_time_idx on public.bookings using btree (start_time) tablespace pg_default;
create index if not exists bookings_end_time_idx on public.bookings using btree (end_time) tablespace pg_default;
create index if not exists bookings_created_at_idx on public.bookings using btree (created_at desc) tablespace pg_default;
create index if not exists bookings_booking_type_idx on public.bookings using btree (booking_type) tablespace pg_default;

-- Compound index for checking availability
create index if not exists bookings_venue_court_time_idx on public.bookings 
using btree (venue_id, court_number, start_time, end_time) tablespace pg_default;

-- Updated at trigger for bookings
create trigger update_bookings_updated_at before update
on bookings for each row execute function handle_updated_at();

-- Prevent overlapping bookings for the same court
-- Using tstzrange for timestamp with time zone
create unique index bookings_no_overlap_idx on public.bookings (
  venue_id, 
  court_number, 
  tstzrange(start_time, end_time, '[)')
) where status in ('pending', 'confirmed', 'active');
