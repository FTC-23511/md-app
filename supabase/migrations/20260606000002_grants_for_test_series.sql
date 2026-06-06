-- =============================================================================
-- Migration 017: GRANT base privileges on test_series
--
-- Migrations 012/013 set ALTER DEFAULT PRIVILEGES, so a table created by
-- migration 016 SHOULD inherit grants for authenticated/anon/service_role
-- automatically. We re-run the explicit GRANT ON ALL TABLES anyway because:
--   - the "expose new tables" Supabase setting is off, so grants are manual +
--     tracked here (known gotcha — same reason 012/013/015 exist), and
--   - it is the single, auditable place that proves the new table is reachable
--     before RLS evaluates (a missing grant returns 42501 "permission denied
--     for table" *before* the permissive policy runs).
--
-- Idempotent — safe to run multiple times. Mirrors migration 015
-- (grants_for_phase2_tables).
-- =============================================================================

-- authenticated: full DML; RLS policies decide which rows. The app connects
-- as this role and both reads trends and writes a rollup row per submit.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- anon: read-only across the schema (matches the prior grant model).
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- service_role: full DML for server-side tooling. The fallback importer writes
-- test_series rows via the shared compute module (2C item 6).
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
