-- =============================================================================
-- Migration 018 (Phase 3 / 3A): RBAC helper functions
--
-- A FRESH set of SECURITY DEFINER helpers keyed off auth.uid(), used by the 3B
-- RLS policies. These REPLACE the dead helpers from 20260521000006 (which
-- referenced the dropped base `entries` table + auth_user_id indirection —
-- 00-plan.md §0 / decision 1). Do not resurrect those.
--
-- SECURITY DEFINER is mandatory: it lets a helper read public.members while
-- bypassing members' own RLS, which is what prevents policy recursion (R2).
-- STABLE + SET search_path = public mirror the established helper style
-- (20260521000001). EXECUTE grants land in the grants migration.
--
-- Ownership is identity: members.id IS auth.users.id, so "my row" is
-- created_by = auth.uid() (decision 2) — no auth_user_id join.
--
-- Spec: docs/phase3/01-rbac-and-rls.md §3.
-- =============================================================================


-- current_role_name(): the active member's role as text, else NULL.
-- (New name — NOT the dead current_member_role from migration 001.)
CREATE OR REPLACE FUNCTION public.current_role_name()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT role::text
    FROM public.members
    WHERE id = auth.uid()
      AND is_active
      AND deleted_at IS NULL
    LIMIT 1
  );
END;
$$;


-- is_active_member(): the read / allowlist gate. True iff auth.uid() maps to an
-- active, non-deleted member.
CREATE OR REPLACE FUNCTION public.is_active_member()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.members
    WHERE id = auth.uid()
      AND is_active
      AND deleted_at IS NULL
  );
END;
$$;


-- is_captain(): Documentation Captain only (admin-equivalent).
CREATE OR REPLACE FUNCTION public.is_captain()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.current_role_name() = 'documentation_captain';
END;
$$;


-- is_captain_or_deputy(): the "anytime write / 24h override" class.
CREATE OR REPLACE FUNCTION public.is_captain_or_deputy()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.current_role_name()
         IN ('documentation_captain', 'deputy_documentation_captain');
END;
$$;


-- can_write_entries(): gates INSERT. Everyone except mentor (read-only) and
-- non-members.
CREATE OR REPLACE FUNCTION public.can_write_entries()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.current_role_name() IN (
    'documentation_captain',
    'deputy_documentation_captain',
    'subsystem_documentation_lead',
    'general_member'
  );
END;
$$;


-- is_outreach_reporter(): the additive Outreach Reporter boolean for auth.uid().
CREATE OR REPLACE FUNCTION public.is_outreach_reporter()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.members
    WHERE id = auth.uid()
      AND is_active
      AND deleted_at IS NULL
      AND is_outreach_reporter
  );
END;
$$;


-- leads_subsystem(p_subsystem_option_id): true iff the caller leads that
-- subsystem. False on NULL input (entries with no subsystem set).
CREATE OR REPLACE FUNCTION public.leads_subsystem(p_subsystem_option_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_subsystem_option_id IS NULL THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1
    FROM public.member_subsystems
    WHERE member_id = auth.uid()
      AND subsystem_option_id = p_subsystem_option_id
  );
END;
$$;


-- owns_row(p_created_by): identity ownership test. NULL (import rows) → false.
CREATE OR REPLACE FUNCTION public.owns_row(p_created_by uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN p_created_by IS NOT NULL AND p_created_by = auth.uid();
END;
$$;


-- within_edit_window(p_created_at): the 24h edit window. Keyed on created_at
-- (not updated_at) so re-edits don't extend the window.
CREATE OR REPLACE FUNCTION public.within_edit_window(p_created_at timestamptz)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN p_created_at + INTERVAL '24 hours' > now();
END;
$$;
