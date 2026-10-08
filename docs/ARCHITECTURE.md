# Architecture

## Shape

```
UI (web, PWA)  ->  server actions / route handlers  ->  domain logic (src/lib/*, pure where possible)
                                                    ->  Prisma  ->  PostgreSQL (row level security)
                                                    ->  providers: payments, invoices, email, WhatsApp, SMS
packs (src/packs/*) = configuration read by the core: terms, custom fields, request kinds, modules
```

## Core concepts (see prisma/schema.prisma)

| Concept | Table | Notes |
| --- | --- | --- |
| Customer of the platform | Organization | `packId` selects the pack; country, currency, locale, timezone per org |
| Account | User + UserContact | a person; verified phones and emails live in `UserContact` |
| Membership (the badge) | OrgUser | one person in one org: role, status, consent, wallet color and group |
| Joining | Invitation, JoinRequest | always two-sided: admin invites and the person accepts, or the person asks and an admin approves |
| Consent | OrgDataPolicy + OrgUser.hiddenFields | mandatory fields set by the org (with notice period), the rest controlled by the member |
| Dispute | ChargeDispute | recorded, stops reminders, never adjudicated by the platform |
| Person | Member | pack-defined extras in `customFields` |
| Billable unit | Household | flat, family or account |
| Who lives in / belongs to a unit, and when | HouseholdMember | dated: tenant turnover drives billing |
| Ledger bucket | Fund | HOA: general, cameras, parking gate. Synagogue: donation targets |
| Price and rules | Plan (+ Subscription) | `quantity` covers per-child fees |
| Owed | Charge | idempotent through `dedupeKey` |
| Received | Payment (+ PaymentAllocation) | provider-agnostic; `rawPayload` kept for audit |
| Legal receipt | Invoice | reference to an external licensed provider |
| Member asks and admin triage | Request | one table; the pack declares the kinds |

## Tenant isolation (two layers, both required)
1. Application: all data access goes through an org-scoped helper that injects `orgId`.
2. Database: row level security, template in `prisma/rls-template.sql`. The app role must not own the tables.
A test must prove that a query under org A cannot read org B's rows. Status: not built yet (see NEXT-STEPS).

## Money
Integer minor units + ISO currency, always. Rounding is half-up per line in minor units; a split of one fee
across occupants is designed so the lines add back to exactly one fee (see `src/lib/billing/schedule.test.ts`).

## Payments and the platform's own revenue
Members pay through the platform, but processing is done by licensed providers; we store references only.
Two money flows exist and must stay separate in the code:
1. member -> organization (the org's own provider sub-account, `PaymentAccount`), with an optional platform cut
   recorded in `Payment.platformFeeMinor` (from `Organization.platformFeeBps`);
2. organization -> platform (subscription fee for using MemberHub, `Organization.platformPlan`).
Open: provider choice, whether a "platform with sub-accounts" model is available for Israeli entities, and any
licensing or registration this model requires. All of that needs verification before commitments.

## Packs
`PackDefinition` (src/packs/types.ts): terms, enabled modules, custom fields, request kinds, event types,
default funds. `hoa` and `synagogue` are drafts derived from working code. `gym` and `club` are reserved
shapes with no source project yet.

## Provenance (what came from where)

### From d3teman (`C:\GitHub\d3teman`, synagogue and community portal)
| Taken | Where it lives now |
| --- | --- |
| Session and auth approach (jose cookie, role re-check) | `src/lib/session.ts`, adapted for multiple orgs |
| Hebrew day and month lists, relations | `src/packs/synagogue/yahrzeit.ts` (copied unchanged) |
| WhatsApp text formatter | `src/lib/messaging/whatsapp.ts` (copied unchanged) |
| Phone to WhatsApp number | `src/lib/phone.ts`, country code is now a parameter |
| Member, Family, FamilyLinkRequest | `Member`, `Household`, `HouseholdMember` (family-link flow still to build as a `Request` kind) |
| Five near-identical request tables | one `Request` table + `requestKinds` in the synagogue pack |
| Newsletter | `Campaign` |
| Transaction (Nedarim Plus) | `Payment`; amount is now integer minor units instead of Float |
| Yahrzeit | `Yahrzeit` pack table, now with `orgId` |
Not carried over: community name, logo and colors (`branding.ts`, `globals.css`), `.review_diff.txt`, the 1,554-line
`ProfileClient.tsx` (split when ported), per-community hardcoded Hebrew copy. The Nedarim webhook still has
placeholder fields for recurring payments: the real payload shape was never confirmed there either.

### From the HOA project (Python scripts and building data)
| Taken | Where it lives now |
| --- | --- |
| Fee schedule by month, routine specials, occupancy split with clean fractions | `src/lib/billing/schedule.ts`, with tests |
| Dated tenant records, opening historical debt | `HouseholdMember.startsOn/endsOn/openingBalanceMinor` |
| Funds and their display names | `Fund` |
| Cash log | `Payment` with `method: cash`, `source: manual or import` |
| Expenses | `Expense` |
| Per-child daycare fee | `Subscription.quantity` |
| Payment arrangements (installment plans) | to build: generates scheduled `Charge`s |
| Billing portal CSV import (name and flat matching, fund detection by amount or keyword) | to build as an import adapter |
| Collection letters as PDF with letterhead and Hebrew date | to build as a documents module (open: PDF library in TypeScript vs a separate service) |
| Access-control gate export | `access_control_export` module, generalized |
Not carried over: every data file, the config with real names and phones, absolute Windows font paths, the hardcoded
building, and the manual CSV workflow (replaced by the database).

The product UX (wallet, badges, invitations, privacy, families) is specified in `docs/ux-spec.he.md`.

## Rules enforced in application code
The schema cannot express these. Each one needs an implementation and a test (see NEXT-STEPS phases 3 to 6).
| Rule | Where it matters |
| --- | --- |
| At most one pending `Invitation` per org + kind + value | creating invitations |
| An invitation attaches to an account only after that exact contact is verified; it expires after 30 days | registration, adding a contact |
| Admin gets no hint whether an invited phone or email already has an account | invitation responses and errors |
| `JoinRequest` only for orgs with `visibility = listed`; per-user daily limit; admin can block a user | join requests |
| At most two payers (`HouseholdMember.isPayer`) per household at a time | household management |
| Mandatory fields can never be hidden by the member; a new mandatory field takes effect 30 days after announcement; name and a contact method are always mandatory | consent, `OrgDataPolicy` |
| A member may always leave; with an open balance the status becomes `left_with_debt` and the org keeps only mandatory fields | leaving an org |
| At most one `DebtReminder` per member per week; no reminders for a charge with an open `ChargeDispute` | reminders |
| The wallet reads across orgs only through the user-scoped path (end of `prisma/rls-template.sql`) | wallet, feed |

