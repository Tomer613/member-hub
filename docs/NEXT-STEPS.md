# Task list (in order)

This is the working task list for the agent and Tommy. Rules of use:
- Work top to bottom. Phases 1 and 2 run in parallel; nothing in phase 3 and later starts before both are done.
- Each task ends with something that runs and is tested. Tick the box only when it does.
- When a task changes a decision, update `docs/ARCHITECTURE.md` and the open-decisions list at the bottom.
- Anything marked VERIFY involves law, tax, privacy or provider availability: research it from current sources
  and record the source. Do not assume.

## Phase 0. First run (Tommy, once)
- [ ] `npm install`
- [ ] Copy `.env.example` to `.env`; create a Postgres database; fill `DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET`
- [ ] `npx prisma validate`, then `npx prisma db push` (development only; production uses migrations, see 1.2)
- [ ] `npm test` (billing and phone helpers already pass), `npm run dev`

## Phase 1. Platform foundations (stability and scale, before any feature)
- [ ] 1.1 Tenant isolation: org-scoped data access helper + RLS wired with `set_config('app.org_id', ...)` per transaction; app DB role that does not own the tables; test proving a query under org A cannot read or write org B; plus the wallet read path (see the end of `prisma/rls-template.sql`): user A cannot read user B's wallet, and an org cannot see a user's other memberships
- [ ] 1.2 Migrations: switch to `prisma migrate`, one migration per change, never `db push` outside local development; documented rollback approach
- [ ] 1.3 Environments: separate development, staging and production (own database, own secrets, own provider keys)
- [ ] 1.4 Backups: automated database backups, point-in-time recovery if the host offers it, and a documented restore drill that has actually been run once
- [ ] 1.5 CI: on every change run lint, typecheck, `npm test`, `prisma validate`; block merging on failure
- [ ] 1.6 Background jobs: a queue for monthly charge generation, outbound messages and webhook processing; retries with backoff; every job idempotent (reuse `Charge.dedupeKey`, `Payment` unique on org+provider+txId)
- [ ] 1.7 Permissions: one place that maps role (owner, admin, treasurer, staff, member) to allowed actions; every server action calls it; re-check role from the database, not only from the token
- [ ] 1.8 Audit log: helper that writes `AuditLog` for every money-related and permission-related action; append-only
- [ ] 1.9 Observability: error monitoring, structured logs with `orgId` and request id, a health endpoint, an alert when a webhook or job fails repeatedly
- [ ] 1.10 Security baseline: rate limiting on login and public forms, security headers, optional two-factor for admins, secrets kept out of the repo and out of the database (per-org provider secrets go in a vault, referenced by `PaymentAccount`)
- [ ] 1.11 Privacy (VERIFY per target country, starting with Israel and the EU): data retention, member data export and deletion, where data is stored, cookie and consent needs
- [ ] 1.12 Internationalization: translation files (Hebrew first, English second), RTL and LTR from the active org's locale, currency, date and time formatting by org locale and timezone
- [ ] 1.13 File storage abstraction (letters, images, receipts) with per-org paths and signed URLs
- [ ] 1.14 Performance basics: indexes reviewed against real queries, pagination everywhere lists can grow, a load test of the monthly billing run on a large fake org (thousands of households)

## Phase 2. Design foundations (design is a priority; start in parallel with phase 1)
- Current mode (Tommy, 2026-10-08): **design and specification only, no new code** until he says otherwise. Existing code in `src/components/ui` and the gallery is a draft and is not extended in this mode.
- RTL and LTR rules: `docs/rtl-ltr.he.md`. Design in start/end terms, never left/right
- [x] 2.1a First round: three directions drawn around a single-org admin screen (done; kept only as reference, see the Design canvas). Outcome: the product is a multi-membership wallet, so the brief changed.
- [x] 2.1 DONE. Direction D (conference + festival) chosen by Tommy; rules in `docs/design-direction-d.he.md`, board sources in `design/boards/`. Brief was: visual direction, round two: three directions built around the wallet in `docs/ux-spec.he.md`: vertical lanyard-style membership badge (collapsed in list, open full screen, QR on the back), the "needs attention" feed, and the bright, saturated palette. Admin screens share the visual language but are dense. Tommy picks one before anything else in this phase is built
- [ ] 2.2 Design tokens (first version written: `src/styles/tokens.css`; remaining: motion, explicit dark-theme decision, Latin font pairing for LTR orgs, contrast check of every text/background pair, fonts now self-hosted through next/font in `layout.tsx`, verify at build). Original scope: color, typography (Hebrew and Latin pairing), spacing, radius, shadow, motion; light theme first, decide on dark theme explicitly
- [ ] 2.3 Per-organization theming: logo and `Organization.brandColor` (suggested from the logo, overridable by the org), then a per-member override in `OrgUser.cardColor` chosen from a curated palette; text color is computed for contrast so no choice can make a badge unreadable
- [ ] 2.4 Component library: code written, NOT yet typechecked or reviewed in a browser (run `npm install`, `npm run typecheck`, `npm run dev`, open `/dev/components`). In `src/components/ui`: button, chip, toggle, input, select, checkbox, card (+OrgBand), tabs, modal (native dialog), toast, table (DataTable), money/date. Still open: sortable headers and paging controls for the table, form layout helper, toast stack/provider, badge/avatar, loading skeletons. Tick when it typechecks and passes the RTL and accessibility review (2.6)
- [ ] 2.5 App shells: admin interface for desktop, member interface for mobile (installable PWA), both with navigation that reads its labels from the active pack's terms
- [ ] 2.6 RTL and LTR review (rules in `docs/rtl-ltr.he.md`) of every component; accessibility baseline. First pass done (`docs/a11y-rtl-review.he.md`: contrast fixed via `onColor`, focus ring, logical positions, tabs keyboard). Open: screen reader and keyboard pass in the browser, LTR check, modal focus return, table sorting semantics, connect `isReadableOnBoth` to the org color picker
- [ ] 2.10 Accessibility as a product requirement (`docs/accessibility.he.md`): contrast test in CI (`src/styles/contrast.test.ts` written), accessibility screen in member settings (design `D-Access` done; text size, high contrast, reduced motion, strong focus; stored in `User.accessibility`; needs a high-contrast token set that is also contrast-tested), accessibility statement page, screen reader and keyboard pass per screen, external audit before launch (VERIFY the legal scope with a lawyer)
- [ ] 2.7 Rule from now on: no screen is built before its design is approved; screens use only the design system
- [ ] 2.8 Component gallery page: written at `src/app/dev/components` (dev only, 404 in production), with org color switcher and admin density toggle. Verify in a browser
- [ ] 2.9 Org settings screen (admin): design board `D-Settings` done, spec in `docs/ux-spec.he.md` section 13 (fields and privacy with 30-day effect, card categories per pack and role, membership types and charges, payments and reminders, requests, team and permissions, invitations and joining, account). Build after the component library and the pack config (`memberActions`, fields, request kinds) exist

## Phase 3. Identity, wallet and membership (spec: `docs/ux-spec.he.md`)
- [ ] 3.1 Sign up and login by verified phone or email (one-time code via `ContactChallenge`, attempt limits); only verified values are stored in `UserContact`
- [ ] 3.2 Several verified contacts per user; adding a contact attaches matching pending invitations; merging two accounts only when both contacts are verified
- [ ] 3.3 Create an organization by choosing a pack; set visibility (private or listed), logo and color
- [ ] 3.4 Invitations: admin enters a phone or email, the person accepts (`Invitation`, expires after 30 days, no hint to the admin whether the number has an account)
- [ ] 3.5 Join requests to listed orgs, admin approval, per-user daily limit, admin can block a user (`JoinRequest`)
- [ ] 3.6 Data policy and consent: org mandatory fields with reasons, platform ceiling (name and a contact are always mandatory), member toggles (`OrgUser.hiddenFields`), 30-day notice before a new mandatory field takes effect (`OrgDataPolicy`); consent screen shown before accepting an invitation
- [ ] 3.7 The wallet read path and the "needs attention" feed across orgs, with the isolation tests from 1.1
- [ ] 3.8 Leaving an org: always allowed; with an open balance the status becomes `left_with_debt`, the badge stays, the org keeps only mandatory fields
- [ ] 3.9 Port login and change-password from d3teman; adapt to contacts instead of a single email
- [ ] 3.10 Org switcher and the admin entry point from the wallet for users who manage orgs

## Phase 4. People
- [ ] Members and households CRUD, driven by the pack's custom fields and terms
- [ ] Dated household membership (move in, move out, opening balance)
- [ ] Household roles: head, up to two payers (`isPayer`), members without any account; activity scope (household or individual) declared per kind in the pack
- [ ] Import from CSV with column mapping and a preview before saving
- [ ] Directory and privacy settings

## Phase 5. Billing
- [ ] Funds, plans, subscriptions
- [ ] Monthly charge generation using `src/lib/billing/schedule.ts`, run as a job, idempotent
- [ ] Balance and statement per household
- [ ] Payment arrangements (installment plans) generating scheduled charges
- [ ] Disputes: either side marks a charge as disputed, reminders stop, history kept (`ChargeDispute`); the platform does not adjudicate
- [ ] Reminder limit enforced in one place (`DebtReminder`, default one per member per week)

## Phase 6. Payments
- [ ] Manual payments (cash, bank) and FIFO allocation to charges
- [ ] VERIFY and choose the first payment provider and the platform-with-sub-accounts model; idempotent webhook
- [ ] Receipts and invoices through a licensed provider (VERIFY Israeli requirements)
- [ ] Platform revenue: organization subscription fee and optional percentage per payment, kept separate from the member-to-organization money flow

## Phase 7. First pack and the second (decision pending: HOA or synagogue first)
- Order of work (Tommy): finish everything shared by all organizations first (phases 1 to 6 and the shared screens), only then define organization types one by one.
- [ ] Organization templates: a categorized catalog (for example residential, religious, sports, social) where each template is a ready pack preset (terms, fields, request kinds, card categories per role, default funds, membership types). The admin picks a template when creating an organization and can change everything afterwards. Needs a `PackDefinition` extension and a template picker screen in organization setup
- [ ] Build the first pack completely on top of the core; note every place the core had to change
- [ ] Build the second pack; the amount of core change needed is the real test of the generic design

## Phase 8. Documents and communication
- [ ] Letters and statements as PDF with letterhead and Hebrew date (decision pending: TypeScript library or separate service)
- [ ] Email, WhatsApp text and SMS campaigns with unsubscribe handling

## Phase 9. Apps
- [ ] PWA hardening (offline shell, push notifications where supported)
- [ ] Native wrapper only if the PWA proves insufficient

## Open decisions
The full, current register is `docs/open-questions.he.md` (IDs Q-L1 etc.). The list below is a summary.

- Which pack ships first
- Payment provider(s), and whether money flowing through the platform needs a license or registration (VERIFY)
- Hosting provider and database host (affects backups, regions, cost)
- Job queue technology
- PDF generation approach
- Product name and brand
- QR code and entrance scanning: in the first release or only a reserved place on the badge
- Legal wording of the field consent and of leaving with debt (VERIFY)
- Organization template categories and which templates ship first
- Revisit the overall color palette once real screens exist (Tommy is not settled on it; it is all in `src/styles/tokens.css`, so changing it is cheap). Try 2 to 3 alternative palettes in `/dev/components`; run the WCAG AA contrast check at the same time
- Curated badge color palette and how the color is suggested from a logo

## Member navigation and settings (design phase, added 2026-10-08)
- [x] Notifications inbox screen first design (D-Notifications); open: org filter, empty state, long-press actions
- [ ] Design the Search screen (scopes, recent searches, permission-aware results) - ux-spec 14.4
- [x] Review all member boards in LTR with the persistent icon-only nav (done 08.10, results in `docs/rtl-ltr.he.md` section 7; directional chevrons must mirror in code; admin boards to be checked with the admin side)
- [ ] Add `User.preferences` handling (timeAxis) when coding resumes; schema field already added
- [ ] Screen-reader test of icon-only nav before launch; user test icon recognizability
- [ ] Sticky section index / search inside the member settings screen (optional)
- [ ] Wallet order editing: designed (D-WalletEdit, D-WalletMove); open: archive screen, definition of inactive (proposal in ux-spec 14.6), entry button placement on the wallet
- [ ] Notifications archive filter designed (D-NotificationsDone); open: empty states, org filter
- [ ] Product question: one-time event / shared-expense collection (e.g. a birthday where everyone chips in) as a pack or membership type
- [ ] Review every board for scroll containers that shrink cards (needs flex-shrink 0)
- [x] Wallet edit button + archive screen + delete confirm designed (D-Wallet, D-WalletArchive, D-WalletDelete); open: status label placement in notifications (proposal in ux-spec 14.2), debt-and-delete legal question
- [x] Search screen designed (D-Search, D-SearchResults, D-SearchDiscover); open: Q-P6 (searchable org data, public org flag)
- [ ] Org settings: public-organization toggle for discovery (D-Settings, section 13)
- [ ] Org-side guided setup wizard for a new organization (invitation text, activities, plans, public toggle) - D-OrgPage shows what members see
- [x] Create-organization entry points designed (member settings row, empty search); open Q-P7, Q-P8
- [ ] D-Join: optional "a few words about you" field (ux-spec 14.9)
- [ ] Empty wallet screen: two buttons (join existing / create org)
- [ ] Membership levels (labels): design display on wallet card and open card; admin column and filter; data model draft in ux-spec 14.9
- [ ] Public org page: admin picks the section heading from presets
- [ ] Login and sign-up screens (not designed yet)
- [x] Sign-in and sign-up screens designed (D-Welcome, D-Verify, D-VerifyError, D-Profile); open Q-P11
- [ ] Next in order: empty wallet (two buttons) + D-Join optional note, then labels display, then LTR check
- [ ] Labels: choose style (stamp / medal / chip) and wallet indicator (star / rosette+count / mini icons) from D-Labels
- [x] Empty wallet, join request with optional note, request sent - designed. Label decisions recorded (stamp + latest icons +N). Next: LTR check of all boards, then admin side

- [ ] Gap review written 08.10: `docs/gaps.he.md` (payments member side, notifications, account, platform business, edge cases). Next in design: payment methods and paying a charge, then notification and account settings. Admin side after that
- [x] Payments member side designed 08.10 (8 boards, `docs/ux-spec.he.md` 14.14). Next: notification and account settings, manual payment report, plan change/cancel membership, then admin side
- [x] Autopay quiet mode + manage list, manual payment report, plan change, cancel membership designed 08.10 (ux-spec 14.14-14.15). Next: notification settings per org, account settings (change phone, export, delete), then admin side
- [x] מרכז כספים, מנוי, הודעות לפי ארגון, החלפת טלפון/אובדן, ייצוא ומחיקת חשבון עוצבו 08.10 (ux-spec 14.16, 9 לוחות). הבא: צד הניהול (הגדרות ארגון, אשף הקמה, קופה, יצירת חיוב, תוויות, הרשאות מנהלים)
- [x] צד ניהול: הגדרות נראות (ציבורי), אשף הקמה 3-4, קופה, יצירת חיוב, תוויות, הרשאות עוצבו 08.10 (ux-spec 14.17). הבא: שאר מסכי הניהול (חברים/חבר בודד, בקשות הצטרפות, דוחות, הודעות לחברים, עמוד ציבורי לעריכה), מעבר על שאלות פתוחות
- [x] ניהול: בקשות הצטרפות, תיק חבר, הודעות, דוחות, עמוד ציבורי עוצבו 08.10 (ux-spec 14.18). נשארו: פניות, תפילות ואירועים (ניהול), סקירה, מראה וצבע, חשבון והסכם, מובייל קל לניהול
- [x] ניהול מודולי: ליבה + חבילה (ux-spec 14.19): D-AdmTypes, D-AdmModules, סקירה, פניות, פעילויות, מראה וצבע, חשבון. נשארו: ניהול קל במובייל, מסכי מודולים עצמם (תרומות ונדרים, יארצייט, כניסות), סיבוב ביקורת על הליבה מול ARCHITECTURE.md
- [x] מסכי מודולים (9) לשלוש חבילות עוצבו 08.10 (ux-spec 14.20). נשארו: ניהול קל במובייל, מועדון (חבילה רביעית), סיבוב ביקורת על הליבה
