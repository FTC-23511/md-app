-- =============================================================================
-- Migration 016 (Phase 3 / 3A): Roles + members schema additions
--
-- Additive only. No behaviour change: the permissive *_all_authenticated RLS
-- policies stay in place this batch (3B replaces them). This migration
-- re-creates the member_role enum (dropped with the legacy schema in
-- 20260528000001), adds the three role-model columns to public.members, and
-- adds the member_subsystems mapping table that replaces the dropped
-- subsystem_leads table.
--
-- Spec: docs/phase3/01-rbac-and-rls.md §1. Plan: docs/phase3/00-plan.md §0/§1.
-- The live members shape (id IS auth.users.id; no role/team_id/auth_user_id)
-- is the reconciled state per 00-plan.md §0 — do NOT reuse the dead helpers
-- from migration 20260521000006.
-- =============================================================================


-- ---- 1. Re-create the member_role enum ------------------------------------
-- 5 values. NO 'outreach_reporter' — that is an additive boolean column, not a
-- role (00-plan.md §1 / R7). IF NOT EXISTS so the migration is idempotent.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_role') THEN
    CREATE TYPE public.member_role AS ENUM (
      'documentation_captain',
      'deputy_documentation_captain',
      'subsystem_documentation_lead',
      'general_member',
      'mentor'
    );
  END IF;
END;
$$;


-- ---- 2. Add the role-model columns to members -----------------------------
-- All additive with defaults, so the on_auth_user_created trigger (which only
-- inserts id/email/display_name) keeps working: a new auth user is auto-created
-- as an active general_member who is not an outreach reporter.

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS role public.member_role NOT NULL DEFAULT 'general_member',
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_outreach_reporter boolean NOT NULL DEFAULT false;


-- ---- 3. member_subsystems mapping table -----------------------------------
-- Replaces the dropped subsystem_leads table. Subsystems live as option_lists
-- rows (category='subsystem'), so this maps a member to one or more subsystem
-- option ids. Used by leads_subsystem() (helpers migration) + the 3B subsystem
-- write clause on hw_change_logs / decision_logs.

CREATE TABLE IF NOT EXISTS public.member_subsystems (
  member_id           uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  subsystem_option_id uuid NOT NULL REFERENCES public.option_lists(id),
  PRIMARY KEY (member_id, subsystem_option_id)
);

-- RLS enabled now; its policies land in 3B alongside the entry-table swap.
-- Until then no policy exists, so authenticated reads/writes are denied by
-- default — harmless this batch because nothing reads it yet (3A is DB-only).
ALTER TABLE public.member_subsystems ENABLE ROW LEVEL SECURITY;
