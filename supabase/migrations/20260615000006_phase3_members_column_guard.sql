-- =============================================================================
-- Migration 021 (Phase 3 / 3B): members privileged-column guard trigger
--
-- Closes a privilege-escalation hole in the §5 members policies. The
-- `members_update_self` policy (USING id = auth.uid()) lets a member update
-- their OWN row so they can edit their display_name. RLS cannot express a
-- column-level restriction, so on its own that policy also lets any member
-- self-promote via raw PostgREST:
--     PATCH /rest/v1/members?id=eq.<self>  { "role": "documentation_captain" }
-- The anon key is public (NEXT_PUBLIC_*) and the repo is public, so an
-- app-layer-only restriction (the 3D server action) is NOT a sufficient
-- boundary — the raw API path bypasses it. This trigger enforces the
-- restriction in the database, where it actually holds.
--
-- Rule: a non-Captain end user may not change role / is_active /
-- is_outreach_reporter on any row (including their own). Captains may (role
-- management). Service-role / migration contexts (auth.uid() IS NULL) bypass,
-- so the 3D invite flow and admin tooling are unaffected. anon cannot UPDATE
-- members at all (no UPDATE grant + no permissive policy), so the
-- auth.uid() IS NULL bypass is reachable only by service-role.
--
-- Spec note: 01-rbac-and-rls.md §5 says "enforce the column restriction at the
-- app layer". This migration moves that enforcement into the DB (a superset —
-- the app layer can still return friendly errors), because the public anon key
-- makes the app layer alone insufficient. Flagged in the 3B PR.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.enforce_members_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service-role / migration context (no end-user JWT) and Captains may change
  -- the privileged columns. is_captain() is SECURITY DEFINER and only SELECTs
  -- members, so it does not re-enter this UPDATE trigger (no recursion).
  IF auth.uid() IS NULL OR public.is_captain() THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.is_active IS DISTINCT FROM OLD.is_active
     OR NEW.is_outreach_reporter IS DISTINCT FROM OLD.is_outreach_reporter THEN
    RAISE EXCEPTION
      'Only a Documentation Captain may change role, is_active, or is_outreach_reporter';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER members_guard_privileged_columns
  BEFORE UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_members_privileged_columns();
