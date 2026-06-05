-- =============================================================================
-- Migration 015: GRANT base privileges on the Phase 2 tables
--
-- Migrations 012/013 set ALTER DEFAULT PRIVILEGES, so tables created by
-- migration 014 SHOULD inherit grants for authenticated/anon/service_role
-- automatically. We re-run the explicit GRANT ON ALL TABLES anyway because:
--   - the "expose new tables" Supabase setting is off, so grants are manual +
--     tracked here (known gotcha — same reason 012 and 013 exist), and
--   - it is the single, auditable place that proves the new tables are
--     reachable before RLS evaluates (a missing grant returns 42501
--     "permission denied for table" *before* the permissive policy runs).
--
-- Idempotent — safe to run multiple times. Mirrors 012 (authenticated/anon)
-- and 013 (service_role).
-- =============================================================================

-- authenticated: full DML; RLS policies decide which rows. The app connects
-- as this role.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- anon: read-only across the schema (matches the prior grant model).
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- service_role: full DML for server-side tooling (the fallback importer writes
-- test_logs.computed via the shared compute module starting in 2C).
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
