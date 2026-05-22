-- =============================================================================
-- Migration 003: Base entries table + cross-cutting tables
--
-- The entries table is the hybrid base used by every entry type. Each of the
-- 10 entry types has a 1:1 detail table that references entries.id. This gives
-- us:
--   - Single-table queries for cross-cutting reads (flag queue, recent activity,
--     per-author rollups, classification index).
--   - Per-type detail rows where the type-specific columns live with their
--     own constraints.
--
-- Why not a single JSONB-per-type table? Because (a) we lose constraint
-- enforcement on type-specific fields, and (b) the user has to be able to
-- read and verify the schema — explicit columns per type are much easier to
-- review than JSONB schemas hidden in TypeScript zod definitions.
-- =============================================================================

CREATE TABLE public.entries (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id              UUID NOT NULL REFERENCES public.teams(id)     ON DELETE CASCADE,
  type                 public.entry_type NOT NULL,
  author_id            UUID NOT NULL REFERENCES public.members(id)   ON DELETE RESTRICT,
  subsystem_id         UUID REFERENCES public.subsystems(id)         ON DELETE SET NULL,
  season_id            UUID NOT NULL REFERENCES public.seasons(id)   ON DELETE RESTRICT,
  -- Short human-readable label for list views (e.g. "Tuesday build — intake v3").
  title                TEXT NOT NULL,
  -- When the event actually happened. May be in the past if filed retroactively
  -- within the 24h window; the 24h rule is enforced by the app, not the DB.
  event_date           DATE NOT NULL DEFAULT CURRENT_DATE,
  -- Draft vs Complete (only the depth-having types use 'draft'; everything else
  -- stays at the default 'complete'.)
  state                public.entry_state NOT NULL DEFAULT 'complete',
  -- If true, this entry is visible on the unauthenticated /showcase page.
  -- Default false — opt-in per entry, controlled by Documentation Captain.
  is_public_showcase   BOOLEAN NOT NULL DEFAULT FALSE,
  -- JSONB overlay for game-year-specific fields added each season without
  -- altering the schema (see MD Charter §11, "game-year overlay").
  overlay              JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Free-text reason for any edit made after the 24h author-edit window.
  -- Required by Captain/Deputy when editing an entry >24h old. Enforced at
  -- the app/server-action layer, not the DB, so the user can read the
  -- enforcement logic in TypeScript instead of plpgsql.
  last_edit_reason     TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX entries_team_event_date_idx ON public.entries (team_id, event_date DESC);
CREATE INDEX entries_team_type_event_date_idx ON public.entries (team_id, type, event_date DESC);
CREATE INDEX entries_team_subsystem_idx ON public.entries (team_id, subsystem_id);
CREATE INDEX entries_author_idx ON public.entries (author_id);
CREATE INDEX entries_team_season_idx ON public.entries (team_id, season_id);
-- Partial index over drafts only — used by Friday 15 stuck-in-draft review.
CREATE INDEX entries_drafts_idx ON public.entries (team_id, created_at)
  WHERE state = 'draft';
-- Partial index over showcase entries — used by the public /showcase route.
CREATE INDEX entries_showcase_idx ON public.entries (team_id, event_date DESC)
  WHERE is_public_showcase = TRUE;

CREATE TRIGGER entries_updated_at BEFORE UPDATE ON public.entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ---- Entry revisions (audit trail) -----------------------------------------
-- Every UPDATE on an entry snapshots the prior content here. Read-only after
-- insert. Captain dashboard shows recent revisions for spot-checking.

CREATE TABLE public.entry_revisions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id     UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  edited_by    UUID NOT NULL REFERENCES public.members(id),
  edited_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edit_reason  TEXT,
  -- JSONB snapshot of the prior entries row. (Detail-table revisions can be
  -- added later if we discover we need them; for now changing an entry's
  -- detail row also touches entries.updated_at via app code, so the entries
  -- snapshot captures the edit event.)
  snapshot     JSONB NOT NULL
);
CREATE INDEX entry_revisions_entry_id_idx ON public.entry_revisions (entry_id, edited_at DESC);


-- ---- Entry attendees -------------------------------------------------------
-- For sessions, meetings, comp recaps, outreach: which members were present
-- and what each one contributed. (One line per person per MD Section 16.)

CREATE TABLE public.entry_attendees (
  entry_id      UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  member_id     UUID NOT NULL REFERENCES public.members(id) ON DELETE RESTRICT,
  contribution  TEXT,
  PRIMARY KEY (entry_id, member_id)
);


-- ---- Media attachments -----------------------------------------------------
-- Photos/videos/voice memos/documents attached to any entry. Storage choice
-- per attachment (Drive URL for full-res photos, Supabase Storage for
-- thumbnails, external URLs for misc).

CREATE TABLE public.media_attachments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id          UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  kind              public.media_kind NOT NULL,
  storage           public.media_storage NOT NULL,
  url               TEXT NOT NULL,
  caption           TEXT,
  uploaded_by       UUID NOT NULL REFERENCES public.members(id),
  is_hero_quality   BOOLEAN NOT NULL DEFAULT FALSE,
  permission_notes  TEXT,
  display_order     INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX media_attachments_entry_idx
  ON public.media_attachments (entry_id, display_order);


-- ---- Flags (Tier-1 → Tier-2 to-do queue) -----------------------------------
-- Per MD Charter §11, every Tier 1 entry's "Specialty entries triggered"
-- block creates rows here. The Captain dashboard pivots on this table.

CREATE TABLE public.flags (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id                  UUID NOT NULL REFERENCES public.teams(id)    ON DELETE CASCADE,
  source_entry_id          UUID NOT NULL REFERENCES public.entries(id)  ON DELETE CASCADE,
  target_entry_type        public.entry_type NOT NULL,
  target_owner_id          UUID NOT NULL REFERENCES public.members(id),
  subject                  TEXT NOT NULL,
  due_at                   TIMESTAMPTZ NOT NULL,
  status                   public.flag_status NOT NULL DEFAULT 'open',
  resolved_by_entry_id     UUID REFERENCES public.entries(id),
  resolved_at              TIMESTAMPTZ,
  notes                    TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX flags_owner_status_idx     ON public.flags (target_owner_id, status, due_at);
CREATE INDEX flags_team_status_idx      ON public.flags (team_id, status, due_at);
CREATE INDEX flags_overdue_idx          ON public.flags (team_id, due_at)
  WHERE status IN ('open', 'overdue');

CREATE TRIGGER flags_updated_at BEFORE UPDATE ON public.flags
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ---- Action items (used by Meeting Notes, others) --------------------------
-- Separate from flags because action items aren't Tier 1 → Tier 2 — they're
-- generic to-dos that come out of meetings.

CREATE TABLE public.action_items (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id             UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  owner_member_id      UUID REFERENCES public.members(id),
  -- Allow free-text owner name for action items assigned to someone not yet
  -- in the members table (e.g. a mentor we haven't onboarded).
  owner_name_freeform  TEXT,
  action_text          TEXT NOT NULL,
  due_date             DATE,
  status               public.action_item_status NOT NULL DEFAULT 'open',
  completed_at         TIMESTAMPTZ,
  CONSTRAINT action_items_has_owner
    CHECK (owner_member_id IS NOT NULL OR owner_name_freeform IS NOT NULL)
);
CREATE INDEX action_items_entry_idx       ON public.action_items (entry_id);
CREATE INDEX action_items_owner_open_idx  ON public.action_items (owner_member_id, status)
  WHERE status = 'open';


-- ---- Awards and classification (Appendix A weekly classification pass) -----

CREATE TABLE public.awards (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id        UUID NOT NULL REFERENCES public.teams(id),
  season_id      UUID NOT NULL REFERENCES public.seasons(id),
  name           TEXT NOT NULL,
  display_order  INTEGER NOT NULL DEFAULT 0,
  UNIQUE (team_id, season_id, name)
);

CREATE TABLE public.award_criteria (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  award_id        UUID NOT NULL REFERENCES public.awards(id) ON DELETE CASCADE,
  criterion_text  TEXT NOT NULL,
  display_order   INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX award_criteria_award_idx ON public.award_criteria (award_id, display_order);

CREATE TABLE public.classification_tags (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id              UUID NOT NULL REFERENCES public.entries(id)         ON DELETE CASCADE,
  award_criterion_id    UUID NOT NULL REFERENCES public.award_criteria(id)  ON DELETE CASCADE,
  confidence            public.classification_confidence NOT NULL DEFAULT 'ai_medium',
  rationale             TEXT,
  tagged_by             UUID NOT NULL REFERENCES public.members(id),
  ai_prompt_version     TEXT,
  ai_model              TEXT,
  tagged_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entry_id, award_criterion_id)
);
CREATE INDEX classification_tags_entry_idx     ON public.classification_tags (entry_id);
CREATE INDEX classification_tags_criterion_idx ON public.classification_tags (award_criterion_id);
