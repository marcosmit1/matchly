-- Create a friend request by recipient email
create or replace function public.create_friend_request(target_email text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_target_id uuid;
  v_exists boolean;
begin
  select id into v_target_id from public.users where lower(email) = lower(target_email);
  if v_target_id is null then
    raise exception 'User not found';
  end if;
  if v_target_id = auth.uid() then
    raise exception 'Cannot add yourself';
  end if;

  -- If already friends, do nothing
  select exists(select 1 from public.friends where user_id = auth.uid() and friend_id = v_target_id) into v_exists;
  if v_exists then
    return;
  end if;

  -- If pending request exists either direction, do nothing
  select exists(select 1 from public.friend_requests where status = 'pending' and ((sender_id = auth.uid() and recipient_id = v_target_id) or (sender_id = v_target_id and recipient_id = auth.uid()))) into v_exists;
  if v_exists then
    return;
  end if;

  insert into public.friend_requests(sender_id, recipient_id, status) values (auth.uid(), v_target_id, 'pending');
end;
$$;

-- Respond to a friend request (accept/decline)
create or replace function public.respond_friend_request(req_id uuid, action text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_sender uuid;
  v_recipient uuid;
  v_status text;
begin
  select sender_id, recipient_id, status into v_sender, v_recipient, v_status from public.friend_requests where id = req_id;
  if not found then
    raise exception 'Request not found';
  end if;
  if v_recipient <> auth.uid() then
    raise exception 'Not authorized to respond to this request';
  end if;
  if v_status <> 'pending' then
    return;
  end if;

  if action = 'accept' then
    update public.friend_requests set status = 'accepted', responded_at = now() where id = req_id;
    -- Insert friendships both directions
    insert into public.friends(user_id, friend_id) values (v_sender, v_recipient) on conflict do nothing;
    insert into public.friends(user_id, friend_id) values (v_recipient, v_sender) on conflict do nothing;
  elsif action = 'decline' then
    update public.friend_requests set status = 'declined', responded_at = now() where id = req_id;
  else
    raise exception 'Invalid action';
  end if;
end;
$$;

revoke all on function public.create_friend_request(text) from public;
revoke all on function public.respond_friend_request(uuid, text) from public;

grant execute on function public.create_friend_request(text) to authenticated;
grant execute on function public.respond_friend_request(uuid, text) to authenticated;
