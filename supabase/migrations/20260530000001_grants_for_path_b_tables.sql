-- =============================================================================
-- Migration 012: GRANT base privileges on the path-B schema
--
-- The original grants migration (008) used `GRANT ... ON ALL TABLES IN SCHEMA
-- public` which only applies to tables existing at the time of the GRANT.
-- After migrations 009/010/011 dropped the legacy tables and created the
-- spec-architecture tables (option_lists, session_logs, outreach_logs,
-- meeting_notes, flags, classification_index, award_criteria_snapshot, and
-- the reshaped members), those new tables had no grants — Postgres returns
-- "permission denied for table" *before* RLS gets a chance to evaluate.
--
-- This migration re-runs the grants on the current schema. Idempotent — safe
-- to run multiple times.
-- =============================================================================

-- Authenticated role: full DML on every table; RLS policies decide which rows.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Anon role: read-only across the schema; Phase 1 RLS is permissive so anon
-- sees nothing without an explicit policy, but matching the prior grant model
-- avoids surprise differences if Phase 4 adds public-read policies.
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Ensure tables created by future migrations also inherit these grants
-- (otherwise the same bug recurs every time we add a table).
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon;
