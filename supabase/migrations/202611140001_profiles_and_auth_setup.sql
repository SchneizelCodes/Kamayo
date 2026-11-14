-- 2026-11-14: Kamayo profiles & sign-in/sign-up setup (Supabase Auth; guests allowed, no email verification required)
-- Run after 202610260001..202611130001 migrations. Safe to re-run.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Learner',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles read own" on public.profiles;
drop policy if exists "profiles insert own" on public.profiles;
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles read own"   on public.profiles for select using (auth.uid() = id);
create policy "profiles insert own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles update own" on public.profiles for update using (auth.uid() = id);

-- Create a profile automatically at sign-up (name comes from options.data.display_name in AuthPage)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), 'Learner'))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill any existing users
insert into public.profiles (id, display_name)
select id, coalesce(nullif(trim(raw_user_meta_data->>'display_name'), ''), 'Learner') from auth.users
on conflict (id) do nothing;

-- Progress tables: each learner reads/writes only their own rows
do $$
declare t text;
begin
  foreach t in array array['learner_preferences','learning_attempts','level_completions','skill_reviews','xp_transactions'] loop
    if to_regclass('public.'||t) is not null
       and exists (select 1 from information_schema.columns where table_schema='public' and table_name=t and column_name='user_id') then
      execute format('alter table public.%I enable row level security', t);
      execute format('drop policy if exists "own rows" on public.%I', t);
      execute format('create policy "own rows" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    end if;
  end loop;
end $$;
