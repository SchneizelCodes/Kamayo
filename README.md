# Kamayo

An Interactive Filipino Sign Language Learning System.

## Run locally

Requires Node.js 22.12+ (verified with 24.14).

```powershell
npm.cmd ci
npm.cmd run dev
```

Open the printed local address (normally http://127.0.0.1:5173).

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run preview
```

## Implemented

- React + TypeScript + Vite application, with original teal/cream visual design, sprout companion, responsive desktop sidebar and mobile bottom navigation, reduced-motion support and evening mode.
- Home, 100-level map with five stages and 20 units, map/list views, review space, dictionary topic search/filtering, family relationship tree/list, profile and daily goal settings.
- Three-part FSL orientation with teaching, questions, hints, retry explanations, resumption, a first milestone and one-time 20 XP reward. It teaches no invented sign formations.
- Local preview progress in browser storage, explicitly separated from account progress. No camera, recordings, learner names, or family records are collected.
- Optional Supabase email-link sign-in, account progress loading, server-checked orientation, saved goals and sign-out. Configuration and a development database are required to exercise this mode.
- Rerunnable Supabase migration: course/prerequisite records, preferences, attempts, completions, XP ledger, review schedule, staff roles and publication audit. RLS protects private rows; trusted functions own scoring and rewards.
- Database tests execute the migration twice and check repeat rewards, answer order, retries, ownership, restricted answer keys, direct writes and staff assignment.

## Configure a development backend

1. Create your own **development** Supabase project. Review `supabase/migrations/202610260001_learning_foundation.sql`, then apply it with your normal migration workflow. This project has not applied it to any remote database.
2. Supply `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` through your local environment or an ignored `.env.local` file. These are the project URL and public anonymous/publishable key. Never use a service-role or secret key in a `VITE_` variable.
3. In Supabase Auth, enable email sign-in and allow the local origin as a redirect URL. Configure production redirect URLs separately before release.
4. Restart the dev server. Profile will offer email-link sign-in. The application does not import local preview XP into your account.
5. Sign in with separate development accounts and verify the account workflow against the deployed migration before any pilot.

The browser calls `begin_orientation` and `answer_orientation`; it cannot directly write completions or XP. The final correct answer updates completion, XP and the review record in one transaction. Row locks plus unique keys prevent repeat requests from issuing duplicate completion rewards. Production should additionally configure authentication abuse controls, monitoring and backups.

## Content status and remaining release work

Only **Level 1: Welcome to FSL** is available. Its general orientation text still needs educator/content review before a public pilot. Levels 2–100 are an explicit proposed curriculum framework. They are marked upcoming, even when their prerequisite is completed. All sign demonstrations, dictionary entries and sign-specific assessments require fluent FSL review, accessible media, contributor permission and versioning before publication.

The database has role separation and a guarded publication transition function. Full staff authoring screens, media upload/transcoding, sign activity schemas, versioned content editing, educator feedback, advanced assessments, placement and the full retention scheduler are **not implemented**. Publishing sign levels is intentionally refused by the current backend until that content pipeline exists. Administrators cannot assign themselves the FSL reviewer role from the browser.

The current optional server scoring supports the orientation only. Browser-local preview answers and progress are demonstration state, not a trusted assessment record. Recognition/comprehension checks and self-reported signing practice must remain separate evidence types when the content engine expands. Level 100 never automatically certifies fluency.

No production deployment, live database migration, commits or pushes were performed. Fonts use Google Fonts with local system fallbacks; the app otherwise runs without externally hosted visual assets.

## Project map

- `src/main.tsx`: learner screens, lesson flow and responsive navigation.
- `src/styles.css`: layout, design system, breakpoints and accessibility styles.
- `src/learning.ts`: curriculum framework and local preview mechanics.
- `src/account.tsx`: optional Supabase authentication and progress adapter.
- `supabase/migrations/`: development database foundation.
- `tests/`: learning and PostgreSQL permission/reward checks.
- `docs/HANDOFF.md`: current implementation and next steps.
