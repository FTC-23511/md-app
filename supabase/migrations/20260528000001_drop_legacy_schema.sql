-- =============================================================================
-- Migration 009: Drop legacy schema (path B — migrate to spec architecture)
--
-- The auth-batch migrations (001–008) shipped a schema variant that used
-- Postgres ENUM types + explicit typed columns per entry type + a shared
-- base `entries` table with cross-cutting child tables. The Phase 1 spec
-- in docs/phase1/02-schema.md takes a different approach: an `option_lists`
-- table for user-extensible enumerations + an `extras` JSONB column on each
-- standalone detail table + no shared base table.
--
-- The App Lead chose path B after the routine surfaced the mismatch in cycle 2
-- (2026-05-28). No real production data exists yet; the migration is
-- destructive on dev (DROP TABLE … CASCADE) and explicitly safe to run.
--
-- This migration ONLY drops legacy tables, types, and triggers, plus replaces
-- `members` and its auth trigger to match `02-schema.md` §4.1. Subsequent
-- migrations (010, 011) create the new option_lists and Phase 1 detail tables.
--
-- See also:
--   - docs/briefs/2026-05-28-forms-rev2.md (the brief that mandates this)
--   - docs/phase1/02-schema.md §§4.1–4.6, §§5.1–5.3 (the target schema)
-- =============================================================================


-- ---- 1. Drop the auth trigger on auth.users -------------------------------
-- The legacy `handle_new_auth_user` writes members rows in the old shape.
-- We'll replace both the function and the trigger at the bottom.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_auth_user();


-- ---- 2. Drop detail tables (Tier 1 + Tier 2) ------------------------------
-- Detail tables FK back to `entries.id`, so they're dropped before `entries`.
-- CASCADE handles their RLS policies, indexes, and triggers.

DROP TABLE IF EXISTS public.outreach_stories          CASCADE;
DROP TABLE IF EXISTS public.session_logs              CASCADE;
DROP TABLE IF EXISTS public.outreach_logs             CASCADE;
DROP TABLE IF EXISTS public.meeting_notes             CASCADE;
DROP TABLE IF EXISTS public.competition_recaps        CASCADE;
DROP TABLE IF EXISTS public.competition_pit_panels    CASCADE;
DROP TABLE IF EXISTS public.competition_failure_analyses CASCADE;
DROP TABLE IF EXISTS public.competition_notable_matches  CASCADE;
DROP TABLE IF EXISTS public.competition_strategic_insights CASCADE;
DROP TABLE IF EXISTS public.decision_logs             CASCADE;
DROP TABLE IF EXISTS public.decision_alternatives     CASCADE;
DROP TABLE IF EXISTS public.hardware_change_logs      CASCADE;
DROP TABLE IF EXISTS public.hardware_change_deltas    CASCADE;
DROP TABLE IF EXISTS public.software_change_logs      CASCADE;
DROP TABLE IF EXISTS public.test_series               CASCADE;
DROP TABLE IF EXISTS public.test_logs                 CASCADE;
DROP TABLE IF EXISTS public.contacts                  CASCADE;
DROP TABLE IF EXISTS public.contact_logs              CASCADE;
DROP TABLE IF EXISTS public.subsystem_handoffs        CASCADE;


-- ---- 3. Drop cross-cutting tables (entries + children) --------------------

DROP TABLE IF EXISTS public.entry_attendees       CASCADE;
DROP TABLE IF EXISTS public.entry_revisions       CASCADE;
DROP TABLE IF EXISTS public.media_attachments     CASCADE;
DROP TABLE IF EXISTS public.flags                 CASCADE;
DROP TABLE IF EXISTS public.action_items          CASCADE;
DROP TABLE IF EXISTS public.awards                CASCADE;
DROP TABLE IF EXISTS public.award_criteria        CASCADE;
DROP TABLE IF EXISTS public.classification_tags   CASCADE;
DROP TABLE IF EXISTS public.entries               CASCADE;


-- ---- 4. Drop core reference tables ----------------------------------------
-- Spec doesn't use teams/seasons/subsystem_leads (Phase 3 multi-team).
-- subsystems become an option_lists category in migration 010.

DROP TABLE IF EXISTS public.subsystem_leads       CASCADE;
DROP TABLE IF EXISTS public.subsystems            CASCADE;
DROP TABLE IF EXISTS public.seasons               CASCADE;
DROP TABLE IF EXISTS public.teams                 CASCADE;


-- ---- 5. Drop members so we can recreate per spec --------------------------
-- Spec's `members` has `id` = auth.users.id directly (no separate UUID PK,
-- no auth_user_id FK, no team_id, no role enum). Cleaner to drop and recreate
-- than to ALTER through every column change.

DROP TABLE IF EXISTS public.members               CASCADE;


-- ---- 6. Drop all ENUM types -----------------------------------------------
-- Spec uses string columns with CHECK constraints or option_lists FKs.

DROP TYPE IF EXISTS public.member_role                  CASCADE;
DROP TYPE IF EXISTS public.entry_type                   CASCADE;
DROP TYPE IF EXISTS public.entry_state                  CASCADE;
DROP TYPE IF EXISTS public.outreach_event_type          CASCADE;
DROP TYPE IF EXISTS public.meeting_type                 CASCADE;
DROP TYPE IF EXISTS public.sw_change_classification     CASCADE;
DROP TYPE IF EXISTS public.test_type                    CASCADE;
DROP TYPE IF EXISTS public.sample_size_justification    CASCADE;
DROP TYPE IF EXISTS public.contact_relationship_type    CASCADE;
DROP TYPE IF EXISTS public.contact_relationship_status  CASCADE;
DROP TYPE IF EXISTS public.contact_interaction_type     CASCADE;
DROP TYPE IF EXISTS public.flag_status                  CASCADE;
DROP TYPE IF EXISTS public.media_kind                   CASCADE;
DROP TYPE IF EXISTS public.media_storage                CASCADE;
DROP TYPE IF EXISTS public.permission_status            CASCADE;
DROP TYPE IF EXISTS public.classification_confidence    CASCADE;
DROP TYPE IF EXISTS public.action_item_status           CASCADE;
DROP TYPE IF EXISTS public.handoff_status               CASCADE;
DROP TYPE IF EXISTS public.confidence_rating            CASCADE;


-- ---- 7. Recreate `members` per spec (02-schema.md §4.1) -------------------
-- Mirrors auth.users with display-friendly fields. id IS auth.users.id.

CREATE TABLE public.members (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text NOT NULL UNIQUE,
  display_name  text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);

CREATE TRIGGER members_set_updated_at
BEFORE UPDATE ON public.members
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ---- 8. New auth trigger per spec (02-schema.md §4.1) ---------------------
-- Defaults display_name to the local-part of the email (everything before @).
-- SECURITY DEFINER so the trigger can write public.members from auth schema.

CREATE OR REPLACE FUNCTION public.handle_new_auth_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.members (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(split_part(NEW.email, '@', 1), ''), 'Member')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();


-- ---- 9. Backfill members for existing auth.users --------------------------
-- The App Lead's auth user pre-existed the new trigger. Backfill so the
-- dashboard query against `members(email, display_name)` returns a row.

INSERT INTO public.members (id, email, display_name)
SELECT
  id,
  email,
  COALESCE(NULLIF(split_part(email, '@', 1), ''), 'Member')
FROM auth.users
ON CONFLICT (id) DO NOTHING;


-- ---- 10. Permissive Phase 1 RLS on members --------------------------------
-- Phase 3 replaces this with strict role-based policies (CLAUDE.md
-- "Phase 3 replaces, not adds"). Phase 1 is single-user; permissive is fine.

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

CREATE POLICY members_all_authenticated ON public.members
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);


-- ---- Notes ----------------------------------------------------------------
-- - extensions and `set_updated_at()` from migration 001 are intentionally
--   preserved; they're still useful.
-- - Migrations 010 and 011 create the new `option_lists` table + seed data
--   and the Phase 1 detail tables (session_logs, outreach_logs, meeting_notes,
--   flags, classification_index, award_criteria_snapshot).
-- - The auth-batch migration files (002–008) are left in place — never
--   delete migrations (ROUTINE.md §5 hard rule). Their effects are
--   superseded by this migration and the two that follow.
