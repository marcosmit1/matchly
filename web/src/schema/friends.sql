-- Friends table for following/friendship
create table if not exists public.friends (
  user_id uuid not null references public.users(id) on delete cascade,
  friend_id uuid not null references public.users(id) on delete cascade,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  constraint friends_pkey primary key (user_id, friend_id),
  constraint friends_no_self check (user_id <> friend_id)
) tablespace pg_default;

create index if not exists friends_user_id_idx on public.friends using btree (user_id) tablespace pg_default;
create index if not exists friends_friend_id_idx on public.friends using btree (friend_id) tablespace pg_default;

alter table public.friends enable row level security;

-- Allow authenticated users to read their own friendships
create policy "Allow select own friendships"
  on public.friends
  for select
  to authenticated
  using (user_id = auth.uid());

-- Allow authenticated users to create friendships for themselves
create policy "Allow insert own friendships"
  on public.friends
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Allow authenticated users to delete their own friendships (optional)
create policy "Allow delete own friendships"
  on public.friends
  for delete
  to authenticated
  using (user_id = auth.uid());

-- Users table RLS: allow authenticated to select basic info so friend lists can render
alter table public.users enable row level security;

-- If you already have a policy for selects on users, you can skip the next line
create policy "Allow select users for authenticated"
  on public.users
  for select
  to authenticated
  using (true);
