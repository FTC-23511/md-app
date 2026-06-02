-- =============================================================================
-- Migration 013: GRANT base privileges to the service_role
--
-- Migrations 008 and 012 granted DML to `authenticated` and read to `anon`,
-- but never to `service_role`. The logged-in app works (it connects as
-- `authenticated`), so this gap stayed invisible — until the fallback importer
-- (scripts/fallback/import.ts) ran. That script intentionally connects with the
-- SUPABASE_SERVICE_ROLE_KEY (it runs outside any user session and writes rows
-- with created_by = NULL, created_via = 'fallback_form'), so it hits Postgres
-- as `service_role` and gets "permission denied for table" (42501) before RLS
-- is ever evaluated.
--
-- This grants the service_role the privileges the importer needs, mirroring the
-- 012 model for authenticated. Idempotent — safe to run multiple times.
-- =============================================================================

-- service_role: full DML on every table. The service role bypasses RLS by
-- design (it is the trusted backend/admin key), so these grants are what gate
-- it. Used only by server-side tooling that holds the service key, never the
-- browser.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Ensure tables created by future migrations also inherit these grants
-- (otherwise the same bug recurs every time we add a table).
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO service_role;
