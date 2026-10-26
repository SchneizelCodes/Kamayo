-- Local foundation. Apply to a development Supabase project after review.
-- No learner recordings, images, names, or scores are seeded here.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists public.course_levels (
 id integer primary key check(id between 1 and 100),
 title text not null, stage integer not null check(stage between 1 and 5),
 unit integer not null check(unit between 1 and 20),
 status text not null default 'draft' check(status in ('draft','fsl_review','accessibility_check','approved','published','archived')),
 content_version integer not null default 1 check(content_version>0),
 checkpoint boolean not null default false, stage_check boolean not null default false,
 fsl_reviewer uuid references auth.users(id), media_checked_by uuid references auth.users(id)
);
create table if not exists public.level_prerequisites (
 level_id integer references public.course_levels(id), prerequisite_id integer references public.course_levels(id),
 primary key(level_id, prerequisite_id), check(level_id<>prerequisite_id)
);
create table if not exists public.staff_roles (
 user_id uuid references auth.users(id) on delete cascade,
 role text check(role in ('content_author','fsl_reviewer','administrator')), primary key(user_id,role)
);
create table if not exists public.learner_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
 daily_goal integer not null default 20 check(daily_goal in (10,20,30))
);
create table if not exists public.learning_attempts (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 level_id integer not null references public.course_levels(id), content_version integer not null,
 next_question integer not null default 0 check(next_question between 0 and 3),
 completed_at timestamptz, created_at timestamptz not null default now(),
 unique(user_id,level_id,content_version)
);
create table if not exists public.level_completions (
 user_id uuid references auth.users(id) on delete cascade, level_id integer references public.course_levels(id),
 content_version integer not null, completed_at timestamptz not null default now(), primary key(user_id,level_id)
);
create table if not exists public.xp_transactions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 level_id integer not null references public.course_levels(id), amount integer not null check(amount>0 and amount<=30),
 created_at timestamptz not null default now(), unique(user_id,level_id)
);
create table if not exists public.skill_reviews (
 user_id uuid references auth.users(id) on delete cascade, skill_id text not null,
 evidence_type text not null check(evidence_type in ('orientation','recognition','comprehension','self_practice')),
 review_step integer not null default 0 check(review_step between 0 and 3),
 next_review date not null, primary key(user_id,skill_id)
);
create table if not exists private.orientation_keys (
 question integer primary key check(question between 0 and 2), answer integer not null,
 explanation text not null
);
create table if not exists public.content_audit (
 id uuid primary key default gen_random_uuid(), actor uuid not null references auth.users(id),
 level_id integer not null references public.course_levels(id), from_status text not null, to_status text not null,
 content_version integer not null, created_at timestamptz not null default now()
);
insert into public.course_levels(id,title,stage,unit,status,checkpoint,stage_check)
select n, case when n=1 then 'Welcome to FSL' else 'Upcoming level '||n end,
 ((n-1)/20)+1,((n-1)/5)+1,case when n=1 then 'published' else 'draft' end,n%5=0,n%20=0
from generate_series(1,100) n on conflict(id) do nothing;
insert into public.level_prerequisites select n,n-1 from generate_series(2,100)n on conflict do nothing;
insert into private.orientation_keys values
 (0,0,'FSL is a language with its own grammar and cultural context.'),
 (1,1,'A demonstration should keep the signer’s face, hands, and upper body in view.'),
 (2,2,'Level 100 represents course completion, not automatic fluency certification.')
on conflict(question) do update set answer=excluded.answer, explanation=excluded.explanation;

alter table public.course_levels enable row level security;
alter table public.level_prerequisites enable row level security;
alter table public.staff_roles enable row level security;
alter table public.learner_preferences enable row level security;
alter table public.learning_attempts enable row level security;
alter table public.level_completions enable row level security;
alter table public.xp_transactions enable row level security;
alter table public.skill_reviews enable row level security;
alter table public.content_audit enable row level security;
revoke all on public.course_levels,public.level_prerequisites,public.staff_roles,public.learner_preferences,public.learning_attempts,public.level_completions,public.xp_transactions,public.skill_reviews,public.content_audit from anon,authenticated;
grant select on public.course_levels, public.level_prerequisites to anon,authenticated;
grant select on public.staff_roles,public.learning_attempts,public.level_completions,public.xp_transactions,public.skill_reviews,public.content_audit to authenticated;
grant select,insert,update on public.learner_preferences to authenticated;
drop policy if exists published_levels on public.course_levels;
create policy published_levels on public.course_levels for select using(status='published');
drop policy if exists published_prerequisites on public.level_prerequisites;
create policy published_prerequisites on public.level_prerequisites for select using(exists(select 1 from public.course_levels l where l.id=level_id and l.status='published'));
drop policy if exists own_roles on public.staff_roles;
create policy own_roles on public.staff_roles for select to authenticated using(user_id=auth.uid());
drop policy if exists own_preferences on public.learner_preferences;
create policy own_preferences on public.learner_preferences to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists own_attempts on public.learning_attempts;
create policy own_attempts on public.learning_attempts for select to authenticated using(user_id=auth.uid());
drop policy if exists own_completions on public.level_completions;
create policy own_completions on public.level_completions for select to authenticated using(user_id=auth.uid());
drop policy if exists own_xp on public.xp_transactions;
create policy own_xp on public.xp_transactions for select to authenticated using(user_id=auth.uid());
drop policy if exists own_reviews on public.skill_reviews;
create policy own_reviews on public.skill_reviews for select to authenticated using(user_id=auth.uid());
drop policy if exists staff_audit on public.content_audit;
create policy staff_audit on public.content_audit for select to authenticated using(exists(select 1 from public.staff_roles where user_id=auth.uid()));

create or replace function public.begin_orientation(p_level integer default 1)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); attempt_id uuid; v integer;
begin
 if actor is null then raise exception 'Sign in to save account progress'; end if;
 if p_level<>1 then raise exception 'This lesson is not available'; end if;
 select content_version into v from public.course_levels where id=p_level and status='published';
 if v is null then raise exception 'This lesson is not available'; end if;
 if exists(select 1 from public.level_prerequisites p where p.level_id=p_level and not exists(select 1 from public.level_completions c where c.user_id=actor and c.level_id=p.prerequisite_id)) then raise exception 'Complete the prerequisites first'; end if;
 insert into public.learning_attempts(user_id,level_id,content_version) values(actor,p_level,v)
 on conflict(user_id,level_id,content_version) do update set user_id=excluded.user_id returning id into attempt_id;
 return attempt_id;
end $$;

create or replace function public.answer_orientation(p_attempt uuid,p_question integer,p_option integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.learning_attempts%rowtype; k private.orientation_keys%rowtype;
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 select * into a from public.learning_attempts where id=p_attempt and user_id=auth.uid() for update;
 if not found then raise exception 'Attempt not found'; end if;
 if p_question is null or p_option is null or p_question not between 0 and 2 or p_option not between 0 and 2 then raise exception 'Invalid answer'; end if;
 if not exists(select 1 from public.course_levels where id=a.level_id and status='published' and content_version=a.content_version) then raise exception 'Lesson changed; start again'; end if;
 select * into k from private.orientation_keys where question=p_question;
 if not found then raise exception 'Question unavailable'; end if;
 if a.completed_at is not null then return jsonb_build_object('correct',p_option=k.answer,'complete',true,'explanation',k.explanation); end if;
 if p_question>a.next_question then raise exception 'Complete the current activity first'; end if;
 if p_option<>k.answer then return jsonb_build_object('correct',false,'complete',false,'explanation',k.explanation); end if;
 if p_question<a.next_question then return jsonb_build_object('correct',true,'complete',false,'explanation',k.explanation); end if;
 update public.learning_attempts set next_question=p_question+1,completed_at=case when p_question=2 then now() else null end where id=a.id;
 if p_question=2 then
  insert into public.level_completions(user_id,level_id,content_version) values(a.user_id,a.level_id,a.content_version) on conflict do nothing;
  insert into public.xp_transactions(user_id,level_id,amount) values(a.user_id,a.level_id,20) on conflict do nothing;
  insert into public.skill_reviews(user_id,skill_id,evidence_type,next_review) values(a.user_id,'fsl-orientation','orientation',current_date+1) on conflict do nothing;
 end if;
 return jsonb_build_object('correct',true,'complete',p_question=2,'explanation',k.explanation);
end $$;

-- Roles are assigned by the database owner, never from the browser.
create or replace function public.transition_content(p_level integer,p_to text)
returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); l public.course_levels%rowtype; required_role text;
begin
 select * into l from public.course_levels where id=p_level for update;
 if not found or actor is null then raise exception 'Unavailable'; end if;
 required_role:=case
 when l.status='draft' and p_to='fsl_review' then 'content_author'
 when l.status='fsl_review' and p_to='accessibility_check' then 'fsl_reviewer'
 when l.status='accessibility_check' and p_to='approved' then 'administrator'
 when l.status='approved' and p_to='published' then 'administrator'
 when l.status='published' and p_to='archived' then 'administrator' else null end;
 if required_role is null or not exists(select 1 from public.staff_roles where user_id=actor and role=required_role) then raise exception 'This transition is not permitted'; end if;
 -- Future sign lessons require structured media and authoring support before publication.
 if p_to='published' and p_level<>1 then raise exception 'Reviewed media publishing is not implemented yet'; end if;
 update public.course_levels set status=p_to,
 fsl_reviewer=case when required_role='fsl_reviewer' then actor else fsl_reviewer end,
 media_checked_by=case when p_to='approved' then actor else media_checked_by end where id=p_level;
 insert into public.content_audit(actor,level_id,from_status,to_status,content_version) values(actor,p_level,l.status,p_to,l.content_version);
end $$;
revoke all on function public.begin_orientation(integer),public.answer_orientation(uuid,integer,integer),public.transition_content(integer,text) from public,anon;
grant execute on function public.begin_orientation(integer),public.answer_orientation(uuid,integer,integer),public.transition_content(integer,text) to authenticated;
