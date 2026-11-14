-- 2026-11-13 (Claude): staff issue triage, server-authoritative practice dates, and published version history.
-- Additive and idempotent. Run after 202611120001_content_contract_and_evidence.sql.
-- Day boundary for streaks and daily goals: Asia/Manila (Kamayo's learners), decided by the server, never the client.

-- 1. Staff triage of content issues ------------------------------------------------------------
alter table public.content_issues add column if not exists triaged_by uuid references auth.users(id);
alter table public.content_issues add column if not exists triaged_at timestamptz;

-- Staff may change the moderation state only (column-level grant); notes, reporter and concept stay as filed.
grant update (moderation_state) on public.content_issues to authenticated;

drop policy if exists staff_triage_issues on public.content_issues;
create policy staff_triage_issues on public.content_issues
  for update to authenticated
  using (exists (select 1 from public.staff_roles s where s.user_id = auth.uid() and s.role in ('fsl_reviewer', 'administrator')))
  with check (exists (select 1 from public.staff_roles s where s.user_id = auth.uid() and s.role in ('fsl_reviewer', 'administrator')));

create or replace function public.stamp_issue_triage()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.moderation_state is distinct from old.moderation_state then
    new.triaged_by := auth.uid();
    new.triaged_at := now();
  end if;
  return new;
end $$;
drop trigger if exists content_issue_triage on public.content_issues;
create trigger content_issue_triage before update on public.content_issues
  for each row execute function public.stamp_issue_triage();

-- 2. Server-authoritative evidence dates ---------------------------------------------------------
create or replace function public.kamayo_today()
returns date language sql stable set search_path = '' as $$ select (now() at time zone 'Asia/Manila')::date $$;

-- Whatever the client sends, the server sets the day and the timestamp, so a learner cannot backdate streak credit.
create or replace function public.stamp_evidence_date()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.activity_date := public.kamayo_today();
  new.created_at := now();
  return new;
end $$;
drop trigger if exists evidence_server_date on public.learning_evidence_events;
create trigger evidence_server_date before insert on public.learning_evidence_events
  for each row execute function public.stamp_evidence_date();
-- Evidence is append-only for learners (no update/delete grants exist); keep it that way.

-- 3. Published version history -------------------------------------------------------------------
create table if not exists public.learning_concept_versions (
  concept_id text not null references public.learning_concepts(id) on delete cascade,
  content_version integer not null check (content_version > 0),
  title text not null,
  summary text not null,
  english_aliases text[] not null default '{}',
  filipino_aliases text[] not null default '{}',
  fsl_reviewed_by uuid references auth.users(id),
  published_by uuid references auth.users(id),
  published_at timestamptz not null default now(),
  superseded_at timestamptz,
  primary key (concept_id, content_version)
);
alter table public.learning_concept_versions enable row level security;
revoke all on public.learning_concept_versions from anon, authenticated;
grant select on public.learning_concept_versions to anon, authenticated;
drop policy if exists read_published_versions on public.learning_concept_versions;
create policy read_published_versions on public.learning_concept_versions for select using (true);

-- Learner playback: only media for the concept's CURRENT published version.
drop policy if exists published_media_only on public.media_assets;
create policy published_media_only on public.media_assets
  for select using (
    status = 'published'
    and allow_learner_playback = true
    and contributor_permission_ref is not null
    and fsl_reviewed_by is not null
    and framing_checked_by is not null
    and exists (
      select 1 from public.learning_concepts c
      where c.id = media_assets.concept_id and c.status = 'published'
        and c.content_version = media_assets.content_version
    )
  );

-- Publishing snapshots the version. Re-publishing a concept that was edited (content_version bumped and
-- re-approved) keeps every earlier snapshot, so old evidence still resolves to what the learner actually saw.
create or replace function public.publish_concept_version(p_concept_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  c public.learning_concepts%rowtype;
  eligible_media_count integer;
begin
  if actor is null or not exists (
    select 1 from public.staff_roles where user_id = actor and role = 'administrator'
  ) then
    raise exception 'Publication requires administrator authority';
  end if;

  select * into c from public.learning_concepts where id = p_concept_id for update;
  if not found then raise exception 'Concept not found'; end if;
  if c.status <> 'approved' or c.fsl_reviewed_by is null then
    raise exception 'Concept requires FSL review and approved status before publication';
  end if;
  if exists (select 1 from public.learning_concept_versions v where v.concept_id = c.id and v.content_version >= c.content_version) then
    raise exception 'Version % is already published; bump content_version for a new edition', c.content_version;
  end if;

  select count(*) into eligible_media_count
  from public.media_assets m
  where m.concept_id = c.id
    and m.content_version = c.content_version
    and m.status in ('approved', 'published')
    and m.allow_learner_playback = true
    and m.contributor_permission_ref is not null
    and m.fsl_reviewed_by is not null
    and m.framing_checked_by is not null;
  if eligible_media_count < 1 then
    raise exception 'Cannot publish concept without at least one reviewed, permitted media asset';
  end if;

  update public.learning_concept_versions set superseded_at = now()
    where concept_id = c.id and superseded_at is null;
  insert into public.learning_concept_versions(concept_id, content_version, title, summary, english_aliases, filipino_aliases, fsl_reviewed_by, published_by)
    values (c.id, c.content_version, c.title, c.summary, c.english_aliases, c.filipino_aliases, c.fsl_reviewed_by, actor);

  update public.learning_concepts set status = 'published' where id = c.id;
  update public.media_assets set status = 'published'
    where concept_id = c.id and content_version = c.content_version and status = 'approved';
  update public.media_assets set status = 'archived'
    where concept_id = c.id and content_version < c.content_version and status = 'published';
end $$;

revoke all on function public.publish_concept_version(text) from public, anon;
grant execute on function public.publish_concept_version(text) to authenticated;
