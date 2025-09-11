-- Friend requests table
create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.users(id) on delete cascade,
  recipient_id uuid not null references public.users(id) on delete cascade,
  status text not null check (status in ('pending','accepted','declined')) default 'pending',
  created_at timestamptz not null default timezone('utc'::text, now()),
  responded_at timestamptz null,
  constraint friend_requests_no_self check (sender_id <> recipient_id)
);

create index if not exists friend_requests_sender_idx on public.friend_requests(sender_id);
create index if not exists friend_requests_recipient_idx on public.friend_requests(recipient_id);

alter table public.friend_requests enable row level security;

-- Sender or recipient can view their requests
create policy "friend_requests_select_involved"
  on public.friend_requests for select to authenticated
  using (sender_id = auth.uid() or recipient_id = auth.uid());

-- Only sender can create, and only as themselves, pending
create policy "friend_requests_insert_sender"
  on public.friend_requests for insert to authenticated
  with check (sender_id = auth.uid() and status = 'pending');

-- Only recipient can update their incoming request (accept/decline)
create policy "friend_requests_update_recipient"
  on public.friend_requests for update to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());
