import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, expect, it } from 'vitest';
const db = new PGlite();
const learner = '11111111-1111-4111-8111-111111111111';
beforeAll(async () => {
  await db.exec(`create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated; insert into auth.users values ('${learner}'),('22222222-2222-4222-8222-222222222222');`);
  const sql = readFileSync('supabase/migrations/202610260001_learning_foundation.sql', 'utf8');
  await db.exec(sql); await db.exec(sql);
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
