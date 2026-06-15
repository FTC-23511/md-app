-- =============================================================================
-- Migration 017 (Phase 3 / 3A): Seed — promote App Lead + backfill created_by
--
-- Runs BEFORE 3B flips any policy (R1 lockout safety): the App Lead becomes
-- Documentation Captain while the permissive policies still hold, so they can
-- never be locked out at the strict-RLS cutover.
--
-- The App Lead is resolved by email (= ALLOWED_EMAIL = team@seattlesolvers.com),
-- not a hardcoded uid. members.id IS auth.users.id, and the App Lead's member
-- row was backfilled at 20260528000001:155, so the lookup is stable and the
-- same value is correct on dev and prod (same user). Idempotent.
--
-- Spec: docs/phase3/01-rbac-and-rls.md §2. Plan: docs/phase3/00-plan.md §0.
-- =============================================================================

DO $$
DECLARE
  v_app_lead_id uuid;
BEGIN
  -- Resolve the App Lead's auth uid by the allowlist email.
  SELECT id INTO v_app_lead_id
  FROM auth.users
  WHERE email = 'team@seattlesolvers.com';

  -- Fail loudly rather than silently NULL-ing created_by if the row is missing.
  IF v_app_lead_id IS NULL THEN
    RAISE EXCEPTION
      'App Lead auth user (team@seattlesolvers.com) not found — cannot seed Captain / backfill created_by';
  END IF;

  -- ---- 1. Backfill created_by on app-authored rows ------------------------
  -- Scoped to created_via = 'app' so genuine fallback/import rows keep
  -- created_by = NULL (Captain-managed; falls out of the RLS pattern in 3B §4).
  -- WHERE created_by IS NULL keeps it idempotent and never reassigns an entry
  -- already owned by a real member.
  UPDATE public.session_logs   SET created_by = v_app_lead_id WHERE created_by IS NULL AND created_via = 'app';
  UPDATE public.outreach_logs  SET created_by = v_app_lead_id WHERE created_by IS NULL AND created_via = 'app';
  UPDATE public.meeting_notes  SET created_by = v_app_lead_id WHERE created_by IS NULL AND created_via = 'app';
  UPDATE public.comp_recaps    SET created_by = v_app_lead_id WHERE created_by IS NULL AND created_via = 'app';
  UPDATE public.contacts       SET created_by = v_app_lead_id WHERE created_by IS NULL AND created_via = 'app';
  UPDATE public.contact_logs   SET created_by = v_app_lead_id WHERE created_by IS NULL AND created_via = 'app';
  UPDATE public.hw_change_logs SET created_by = v_app_lead_id WHERE created_by IS NULL AND created_via = 'app';
  UPDATE public.sw_change_logs SET created_by = v_app_lead_id WHERE created_by IS NULL AND created_via = 'app';
  UPDATE public.test_logs      SET created_by = v_app_lead_id WHERE created_by IS NULL AND created_via = 'app';
  UPDATE public.decision_logs  SET created_by = v_app_lead_id WHERE created_by IS NULL AND created_via = 'app';

  -- ---- 2. Promote the App Lead to Documentation Captain -------------------
  UPDATE public.members
  SET    role = 'documentation_captain',
         is_active = true
  WHERE  id = v_app_lead_id;
END;
$$;
