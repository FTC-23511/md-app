-- =============================================================================
-- Migration 011: Phase 1 detail tables + flags + Phase 4 placeholders
-- (path B step 3 of 3)
--
-- Implements docs/phase1/02-schema.md §§4.4–4.6 and §§5.1–5.3. The standalone
-- detail tables for the three Phase 1 Tier-1 entry types (Session Log,
-- Outreach Log, Meeting Notes), plus the flags table (Phase 1 surface),
-- plus the classification_index and award_criteria_snapshot tables (Phase 4
-- populates; schema lands now so no migration needed when Phase 4 ships).
--
-- Depends on migration 009 (drop legacy) and 010 (option_lists) having been
-- applied — detail tables FK to option_lists for option_id columns, and
-- members FK to the new members shape (id REFERENCES auth.users(id)).
--
-- Conventions per spec §2 and per the auth-batch's already-shipped patterns:
--   - Every table has the common columns: id, created_at, updated_at,
--     deleted_at, created_by (FK to auth.users), created_via (CHECK),
--     extras (jsonb), entry_state (CHECK).
--   - Soft delete via deleted_at, not hard delete.
--   - set_updated_at trigger on every table.
--   - Permissive Phase 1 RLS (replaced in Phase 3 with role-based policies).
-- =============================================================================


-- ===========================================================================
-- §5.1 session_logs
-- ===========================================================================

CREATE TABLE public.session_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_via     text NOT NULL DEFAULT 'app'
                    CHECK (created_via IN ('app', 'fallback_form', 'import')),
  extras          jsonb NOT NULL DEFAULT '{}'::jsonb,
  entry_state     text NOT NULL DEFAULT 'complete'
                    CHECK (entry_state IN ('draft', 'complete')),

  -- entry-specific typed columns
  session_date    date NOT NULL,
  session_lead    text NOT NULL,
  duration_hours  numeric(4, 2),
  what_worked_on  text NOT NULL,
  what_worked     text,
  what_didnt_work text,
  whats_next      text
);

CREATE TRIGGER session_logs_set_updated_at
BEFORE UPDATE ON public.session_logs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX session_logs_created_at_idx
ON public.session_logs (created_at DESC)
WHERE deleted_at IS NULL;


-- ===========================================================================
-- §5.2 outreach_logs
-- ===========================================================================

CREATE TABLE public.outreach_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_via     text NOT NULL DEFAULT 'app'
                    CHECK (created_via IN ('app', 'fallback_form', 'import')),
  extras          jsonb NOT NULL DEFAULT '{}'::jsonb,
  entry_state     text NOT NULL DEFAULT 'complete'
                    CHECK (entry_state IN ('draft', 'complete')),

  event_name                text NOT NULL,
  event_date                date NOT NULL,
  event_type_option_id      uuid NOT NULL REFERENCES public.option_lists(id),
  our_role_option_id        uuid          REFERENCES public.option_lists(id),
  host_org                  text,
  location_city             text,
  location_state            text,
  outreach_reporter         text NOT NULL,
  total_attendees           integer,
  zero_first_count          integer,
  age_range                 text,
  follow_up_type_option_id  uuid          REFERENCES public.option_lists(id),
  what_worked               text,
  what_to_change            text
);

CREATE TRIGGER outreach_logs_set_updated_at
BEFORE UPDATE ON public.outreach_logs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX outreach_logs_created_at_idx
ON public.outreach_logs (created_at DESC)
WHERE deleted_at IS NULL;

CREATE INDEX outreach_logs_event_date_idx
ON public.outreach_logs (event_date DESC)
WHERE deleted_at IS NULL;


-- ===========================================================================
-- §5.3 meeting_notes
-- ===========================================================================

CREATE TABLE public.meeting_notes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_via     text NOT NULL DEFAULT 'app'
                    CHECK (created_via IN ('app', 'fallback_form', 'import')),
  extras          jsonb NOT NULL DEFAULT '{}'::jsonb,
  entry_state     text NOT NULL DEFAULT 'complete'
                    CHECK (entry_state IN ('draft', 'complete')),

  meeting_date            date NOT NULL,
  meeting_type_option_id  uuid NOT NULL REFERENCES public.option_lists(id),
  scribe_member_id        uuid          REFERENCES public.members(id) ON DELETE SET NULL,
  next_meeting_date       date
);

CREATE TRIGGER meeting_notes_set_updated_at
BEFORE UPDATE ON public.meeting_notes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX meeting_notes_created_at_idx
ON public.meeting_notes (created_at DESC)
WHERE deleted_at IS NULL;


-- ===========================================================================
-- §4.4 flags — Tier 1 → Tier 2 flagging
-- ===========================================================================

CREATE TABLE public.flags (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_entry_type   text NOT NULL,
  parent_entry_id     uuid NOT NULL,
  target_entry_type   text NOT NULL CHECK (target_entry_type IN (
                          'decision_log', 'hw_change_log', 'sw_change_log',
                          'test_log', 'contact_log'
                        )),
  owner_member_id     uuid REFERENCES public.members(id) ON DELETE SET NULL,
  subject             text NOT NULL,
  status              text NOT NULL DEFAULT 'open'
                        CHECK (status IN ('open', 'closed', 'cancelled')),
  resolved_entry_id   uuid,  -- polymorphic ref; not a real FK
  opened_at           timestamptz NOT NULL DEFAULT now(),
  closed_at           timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  deleted_at          timestamptz
);

CREATE TRIGGER flags_set_updated_at
BEFORE UPDATE ON public.flags
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX flags_parent_idx
ON public.flags (parent_entry_type, parent_entry_id)
WHERE deleted_at IS NULL;

CREATE INDEX flags_status_target_idx
ON public.flags (status, target_entry_type)
WHERE deleted_at IS NULL;


-- ===========================================================================
-- §4.5 classification_index (Phase 4 populates; schema lands now)
-- ===========================================================================

CREATE TABLE public.classification_index (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_type           text NOT NULL,
  entry_id             uuid NOT NULL,
  award_name           text NOT NULL,
  criterion            text NOT NULL,
  confidence           text NOT NULL CHECK (confidence IN ('low', 'medium', 'high')),
  rationale            text,
  classified_at        timestamptz NOT NULL DEFAULT now(),
  classifier_member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  prompt_version       text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  deleted_at           timestamptz
);

CREATE TRIGGER classification_index_set_updated_at
BEFORE UPDATE ON public.classification_index
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX classification_index_entry_idx
ON public.classification_index (entry_type, entry_id)
WHERE deleted_at IS NULL;

CREATE INDEX classification_index_award_idx
ON public.classification_index (award_name, criterion)
WHERE deleted_at IS NULL;


-- ===========================================================================
-- §4.6 award_criteria_snapshot (Phase 4 populates; schema lands now)
-- ===========================================================================

CREATE TABLE public.award_criteria_snapshot (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_year     integer NOT NULL,
  award_name      text NOT NULL,
  criterion_label text NOT NULL,
  criterion_text  text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);

CREATE TRIGGER award_criteria_snapshot_set_updated_at
BEFORE UPDATE ON public.award_criteria_snapshot
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX award_criteria_snapshot_season_idx
ON public.award_criteria_snapshot (season_year)
WHERE deleted_at IS NULL;


-- ===========================================================================
-- Phase 1 RLS — permissive across the board.
-- Phase 3 replaces these with role-based policies per CLAUDE.md.
-- ===========================================================================

ALTER TABLE public.session_logs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_notes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flags                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classification_index      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.award_criteria_snapshot   ENABLE ROW LEVEL SECURITY;

CREATE POLICY session_logs_all_authenticated ON public.session_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY outreach_logs_all_authenticated ON public.outreach_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY meeting_notes_all_authenticated ON public.meeting_notes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY flags_all_authenticated ON public.flags
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY classification_index_all_authenticated ON public.classification_index
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY award_criteria_snapshot_all_authenticated ON public.award_criteria_snapshot
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
