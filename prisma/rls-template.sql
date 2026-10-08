-- Row level security template. Run after the first migration, once per table that has "orgId".
-- Application code sets the org for the current transaction:
--   SELECT set_config('app.org_id', '<org id>', true);   -- true = local to the transaction
-- Connect the app with a role that is NOT the table owner and does NOT bypass RLS.
--
-- Example for one table (generate the rest from the list of models that have orgId):
ALTER TABLE "Member" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Member" FORCE ROW LEVEL SECURITY;
CREATE POLICY org_isolation ON "Member"
  USING ("orgId" = current_setting('app.org_id', true))
  WITH CHECK ("orgId" = current_setting('app.org_id', true));

-- ---------------------------------------------------------------------------
-- Tables WITHOUT orgId (global identity): User, UserContact, ContactChallenge.
-- They are never read through the org-scoped helper. Access only from the auth module, by user id.
--
-- The wallet (one person, many orgs) is the one place that reads across orgs. It must not run with
-- app.org_id set to any single org and must never use a role that bypasses RLS. Use a second policy
-- keyed on the signed-in user, applied to OrgUser and to the few tables the wallet shows:
--   SELECT set_config('app.user_id', '<user id>', true);
--
-- CREATE POLICY wallet_own_memberships ON "OrgUser"
--   FOR SELECT USING ("userId" = current_setting('app.user_id', true));
--
-- For balances and notices from each org, expose narrow SECURITY DEFINER functions that take the
-- user id from app.user_id and return only that person's own rows (their charges, their messages),
-- instead of widening the policies on Charge, Payment, etc. An org must never be able to learn which
-- other orgs a user belongs to, and the wallet must never return another person's data.
-- A test must prove both: user A cannot read user B's wallet; org X cannot see user A's other badges.
