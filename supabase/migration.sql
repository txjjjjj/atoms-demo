create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '匿名用户',
  created_at timestamptz not null default now()
);

create table if not exists apps (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  prompt text not null default '',
  html text not null,
  is_public boolean not null default false,
  forked_from uuid references apps(id) on delete set null,
  created_at timestamptz not null default now()
);

-- RLS
alter table apps enable row level security;
alter table profiles enable row level security;

create policy "apps read public or owner" on apps
  for select using (is_public = true or owner_id = auth.uid());
create policy "apps insert own" on apps
  for insert with check (owner_id = auth.uid());
create policy "apps update own" on apps
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "apps delete own" on apps
  for delete using (owner_id = auth.uid());

create policy "profiles read all" on profiles for select using (true);
create policy "profiles upsert own" on profiles
  for insert with check (id = auth.uid());
create policy "profiles update own" on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();
