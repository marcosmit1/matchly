create table public.users (
  id uuid not null,
  email text not null,
  username text null,
  first_name text null,
  last_name text null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email),
  constraint users_username_key unique (username),
  constraint users_id_fkey foreign KEY (id) references auth.users (id)
) TABLESPACE pg_default;

create index IF not exists users_email_idx on public.users using btree (email) TABLESPACE pg_default;
create index IF not exists users_username_idx on public.users using btree (username) TABLESPACE pg_default;

create trigger update_users_updated_at BEFORE
update on users for EACH row
execute FUNCTION handle_updated_at ();