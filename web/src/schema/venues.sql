-- Venues table for bars/locations where tables can be booked
create table public.venues (
  id uuid not null default gen_random_uuid(),
  name text not null,
  address text not null,
  city text not null,
  state text not null,
  zip_code text not null,
  phone text null,
  email text null,
  description text null,
  number_of_tables integer not null default 1,
  price_per_hour decimal(10,2) not null default 20.00,
  hours_of_operation jsonb null default '{"monday": {"open": "11:00", "close": "23:00"}, "tuesday": {"open": "11:00", "close": "23:00"}, "wednesday": {"open": "11:00", "close": "23:00"}, "thursday": {"open": "11:00", "close": "23:00"}, "friday": {"open": "11:00", "close": "01:00"}, "saturday": {"open": "11:00", "close": "01:00"}, "sunday": {"open": "12:00", "close": "22:00"}}'::jsonb,
  amenities jsonb null default '[]'::jsonb,
  images jsonb null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now()),
  constraint venues_pkey primary key (id),
  constraint venues_number_of_tables_check check (number_of_tables > 0),
  constraint venues_price_per_hour_check check (price_per_hour >= 0)
) tablespace pg_default;

-- Indexes for venues
create index if not exists venues_city_idx on public.venues using btree (city) tablespace pg_default;
create index if not exists venues_state_idx on public.venues using btree (state) tablespace pg_default;
create index if not exists venues_is_active_idx on public.venues using btree (is_active) tablespace pg_default;
create index if not exists venues_created_at_idx on public.venues using btree (created_at desc) tablespace pg_default;

-- Updated at trigger for venues
create trigger update_venues_updated_at before update
on venues for each row execute function handle_updated_at();
