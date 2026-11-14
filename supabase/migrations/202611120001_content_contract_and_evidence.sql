-- Content contract, documented variants, versioned media rights, and separated learning evidence.
-- Additive migration for local/development verification (PGlite / Postgres). Do NOT publish Level 2+ without review.

create table if not exists public.learning_concepts (
  id text primary key,
  concept_key text not null unique,
  domain text not null check (domain in ('Greetings', 'Family', 'Everyday', 'Repair')),
  title text not null,
  english_aliases text[] not null default '{}',
  filipino_aliases text[] not null default '{}',
  summary text not null,
  content_version integer not null default 1 check (content_version > 0),
  status text not null default 'draft' check (
    status in ('draft', 'fsl_review', 'accessibility_check', 'approved', 'published', 'archived')
  ),
  fsl_reviewed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.sign_variants (
  id text primary key,
  concept_id text not null references public.learning_concepts(id) on delete cascade,
  usage_context text not null,
  regional_notes text not null default '',
  fsl_reviewed_by uuid references auth.users(id),
  status text not null default 'draft' check (
    status in ('draft', 'fsl_review', 'accessibility_check', 'approved', 'published', 'archived')
  )
);

create table if not exists public.media_assets (
  id text primary key,
  concept_id text not null references public.learning_concepts(id) on delete cascade,
  content_version integer not null check (content_version > 0),
  src text not null,
  caption_text text,
  performer_credit text,
  contributor_permission_ref text,
  fsl_reviewed_by uuid references auth.users(id),
  framing_checked_by uuid references auth.users(id),
  allow_learner_playback boolean not null default false,
  allow_offline_pack boolean not null default false,
  mirrored boolean not null default false check (mirrored = false),
  status text not null default 'draft' check (
    status in ('draft', 'fsl_review', 'accessibility_check', 'approved', 'published', 'archived')
  )
);

create table if not exists public.learning_evidence_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  concept_id text not null references public.learning_concepts(id) on delete cascade,
  content_version integer not null check (content_version > 0),
  evidence_type text not null check (
    evidence_type in ('viewed', 'comprehension_result', 'retrieval_result', 'self_practice', 'educator_assessment')
  ),
  client_event_id text not null,
  activity_date date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, client_event_id)
);

create table if not exists public.content_issues (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  concept_id text not null references public.learning_concepts(id) on delete cascade,
  content_version integer not null check (content_version > 0),
  category text not null check (category in ('clarity', 'caption', 'variation', 'playback', 'accessibility')),
  note text not null check (char_length(note) between 8 and 500),
  moderation_state text not null default 'open' check (moderation_state in ('open', 'in_review', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

alter table public.learning_concepts enable row level security;
alter table public.sign_variants enable row level security;
alter table public.media_assets enable row level security;
alter table public.learning_evidence_events enable row level security;
alter table public.content_issues enable row level security;

revoke all on public.learning_concepts, public.sign_variants, public.media_assets,
  public.learning_evidence_events, public.content_issues from anon, authenticated;

grant select on public.learning_concepts, public.sign_variants, public.media_assets to anon, authenticated;
grant select, insert on public.learning_evidence_events, public.content_issues to authenticated;

drop policy if exists published_concepts_only on public.learning_concepts;
create policy published_concepts_only on public.learning_concepts
  for select using (status = 'published');

drop policy if exists published_variants_only on public.sign_variants;
create policy published_variants_only on public.sign_variants
  for select using (
    status = 'published'
    and exists (
      select 1 from public.learning_concepts c
      where c.id = concept_id and c.status = 'published'
    )
  );

drop policy if exists published_media_only on public.media_assets;
create policy published_media_only on public.media_assets
  for select using (
    status = 'published'
    and allow_learner_playback = true
    and contributor_permission_ref is not null
    and fsl_reviewed_by is not null
    and framing_checked_by is not null
  );

drop policy if exists own_evidence_select on public.learning_evidence_events;
create policy own_evidence_select on public.learning_evidence_events
  for select to authenticated using (user_id = auth.uid());

-- Learners can record self-reported practice or viewed events only; educator_assessment is server/educator-only.
drop policy if exists own_learner_evidence_insert on public.learning_evidence_events;
create policy own_learner_evidence_insert on public.learning_evidence_events
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and evidence_type in ('viewed', 'self_practice')
    and exists (
      select 1 from public.learning_concepts c
      -- Qualify the outer row: an unqualified content_version would bind to c.content_version and always match.
      where c.id = learning_evidence_events.concept_id and c.status = 'published'
        and c.content_version = learning_evidence_events.content_version
    )
  );

drop policy if exists staff_read_issues on public.content_issues;
create policy staff_read_issues on public.content_issues
  for select to authenticated using (
    reporter_id = auth.uid()
    or exists (select 1 from public.staff_roles where user_id = auth.uid())
  );

drop policy if exists learner_report_issue on public.content_issues;
create policy learner_report_issue on public.content_issues
  for insert to authenticated
  with check (
    reporter_id = auth.uid()
    and moderation_state = 'open'  -- learners cannot file an issue as already resolved/dismissed
    and exists (select 1 from public.learning_concepts c where c.id = content_issues.concept_id and c.status = 'published')
  );

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
  if not found then
    raise exception 'Concept not found';
  end if;
  if c.status <> 'approved' or c.fsl_reviewed_by is null then
    raise exception 'Concept requires FSL review and approved status before publication';
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

  update public.learning_concepts set status = 'published' where id = c.id;
  update public.media_assets
    set status = 'published'
    where concept_id = c.id and content_version = c.content_version and status = 'approved';
end $$;

revoke all on function public.publish_concept_version(text) from public, anon;
grant execute on function public.publish_concept_version(text) to authenticated;

