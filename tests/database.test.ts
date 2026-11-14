import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, expect, it } from 'vitest';
const db = new PGlite();
const learner = '11111111-1111-4111-8111-111111111111';
beforeAll(async () => {
  await db.exec(`create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated; insert into auth.users values ('${learner}'),('22222222-2222-4222-8222-222222222222');`);
  const sql = readFileSync('supabase/migrations/202610260001_learning_foundation.sql', 'utf8');
  const contractSql = readFileSync('supabase/migrations/202611120001_content_contract_and_evidence.sql', 'utf8');
  await db.exec(sql); await db.exec(sql);
  await db.exec(contractSql); await db.exec(contractSql);
  const triageSql = readFileSync('supabase/migrations/202611130001_issue_triage_server_dates_versions.sql', 'utf8');
  await db.exec(triageSql); await db.exec(triageSql);
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${learner}',false)`);
}, 30000);
afterAll(async () => { await db.close(); });
it('refuses unpublished lessons and direct reward writes', async () => {
  await expect(db.query('select public.begin_orientation(2)')).rejects.toThrow();
  await expect(db.query(`insert into public.xp_transactions(user_id,level_id,amount) values ('${learner}',1,999)`)).rejects.toThrow();
});
it('scores on the server, permits retries, and rewards completion once', async () => {
  const { rows } = await db.query<{begin_orientation:string}>('select public.begin_orientation(1)');
  const id = rows[0].begin_orientation;
  await expect(db.query('select public.answer_orientation($1,2,1)',[id])).rejects.toThrow();
  const wrong = await db.query<{answer_orientation:{correct:boolean}}>('select public.answer_orientation($1,0,2)',[id]);
  expect(wrong.rows[0].answer_orientation.correct).toBe(false);
  await db.query('select public.answer_orientation($1,0,0)',[id]);
  await db.query('select public.answer_orientation($1,1,1)',[id]);
  await db.query('select public.answer_orientation($1,2,2)',[id]);
  await db.query('select public.answer_orientation($1,2,2)',[id]);
  const rewards = await db.query<{total:number}>('select sum(amount)::int as total from public.xp_transactions');
  expect(rewards.rows[0].total).toBe(20);
  await db.exec(`select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false)`);
  expect((await db.query('select * from public.level_completions')).rows).toHaveLength(0);
  await expect(db.query('select public.answer_orientation($1,2,2)',[id])).rejects.toThrow();
});
it('hides answer keys and prevents learner publication or staff self-assignment', async () => {
  await expect(db.query('select * from private.orientation_keys')).rejects.toThrow();
  await expect(db.query("update public.course_levels set status='published' where id=2")).rejects.toThrow();
  await expect(db.query(`insert into public.staff_roles values ('${learner}','fsl_reviewer')`)).rejects.toThrow();
});

it('enforces publication gates on concepts/media and isolates learner evidence events', async () => {
  const otherLearner = '22222222-2222-4222-8222-222222222222';
  // Switch cleanly via default postgres/superuser role to seed unreviewed + approved records for policy testing.
  await db.exec('reset role');
  await db.exec(`
    insert into public.learning_concepts(id, concept_key, domain, title, english_aliases, filipino_aliases, summary, content_version, status)
    values
      ('c-draft', 'greetings-draft', 'Greetings', 'Greetings Draft', array['hello'], array['kumusta'], 'Awaiting review', 1, 'fsl_review'),
      ('c-approved-no-media', 'family-nomedia', 'Family', 'Family No Media', array['mother'], array['nanay'], 'Needs approved asset', 1, 'approved')
    on conflict (id) do nothing;
    insert into public.staff_roles(user_id, role) values ('${learner}', 'administrator') on conflict do nothing;
  `);

  // Learner cannot publish a concept that lacks fsl_reviewed_by and an approved permitted media asset.
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${learner}',false)`);
  await expect(db.query("select public.publish_concept_version('c-approved-no-media')")).rejects.toThrow();
  await expect(db.query("select public.publish_concept_version('c-draft')")).rejects.toThrow();

  // Unpublished concepts remain hidden from learners, and learners cannot self-insert educator_assessment.
  expect((await db.query('select * from public.learning_concepts')).rows).toHaveLength(0);
  await expect(
    db.query(
      `insert into public.learning_evidence_events(user_id, concept_id, content_version, evidence_type, client_event_id) values ('${otherLearner}', 'c-draft', 1, 'educator_assessment', 'evt-forged')`
    )
  ).rejects.toThrow();
});

it('rejects evidence for a stale content version and issues filed as already resolved', async () => {
  // Regression (Claude review 2026-11-13): an unqualified content_version inside the RLS subquery bound to the
  // concept's own column, so any version number passed. The policy now compares against the inserted row.
  await db.exec('reset role');
  await db.exec(`
    insert into public.learning_concepts(id, concept_key, domain, title, english_aliases, filipino_aliases, summary, content_version, status)
    values ('c-live', 'greetings-live', 'Greetings', 'Greetings Live', array['hello'], array['kumusta'], 'Published v2', 2, 'published')
    on conflict (id) do nothing;
  `);
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${learner}',false)`);
  await expect(
    db.query(`insert into public.learning_evidence_events(user_id, concept_id, content_version, evidence_type, client_event_id) values ('${learner}', 'c-live', 1, 'self_practice', 'evt-stale')`)
  ).rejects.toThrow();
  await db.query(`insert into public.learning_evidence_events(user_id, concept_id, content_version, evidence_type, client_event_id) values ('${learner}', 'c-live', 2, 'self_practice', 'evt-current')`);
  await expect(
    db.query(`insert into public.content_issues(reporter_id, concept_id, content_version, category, note, moderation_state) values ('${learner}', 'c-live', 2, 'clarity', 'Handshape unclear at 0:03', 'resolved')`)
  ).rejects.toThrow();
  await db.query(`insert into public.content_issues(reporter_id, concept_id, content_version, category, note) values ('${learner}', 'c-live', 2, 'clarity', 'Handshape unclear at 0:03')`);
});

it('lets staff triage issue status only, and keeps learners out of triage', async () => {
  const reviewer = '33333333-3333-4333-8333-333333333333';
  const plainLearner = '22222222-2222-4222-8222-222222222222'; // `learner` was made an administrator in an earlier test
  await db.exec('reset role');
  await db.exec(`insert into auth.users values ('${reviewer}') on conflict do nothing; insert into public.staff_roles(user_id, role) values ('${reviewer}', 'fsl_reviewer') on conflict do nothing;`);
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${plainLearner}',false)`);
  const filed = await db.query<{ id: string }>(`insert into public.content_issues(reporter_id, concept_id, content_version, category, note) values ('${plainLearner}', 'c-live', 2, 'caption', 'Caption ends before the sign') returning id`);
  const id = filed.rows[0].id;
  // A learner (no staff role) cannot move their own report: the update matches no rows under RLS.
  await db.query(`update public.content_issues set moderation_state = 'resolved' where id = '${id}'`);
  await db.exec('reset role');
  expect((await db.query<{ moderation_state: string }>(`select moderation_state from public.content_issues where id = '${id}'`)).rows[0].moderation_state).toBe('open');
  // The reviewer can triage; triaged_by/at are stamped by the server.
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${reviewer}',false)`);
  await db.query(`update public.content_issues set moderation_state = 'in_review' where id = '${id}'`);
  // ...but cannot rewrite what the learner wrote (column-level grant).
  await expect(db.query(`update public.content_issues set note = 'edited by staff member' where id = '${id}'`)).rejects.toThrow();
  await db.exec('reset role');
  const row = (await db.query<{ moderation_state: string; triaged_by: string }>(`select moderation_state, triaged_by from public.content_issues where id = '${id}'`)).rows[0];
  expect(row.moderation_state).toBe('in_review');
  expect(row.triaged_by).toBe(reviewer);
});

it('ignores a learner-supplied activity date (server decides the day)', async () => {
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${learner}',false)`);
  await db.query(`insert into public.learning_evidence_events(user_id, concept_id, content_version, evidence_type, client_event_id, activity_date) values ('${learner}', 'c-live', 2, 'self_practice', 'evt-backdated', '2020-01-01')`);
  const { rows } = await db.query<{ activity_date: string; today: string }>(`select activity_date::text, public.kamayo_today()::text as today from public.learning_evidence_events where client_event_id = 'evt-backdated'`);
  expect(rows[0].activity_date).not.toBe('2020-01-01');
  expect(rows[0].activity_date).toBe(rows[0].today);
});

it('keeps every published version and rejects practice against a superseded one', async () => {
  const admin = '44444444-4444-4444-8444-444444444444';
  await db.exec('reset role');
  await db.exec(`
    insert into auth.users values ('${admin}') on conflict do nothing;
    insert into public.staff_roles(user_id, role) values ('${admin}', 'administrator') on conflict do nothing;
    insert into public.learning_concepts(id, concept_key, domain, title, summary, content_version, status, fsl_reviewed_by)
      values ('c-ver', 'meet-ver', 'Greetings', 'Meeting someone', 'Edition 1', 1, 'approved', '${admin}') on conflict (id) do nothing;
    insert into public.media_assets(id, concept_id, content_version, src, contributor_permission_ref, fsl_reviewed_by, framing_checked_by, allow_learner_playback, status)
      values ('m-ver-1', 'c-ver', 1, '/v1.mp4', 'perm-1', '${admin}', '${admin}', true, 'approved') on conflict (id) do nothing;
  `);
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${admin}',false)`);
  await db.query(`select public.publish_concept_version('c-ver')`);
  await expect(db.query(`select public.publish_concept_version('c-ver')`)).rejects.toThrow(); // cannot re-publish the same edition
  await db.exec(`select set_config('request.jwt.claim.sub','${learner}',false)`);
  await db.query(`insert into public.learning_evidence_events(user_id, concept_id, content_version, evidence_type, client_event_id) values ('${learner}', 'c-ver', 1, 'self_practice', 'evt-v1')`);
  // Educators revise the concept: edition 2 with new reviewed media.
  await db.exec('reset role');
  await db.exec(`
    update public.learning_concepts set content_version = 2, summary = 'Edition 2', status = 'approved' where id = 'c-ver';
    insert into public.media_assets(id, concept_id, content_version, src, contributor_permission_ref, fsl_reviewed_by, framing_checked_by, allow_learner_playback, status)
      values ('m-ver-2', 'c-ver', 2, '/v2.mp4', 'perm-2', '${admin}', '${admin}', true, 'approved') on conflict (id) do nothing;
  `);
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${admin}',false)`);
  await db.query(`select public.publish_concept_version('c-ver')`);
  await db.exec(`select set_config('request.jwt.claim.sub','${learner}',false)`);
  const versions = await db.query<{ content_version: number; summary: string; superseded: boolean }>(`select content_version, summary, superseded_at is not null as superseded from public.learning_concept_versions where concept_id = 'c-ver' order by content_version`);
  expect(versions.rows).toEqual([{ content_version: 1, summary: 'Edition 1', superseded: true }, { content_version: 2, summary: 'Edition 2', superseded: false }]);
  await expect(db.query(`insert into public.learning_evidence_events(user_id, concept_id, content_version, evidence_type, client_event_id) values ('${learner}', 'c-ver', 1, 'self_practice', 'evt-v1-late')`)).rejects.toThrow();
  const old = await db.query<{ content_version: number }>(`select e.content_version from public.learning_evidence_events e join public.learning_concept_versions v using (concept_id, content_version) where e.client_event_id = 'evt-v1'`);
  expect(old.rows).toEqual([{ content_version: 1 }]);
  // Learners only see the current edition's media.
  expect((await db.query<{ id: string }>(`select id from public.media_assets where concept_id = 'c-ver'`)).rows.map(r => r.id)).toEqual(['m-ver-2']);
});
