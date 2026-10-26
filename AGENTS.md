# Kamayo agent instructions

Kamayo: An Interactive Filipino Sign Language Learning System.

## Shared memory (vault first)
Vault: `C:/Users/joshu/Documents/GitHub/brains` (or `BRAIN_VAULT`). It is one brain for several systems. Follow its `_guide/Agent memory workflow.md`: read → verify → improve → reply on substantive turns. The folder table is in `_guide/Start here.md`.

Read first:
1. `kamayo-brains/Kamayo start here.md`: what Kamayo is and what has been decided.
2. `kamayo-brains/Kamayo handoff.md`: current state and next steps. Update it at the end of each batch.
3. `ai-engineering/Starting a new app from Tindero's building blocks.md`: patterns worth reusing. Copy the pattern and its tests, not Tindero's business rules or data.

Shared folders to reuse: `ai-engineering/` (AI, agent and coding patterns), `ui-ux/` (design and UI), `patterns/` (sign-in, data, mobile and release patterns) and `master/` (general domain knowledge, such as `master/domains/education/`). Read `tindero-brains/` only for an example; it is Tindero's.

Where notes go:
- Kamayo-only facts and decisions go in `kamayo-brains/`.
- Anything any app could reuse goes in the matching shared folder, without Kamayo's private details.
- Uncertain ideas go in `_inbox/agent-learning/`.
- One concept per note. Search for an existing note first, and link related notes both ways.
- From a Tindero or shared note, mention a `kamayo-brains/` note by path, not with a wikilink.
- Never add `kamayo-brains` to the vault's `scripts/push-vault.mjs` lists.

Search the vault from HLPSHOP: `npx tsx scripts/search-brain-vault.ts "<topic>"`, or use plain text search on the vault folder.

## Data rules
Never store recordings or images of learners, learner names or scores, keys or passwords in the vault or the repo. Treat camera footage as personal data.

## Ways of working
- Write plans and contracts short and in plain language (vault: `Plain-language plans and contracts`).
- For each change, find the smallest root-cause fix and write a test that fails first.
- Say clearly what is implemented, deployed, tested or only proposed.
- Lesson sign content needs review by a fluent Filipino Sign Language signer. Agents must not make up how a sign is formed.
- Do not commit, push or deploy unless the owner asks.
