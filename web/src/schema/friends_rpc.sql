-- RPC to add a friend by email using SECURITY DEFINER to bypass RLS safely
create or replace function public.add_friend(target_email text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_target_id uuid;
begin
  select id into v_target_id from public.users where lower(email) = lower(target_email);

  if v_target_id is null then
    raise exception 'User not found';
  end if;

  if v_target_id = auth.uid() then
    raise exception 'Cannot add yourself';
  end if;

  insert into public.friends(user_id, friend_id)
  values (auth.uid(), v_target_id)
  on conflict do nothing;
end;
$$;

revoke all on function public.add_friend(text) from public;
grant execute on function public.add_friend(text) to authenticated;
