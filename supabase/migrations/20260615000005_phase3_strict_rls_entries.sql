-- =============================================================================
-- Migration 020 (Phase 3 / 3B): Strict role-based RLS — the security cutover
--
-- Replaces the permissive `*_all_authenticated` (FOR ALL USING true) policy on
-- every entry table + `members` with the role-based policies from the charter
-- §6 matrix. This is a REPLACEMENT, not an addition (CLAUDE.md "Phase 3
-- replaces, not adds").
--
-- Cutover safety: the whole migration runs in ONE transaction (Supabase wraps
-- each migration file), and per table we DROP the permissive policy then CREATE
-- the four role-based ones in that same transaction — so there is never a
-- deny-all gap and never a both-policies-live window (R9). Helpers from 3A
-- (20260615000003) are all SECURITY DEFINER, so reading `members` inside a
-- policy never recurses (R2).
--
-- Spec: docs/phase3/01-rbac-and-rls.md §4 (entry tables) + §5 (members /
-- member_subsystems). Plan: docs/phase3/00-plan.md §1 matrix.
--
-- DEVIATION FROM SPEC §4 (flagged in PR): the UPDATE WITH CHECK in the spec is
-- `created_by = auth.uid() OR is_captain_or_deputy()`. Taken literally that
-- makes the ratified Subsystem-Lead extended write (R6) inoperative — a lead
-- editing an hw/decision row they LEAD but did not AUTHOR passes the UPDATE
-- USING (subsystem clause) but fails WITH CHECK, so the update is denied. To
-- make the ratified grant actually function, WITH CHECK here mirrors USING's
-- writer set (adds the outreach + subsystem clauses). On the 8 non-subsystem,
-- non-outreach tables both clauses are FALSE, so WITH CHECK is byte-identical
-- to the spec there; only hw_change_logs / decision_logs (subsystem) gain the
-- extra writer, which is exactly the intended behaviour.
-- =============================================================================


-- ---- 1. The 10 entry tables ------------------------------------------------
-- Per-table substitutions (00-plan.md §1 / 01-rbac-and-rls.md §4):
--   <OUTREACH_CLAUSE>  real only on outreach_logs, else FALSE
--   <SUBSYSTEM_CLAUSE> real only on hw_change_logs + decision_logs, else FALSE

DO $$
DECLARE
  t                 text;
  outreach_clause   text;
  subsystem_clause  text;
  entry_tables      text[] := ARRAY[
    'session_logs', 'outreach_logs', 'meeting_notes', 'comp_recaps', 'contacts',
    'contact_logs', 'hw_change_logs', 'sw_change_logs', 'test_logs', 'decision_logs'
  ];
BEGIN
  FOREACH t IN ARRAY entry_tables LOOP

    -- Pick the table-specific clauses.
    IF t = 'outreach_logs' THEN
      outreach_clause := 'is_outreach_reporter() AND owns_row(created_by)';
    ELSE
      outreach_clause := 'FALSE';
    END IF;

    IF t IN ('hw_change_logs', 'decision_logs') THEN
      subsystem_clause := 'leads_subsystem(subsystem_option_id)';
    ELSE
      subsystem_clause := 'FALSE';
    END IF;

    -- Drop the permissive Phase 1 policy (same transaction → no gap).
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_all_authenticated', t);

    -- SELECT — every active member reads all non-deleted rows.
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated '
      || 'USING ( is_active_member() AND deleted_at IS NULL )',
      t || '_select', t
    );

    -- INSERT — writers (not mentors/non-members) create as themselves; the
    -- created_by = auth.uid() check makes authorship unforgeable even via raw
    -- PostgREST (R4). created_via must be 'app' (fallback/import use service-role
    -- and bypass RLS entirely).
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated '
      || 'WITH CHECK ( can_write_entries() AND created_by = auth.uid() AND created_via = ''app'' )',
      t || '_insert', t
    );

    -- UPDATE — composite gate (clauses OR together). Captain/Deputy may also
    -- update soft-deleted rows (restore). See the DEVIATION note above for the
    -- WITH CHECK writer set.
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated '
      || 'USING ( '
      || '  ( deleted_at IS NULL OR is_captain_or_deputy() ) '
      || '  AND ( '
      || '    is_captain_or_deputy() '
      || '    OR ( owns_row(created_by) AND within_edit_window(created_at) ) '
      || '    OR ( %s ) '
      || '    OR ( %s ) '
      || '  ) '
      || ') '
      || 'WITH CHECK ( '
      || '  is_captain_or_deputy() '
      || '  OR created_by = auth.uid() '
      || '  OR ( %s ) '
      || '  OR ( %s ) '
      || ')',
      t || '_update', t, outreach_clause, subsystem_clause, outreach_clause, subsystem_clause
    );

    -- DELETE — Captain-only hard delete (routine deletes are soft via
    -- UPDATE → deleted_at).
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING ( is_captain() )',
      t || '_delete', t
    );

  END LOOP;
END;
$$;


-- ---- 2. members table policies (§5) ---------------------------------------
-- Replace the permissive policy. Direct id = auth.uid() / SECURITY DEFINER
-- helpers only — never a non-definer self-select on members (R2).

DROP POLICY IF EXISTS members_all_authenticated ON public.members;

-- SELECT: any active member reads the roster (dashboard + admin UI need it).
-- A deactivated member: is_active_member() is false → 0 rows → the membership
-- gate in middleware bounces them to /forbidden.
CREATE POLICY members_select ON public.members
  FOR SELECT TO authenticated
  USING ( is_active_member() );

-- UPDATE (Captain): manages role / is_active / is_outreach_reporter for anyone.
CREATE POLICY members_update_captain ON public.members
  FOR UPDATE TO authenticated
  USING ( is_captain() )
  WITH CHECK ( is_captain() );

-- UPDATE (self): a member may edit their own profile row (e.g. display_name).
-- The column restriction (no self-promotion to a higher role / no self-
-- reactivation) is enforced at the app layer in the 3D server action, since
-- RLS can't cleanly diff which columns changed.
CREATE POLICY members_update_self ON public.members
  FOR UPDATE TO authenticated
  USING ( id = auth.uid() )
  WITH CHECK ( id = auth.uid() );


-- ---- 3. member_subsystems policies (§5) -----------------------------------
-- SELECT for any active member; full management for Captain/Deputy (they assign
-- subsystem leads). member_subsystems had RLS enabled in 3A with no policy yet.

CREATE POLICY member_subsystems_select ON public.member_subsystems
  FOR SELECT TO authenticated
  USING ( is_active_member() );

CREATE POLICY member_subsystems_manage ON public.member_subsystems
  FOR ALL TO authenticated
  USING ( is_captain_or_deputy() )
  WITH CHECK ( is_captain_or_deputy() );
