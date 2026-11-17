create table couples (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table members (
  user_id uuid primary key references auth.users on delete cascade,
  couple_id uuid not null references couples on delete cascade,
  slot smallint not null check (slot in (1,2)),
  display_name text not null default '',
  unique (couple_id, slot)
);

create table events (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples on delete cascade,
  event_date date not null,
  type text not null check (type in ('sesso','pompino','leccata','anale')),
  who text not null check (who in ('p1','p2','both')),
  note text not null default '' check (char_length(note) <= 80),
  created_by uuid not null default auth.uid() references auth.users,
  created_at timestamptz not null default now()
);
create index events_couple_date on events (couple_id, event_date);

create function my_couple() returns uuid
language sql security definer set search_path = public stable
as $$ select couple_id from members where user_id = auth.uid() $$;

alter table couples enable row level security;
alter table members enable row level security;
alter table events enable row level security;

create policy couples_read on couples for select using (id = my_couple());
create policy members_read on members for select using (couple_id = my_couple());
create policy members_update_self on members for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy events_read on events for select using (couple_id = my_couple());
create policy events_insert on events for insert with check (couple_id = my_couple() and created_by = auth.uid());
create policy events_delete on events for delete using (couple_id = my_couple());
