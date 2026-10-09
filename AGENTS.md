# Project: MemberHub (multi-tenant membership and community SaaS)

One generic core plus per-organization-type "packs" (HOA, synagogue, gym, club). Web app and PWA first,
native apps later. International from day one (RTL + LTR, currency and locale per organization).
Solo project: prefer managed services, simple solutions, and automated tests.

Read `docs/ARCHITECTURE.md` first. The product definition (Hebrew) is `docs/product-spec.he.md` and is the
source of truth for scope. The product UX (wallet of membership badges, invitations, privacy, families) is
specified in `docs/ux-spec.he.md`: read it before touching identity, membership or any member-facing screen.
Implementation order is in `docs/NEXT-STEPS.md`.

## Stack (proposed; carried over from the working d3teman project, change only with a recorded decision)
- Next.js 16 App Router, TypeScript strict, Tailwind CSS v4
- PostgreSQL via Prisma 6, with row level security (`prisma/rls-template.sql`)
- Sessions: `jose` JWT cookie (`src/lib/session.ts`); passwords: `bcryptjs`
- Email: Resend. Payments and receipts: licensed external providers only (see below)

## Rules
- All code comments in English. Hebrew only in UI strings and user-facing copy.
- Every business table has `orgId`; every query is scoped by it. Never trust an id from the client without
  checking it belongs to the active org.
- Money is integer minor units + currency. Never Float. See `src/lib/money.ts`.
- Packs are configuration (`src/packs/*`). The core never branches on `packId`. A feature belongs in the core
  only if at least two packs need it; otherwise it is a pack module.
- Never build payment processing, card storage or legal invoicing ourselves. Use a licensed provider and store
  only references (`PaymentAccount`, `Invoice`). Webhooks must be idempotent (`Payment` unique on org+provider+txId).
- Anything about law, tax, invoicing rules or provider availability per country: mark "needs verification",
  do not assume.
- Real people's data never enters this repo: no tenant names, phones, payment rows or `.env` contents, not even in tests.
  Use obviously fake fixtures.
- Rules the database cannot enforce are listed in `docs/ARCHITECTURE.md`, section "Rules enforced in application code".
  Each needs code and an automated test; the schema only carries a comment.
- Joining an organization is always two-sided (invite then accept, or request then approve). Contacts are stored only
  after verification. Never reveal to an org or a stranger whether a phone or email has an account.
- Visual language: `docs/design-direction-d.he.md`; tokens in `src/styles/tokens.css`; components in `src/components/ui`. No hardcoded colors in components.
- RTL and LTR: `docs/rtl-ltr.he.md`. Use logical properties only (start/end, `ms-*`/`me-*`, `text-start`), never left/right.
- Accessibility is a requirement (`docs/accessibility.he.md`): any color or token change must pass `npm test` (`src/styles/contrast.test.ts`); text on org colors uses `onColor()`.
- Terminology is binding: `docs/glossary.he.md`. Never invent or reword a term, and never use the phrases it lists as avoided. UI copy follows the voice rules in `docs/brand-voice.he.md`.
- Data handling: retention periods in `docs/retention-policy.he.md`, sensitive information in `docs/sensitive-info-policy.he.md` (no medical data is stored at all). Anything legal goes to `docs/legal/questions-for-experts.he.md`, never decided in code.
- Open questions live in one place: `docs/open-questions.he.md`. Add new ones there (with an ID and a recommendation), and update the status when decided. Do not decide VERIFY items without checking a current source.
- Design comes first for the UI: build screens only from the design system (`docs/NEXT-STEPS.md`, phase 2), and only after the screen's design is approved.
- `docs/NEXT-STEPS.md` is the task list. Read it at the start of every session, work in its order, tick items only when they run and are tested.

## Reference projects (READ-ONLY)
These hold the working code this project is derived from. Read and search them freely; never edit, create or
delete files there, and never copy secrets or personal data out of them.
- d3teman (synagogue and community portal, Next.js + Prisma): `C:\GitHub\d3teman`
- HOA reports (Python scripts and real building data): see `.claude/settings.local.json` for the local path
What was taken from each, and what was deliberately left behind: `docs/ARCHITECTURE.md`, section "Provenance".

<!-- Next.js 16 has breaking changes versus older versions. Before writing framework code, read the matching
     guide under node_modules/next/dist/docs/ (as d3teman's AGENTS.md also instructs). -->
