-- =============================================================================
-- Migration 023 (Phase 3 / 3C): grants for the edit-audit objects
--
-- Grants in their own follow-on migration (known gotcha — see 015/019). The
-- table is RLS-protected; these grants only make it reachable before RLS
-- evaluates. Idempotent.
-- =============================================================================

-- authenticated: read the trail + insert (RLS restricts inserts to Captain/Deputy).
GRANT SELECT, INSERT ON public.entry_edit_audit TO authenticated;

-- anon: read-only across the schema (matches the prior grant model).
GRANT SELECT ON public.entry_edit_audit TO anon;

-- service_role: full DML for server-side tooling.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entry_edit_audit TO service_role;

-- EXECUTE on the override RPC.
GRANT EXECUTE ON FUNCTION public.record_entry_edit(text, uuid, text) TO authenticated;
