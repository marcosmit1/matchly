begin;

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('game','tournament')),
  entity_id uuid,
  sender_id uuid not null references public.users(id) on delete cascade,
  recipient_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  message text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists invitations_recipient_idx on public.invitations(recipient_id);
create index if not exists invitations_sender_idx on public.invitations(sender_id);

do $$ begin
  perform 1 from pg_trigger where tgname = 'update_invitations_updated_at';
  if not found then
    create trigger update_invitations_updated_at before update on public.invitations for each row execute function public.handle_updated_at();
  end if;
end $$;

alter table public.invitations enable row level security;

drop policy if exists "Invites visible to sender or recipient" on public.invitations;
create policy "Invites visible to sender or recipient"
on public.invitations
for select
to authenticated
using (sender_id = auth.uid() or recipient_id = auth.uid());

drop policy if exists "Users can create invites as sender" on public.invitations;
create policy "Users can create invites as sender"
on public.invitations
for insert
to authenticated
with check (sender_id = auth.uid());

drop policy if exists "Recipient can update status" on public.invitations;
create policy "Recipient can update status"
on public.invitations
for update
to authenticated
using (recipient_id = auth.uid())
with check (recipient_id = auth.uid());

commit;


