-- =============================================================================
-- Migration 019 (Phase 3 / 3A): Grants for the role model
--
-- Grants land in their own follow-on migration (known gotcha — the "expose new
-- tables" Supabase setting is off, so grants are manual + tracked here; same
-- reason 20260530000001 / 20260602000001 / 20260604000002 exist). Idempotent.
--
-- Covers: EXECUTE on the 3A helper functions for `authenticated`, and base DML
-- grants on the new member_subsystems table. RLS still decides which rows; a
-- missing grant returns 42501 "permission denied for table" BEFORE any policy
-- runs, so this must exist before 3B's member_subsystems policies are useful.
-- =============================================================================


-- ---- 1. EXECUTE on the RBAC helpers ---------------------------------------
-- Explicit grants to `authenticated` (the role the app connects as). The
-- policies in 3B call these from USING/WITH CHECK.

GRANT EXECUTE ON FUNCTION public.current_role_name()                    TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_member()                     TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_captain()                           TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_captain_or_deputy()                 TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_write_entries()                    TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_outreach_reporter()                 TO authenticated;
GRANT EXECUTE ON FUNCTION public.leads_subsystem(uuid)                  TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_row(uuid)                         TO authenticated;
GRANT EXECUTE ON FUNCTION public.within_edit_window(timestamptz)        TO authenticated;


-- ---- 2. Base DML on member_subsystems -------------------------------------
-- Mirrors the schema-wide grant model (authenticated: full DML; anon: read;
-- service_role: full DML). RLS policies (3B §5) gate the actual rows.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_subsystems TO authenticated;
GRANT SELECT                          ON public.member_subsystems TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_subsystems TO service_role;
