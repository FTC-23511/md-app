-- =============================================================================
-- Migration 014: Phase 2 Tier 2 tables + Competition Recap + media links
--
-- Implements docs/phase2/01-schema.md §§1–7. Standalone-table architecture
-- (no base `entries` table) — every entry table carries the common columns
-- directly, exactly like session_logs (migration 011).
--
-- Tables created here:
--   contacts, contact_logs, hw_change_logs, sw_change_logs, test_logs,
--   decision_logs, comp_recaps  — the Tier 2 entries + the last Tier 1 entry
--   media_links                 — polymorphic attachment table (like flags)
--
-- NOT created here (deferred per the 2A brief):
--   test_series  — compute-support rollup; created in 2C alongside auto-compute
--                  so we don't ship an unused table.
--
-- Conventions (docs/phase2/01-schema.md §0 + migration 011 patterns):
--   - Common columns: id, created_at, updated_at, deleted_at, created_by
--     (FK auth.users ON DELETE SET NULL), created_via (CHECK), extras jsonb,
--     entry_state (CHECK). defaultEntryState='draft' for decision_logs,
--     sw_change_logs, test_logs; 'complete' for the rest.
--   - set_updated_at trigger (function already exists from migration 001).
--   - created_at DESC partial index WHERE deleted_at IS NULL.
--   - Permissive Phase 1-style RLS (*_all_authenticated); Phase 3 replaces.
--   - Grants land in the FOLLOWING migration (014x), tracked separately —
--     "expose new tables" is off (known gotcha).
--   - parent_decision_id / robot_version_hw_id / parent_entry_id are INFORMAL
--     references (plain uuid, no FK constraint) mirroring flags.parent_entry_id
--     — polymorphic / cross-entry links the app resolves, not the DB.
-- =============================================================================


-- ===========================================================================
-- §1 contacts — the person, reusable across many interactions (SOP-09).
-- Contact identity/contact-info segregated for privacy: contact_info and
-- how_we_connected live in extras, never surfaced in general reads.
-- ===========================================================================

CREATE TABLE public.contacts (
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

  display_name                  text NOT NULL,
  role_org                      text,
  relationship_type_option_id   uuid REFERENCES public.option_lists(id),
  relationship_status_option_id uuid REFERENCES public.option_lists(id)
);

CREATE TRIGGER contacts_set_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX contacts_created_at_idx
ON public.contacts (created_at DESC)
WHERE deleted_at IS NULL;


-- ===========================================================================
-- §1 contact_logs — one interaction with a contact.
-- ===========================================================================

CREATE TABLE public.contact_logs (
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

  contact_id      uuid NOT NULL REFERENCES public.contacts(id),
  contact_date    date NOT NULL,
  contact_method  text
);

CREATE TRIGGER contact_logs_set_updated_at
BEFORE UPDATE ON public.contact_logs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX contact_logs_created_at_idx
ON public.contact_logs (created_at DESC)
WHERE deleted_at IS NULL;

CREATE INDEX contact_logs_contact_idx
ON public.contact_logs (contact_id)
WHERE deleted_at IS NULL;


-- ===========================================================================
-- §2 hw_change_logs — a versioned hardware change.
-- deltas (array of {metric, was, now}) and tradeoffs live in extras.
-- ===========================================================================

CREATE TABLE public.hw_change_logs (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  deleted_at          timestamptz,
  created_by          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_via         text NOT NULL DEFAULT 'app'
                        CHECK (created_via IN ('app', 'fallback_form', 'import')),
  extras              jsonb NOT NULL DEFAULT '{}'::jsonb,
  entry_state         text NOT NULL DEFAULT 'complete'
                        CHECK (entry_state IN ('draft', 'complete')),

  subsystem_option_id uuid REFERENCES public.option_lists(id),
  change_date         date NOT NULL,
  version             integer NOT NULL,
  replaces_version    integer,
  parent_decision_id  uuid   -- informal ref to decision_logs
);

CREATE TRIGGER hw_change_logs_set_updated_at
BEFORE UPDATE ON public.hw_change_logs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX hw_change_logs_created_at_idx
ON public.hw_change_logs (created_at DESC)
WHERE deleted_at IS NULL;


-- ===========================================================================
-- §3 sw_change_logs — a software change. Baseline in 2B; AI deep-dive (2G)
-- adds extras keys only, no schema change. defaultEntryState 'draft'.
-- ===========================================================================

CREATE TABLE public.sw_change_logs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  deleted_at            timestamptz,
  created_by            uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_via           text NOT NULL DEFAULT 'app'
                          CHECK (created_via IN ('app', 'fallback_form', 'import')),
  extras                jsonb NOT NULL DEFAULT '{}'::jsonb,
  entry_state           text NOT NULL DEFAULT 'draft'
                          CHECK (entry_state IN ('draft', 'complete')),

  change_type_option_id uuid REFERENCES public.option_lists(id),
  change_date           date NOT NULL,
  commit_hash           text,
  branch                text,
  parent_decision_id    uuid   -- informal ref to decision_logs
);

CREATE TRIGGER sw_change_logs_set_updated_at
BEFORE UPDATE ON public.sw_change_logs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX sw_change_logs_created_at_idx
ON public.sw_change_logs (created_at DESC)
WHERE deleted_at IS NULL;


-- ===========================================================================
-- §4 test_logs — flexible test data + auto-compute (full design 03-test-log).
-- raw_rows / custom_columns / computed all live in extras. defaultEntryState
-- 'draft'. test_series rollup is created in 2C, not here.
-- ===========================================================================

CREATE TABLE public.test_logs (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  deleted_at          timestamptz,
  created_by          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_via         text NOT NULL DEFAULT 'app'
                        CHECK (created_via IN ('app', 'fallback_form', 'import')),
  extras              jsonb NOT NULL DEFAULT '{}'::jsonb,
  entry_state         text NOT NULL DEFAULT 'draft'
                        CHECK (entry_state IN ('draft', 'complete')),

  test_label          text NOT NULL,   -- time-series key; identical across re-runs
  test_date           date NOT NULL,
  test_type           text NOT NULL
                        CHECK (test_type IN ('pass_fail', 'single_measure', 'custom')),
  robot_version_hw_id uuid   -- informal ref to hw_change_logs
);

CREATE TRIGGER test_logs_set_updated_at
BEFORE UPDATE ON public.test_logs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX test_logs_created_at_idx
ON public.test_logs (created_at DESC)
WHERE deleted_at IS NULL;

CREATE INDEX test_logs_label_idx
ON public.test_logs (test_label, test_date DESC)
WHERE deleted_at IS NULL;


-- ===========================================================================
-- §5 decision_logs — reasoning record. alternatives + depth objects (matrix,
-- fmea, first_principles, sensitivity) + outcome-later all live in extras.
-- defaultEntryState 'draft'.
-- ===========================================================================

CREATE TABLE public.decision_logs (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  deleted_at          timestamptz,
  created_by          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_via         text NOT NULL DEFAULT 'app'
                        CHECK (created_via IN ('app', 'fallback_form', 'import')),
  extras              jsonb NOT NULL DEFAULT '{}'::jsonb,
  entry_state         text NOT NULL DEFAULT 'draft'
                        CHECK (entry_state IN ('draft', 'complete')),

  subsystem_option_id uuid REFERENCES public.option_lists(id),
  decision_date       date NOT NULL,
  parent_entry_type   text,
  parent_entry_id     uuid   -- informal polymorphic ref
);

CREATE TRIGGER decision_logs_set_updated_at
BEFORE UPDATE ON public.decision_logs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX decision_logs_created_at_idx
ON public.decision_logs (created_at DESC)
WHERE deleted_at IS NULL;


-- ===========================================================================
-- §6 comp_recaps — heaviest entry; mostly extras (judging, root_cause 5-whys,
-- notable_matches, strategic_insights, self-audit, …). Last Tier 1 entry.
-- ===========================================================================

CREATE TABLE public.comp_recaps (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  deleted_at          timestamptz,
  created_by          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_via         text NOT NULL DEFAULT 'app'
                        CHECK (created_via IN ('app', 'fallback_form', 'import')),
  extras              jsonb NOT NULL DEFAULT '{}'::jsonb,
  entry_state         text NOT NULL DEFAULT 'complete'
                        CHECK (entry_state IN ('draft', 'complete')),

  competition_name    text NOT NULL,
  comp_start_date     date NOT NULL,
  comp_end_date       date,
  outcome             text,
  auto_reliability_pct numeric
);

CREATE TRIGGER comp_recaps_set_updated_at
BEFORE UPDATE ON public.comp_recaps
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX comp_recaps_created_at_idx
ON public.comp_recaps (created_at DESC)
WHERE deleted_at IS NULL;


-- ===========================================================================
-- §7 media_links — polymorphic attachment table (like flags). One row per
-- attached photo/video link. Nothing writes here until 2F; created now so the
-- detail page can read it. Reduced common-column set matching flags
-- (created_at/updated_at/deleted_at + created_by) — not an entry table.
-- ===========================================================================

CREATE TABLE public.media_links (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz,
  created_by        uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  entry_type        text NOT NULL,
  entry_id          uuid NOT NULL,   -- polymorphic; not a real FK (matches flags)
  url               text NOT NULL,
  provider          text NOT NULL
                      CHECK (provider IN ('google_drive', 'youtube', 'vimeo', 'direct', 'other')),
  source_provider   text,   -- where it came from before ingest (discord/upload/…)
  drive_file_id     text,
  ingest_status     text NOT NULL DEFAULT 'not_needed'
                      CHECK (ingest_status IN ('not_needed', 'pending', 'done', 'failed')),
  media_type        text CHECK (media_type IN ('image', 'video', 'unknown')),
  caption           text,
  permission_status text NOT NULL DEFAULT 'pending'
                      CHECK (permission_status IN ('yes', 'no', 'pending', 'n_a')),
  thumbnail_url     text,
  role              text,   -- e.g. hw: prev_version/new_version/in_context/hero
  last_checked_ok   boolean,
  last_checked_at   timestamptz
);

CREATE TRIGGER media_links_set_updated_at
BEFORE UPDATE ON public.media_links
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX media_links_entry_idx
ON public.media_links (entry_type, entry_id)
WHERE deleted_at IS NULL;

CREATE INDEX media_links_health_idx
ON public.media_links (last_checked_ok)
WHERE deleted_at IS NULL;


-- ===========================================================================
-- Phase 1-style permissive RLS across the board. Phase 3 replaces with
-- role-based policies per CLAUDE.md.
-- ===========================================================================

ALTER TABLE public.contacts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hw_change_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sw_change_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comp_recaps     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_links     ENABLE ROW LEVEL SECURITY;

CREATE POLICY contacts_all_authenticated ON public.contacts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY contact_logs_all_authenticated ON public.contact_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY hw_change_logs_all_authenticated ON public.hw_change_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY sw_change_logs_all_authenticated ON public.sw_change_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY test_logs_all_authenticated ON public.test_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY decision_logs_all_authenticated ON public.decision_logs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY comp_recaps_all_authenticated ON public.comp_recaps
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY media_links_all_authenticated ON public.media_links
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
