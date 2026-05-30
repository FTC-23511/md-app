-- =============================================================================
-- Migration 010: option_lists table + seed data (path B step 2 of 3)
--
-- Implements docs/phase1/02-schema.md §§4.2–4.3. The lookup table that
-- replaces the auth-batch's Postgres ENUM types with a user-extensible
-- (category, value, label) row set.
--
-- Depends on migration 009 (drop legacy) having been applied to the database
-- — the auth-batch's `subsystems` table is gone, so the 'subsystem' category
-- here is the canonical home for subsystem options going forward.
--
-- Categories per spec §4.2 CHECK constraint:
--   event_type, engagement_depth, follow_up_type, our_role, meeting_type,
--   subsystem, relationship_type, relationship_status, change_type
--
-- Seed data per spec §4.3 — every fixed-by-charter option goes in as
-- is_seed = true. User-added options via the "Add new..." popover land
-- with is_seed = false.
-- =============================================================================


-- ---- 1. The table ---------------------------------------------------------

CREATE TABLE public.option_lists (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category     text NOT NULL CHECK (category IN (
                  'event_type',
                  'engagement_depth',
                  'follow_up_type',
                  'our_role',
                  'meeting_type',
                  'subsystem',
                  'relationship_type',
                  'relationship_status',
                  'change_type'
                )),
  value        text NOT NULL,
  label        text NOT NULL,
  sort_order   integer NOT NULL DEFAULT 0,
  is_seed      boolean NOT NULL DEFAULT false,
  created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);

CREATE TRIGGER option_lists_set_updated_at
BEFORE UPDATE ON public.option_lists
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Partial unique index: a (category, value) pair is unique among active rows.
-- Soft-deleted rows don't conflict with new ones.
CREATE UNIQUE INDEX option_lists_category_value_active
ON public.option_lists (category, value)
WHERE deleted_at IS NULL;

-- Frequently-used lookup pattern (category + sort_order) for dropdowns.
CREATE INDEX option_lists_category_sort_idx
ON public.option_lists (category, sort_order)
WHERE deleted_at IS NULL;


-- ---- 2. Phase 1 permissive RLS --------------------------------------------
-- Phase 3 replaces with role-based policies; Phase 1 is single-user.

ALTER TABLE public.option_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY option_lists_all_authenticated ON public.option_lists
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);


-- ---- 3. Seed data ---------------------------------------------------------
-- Values are kebab-case (machine-friendly); labels are human-readable.
-- Per spec §4.3.

-- event_type — 9 options from Outreach Log SOP-02 / Template T-02
INSERT INTO public.option_lists (category, value, label, sort_order, is_seed) VALUES
  ('event_type', 'private-sponsor',          'Private sponsor or mentor meeting',    1, true),
  ('event_type', 'public-showcase',          'Public robot and FIRST showcase',      2, true),
  ('event_type', 'presentation-conference',  'Presentation or conference (invited)', 3, true),
  ('event_type', 'classroom-visit',          'Classroom visit or school assembly',   4, true),
  ('event_type', 'workshop-hosted',          'Workshop or training session we host', 5, true),
  ('event_type', 'recurring-program',        'Recurring program / FLL coaching',     6, true),
  ('event_type', 'first-community',          'FIRST community engagement',           7, true),
  ('event_type', 'online-virtual',           'Online or virtual outreach',           8, true),
  ('event_type', 'other',                    'Other',                                9, true);

-- engagement_depth — 8 options from Outreach Log SOP-02
INSERT INTO public.option_lists (category, value, label, sort_order, is_seed) VALUES
  ('engagement_depth', 'hands-on',           'Hands-on robot or team interaction',          1, true),
  ('engagement_depth', 'sustained',          'Sustained engagement (>15 min)',              2, true),
  ('engagement_depth', 'substantive-qs',     'Substantive questions',                       3, true),
  ('engagement_depth', 'network-expansion',  'Network expansion (intros, further events)',  4, true),
  ('engagement_depth', 'direct-interest',    'Direct interest in joining or supporting',    5, true),
  ('engagement_depth', 'next-step',          'Specific next-step commitment made',          6, true),
  ('engagement_depth', 'brief-walkby',       'Brief walk-by interactions',                  7, true),
  ('engagement_depth', 'distracted',         'Distracted audience or rushed format',        8, true);

-- follow_up_type — 4 options from Outreach Log SOP-02
INSERT INTO public.option_lists (category, value, label, sort_order, is_seed) VALUES
  ('follow_up_type', 'none',           'No structured follow-up planned',         1, true),
  ('follow_up_type', 'via-host',       'Group follow-up via host organization',   2, true),
  ('follow_up_type', 'individual',     'Individual follow-up via Contact Log',    3, true),
  ('follow_up_type', 're-engagement',  'Re-engagement of prior outreach',         4, true);

-- our_role — 5 options from Outreach Log Template T-02
INSERT INTO public.option_lists (category, value, label, sort_order, is_seed) VALUES
  ('our_role', 'demo',       'Demo',        1, true),
  ('our_role', 'coaching',   'Coaching',    2, true),
  ('our_role', 'workshop',   'Workshop',    3, true),
  ('our_role', 'fair-table', 'Fair table',  4, true),
  ('our_role', 'other',      'Other',       5, true);

-- meeting_type — 5 options from Meeting Notes Template T-03
INSERT INTO public.option_lists (category, value, label, sort_order, is_seed) VALUES
  ('meeting_type', 'kickoff',   'Kickoff',           1, true),
  ('meeting_type', 'weekly',    'Weekly all-hands',  2, true),
  ('meeting_type', 'strategy',  'Strategy session',  3, true),
  ('meeting_type', 'retro',     'Retrospective',     4, true),
  ('meeting_type', 'planning',  'Planning',          5, true);

-- relationship_type — 7 options from Contact Log SOP-09
INSERT INTO public.option_lists (category, value, label, sort_order, is_seed) VALUES
  ('relationship_type', 'mentor',     'Mentor',              1, true),
  ('relationship_type', 'sponsor',    'Sponsor',             2, true),
  ('relationship_type', 'university', 'University contact',  3, true),
  ('relationship_type', 'alumni',     'Alumni',              4, true),
  ('relationship_type', 'industry',   'Industry engineer',   5, true),
  ('relationship_type', 'community',  'FIRST community',     6, true),
  ('relationship_type', 'other',      'Other',               7, true);

-- relationship_status — 4 options from Contact Log SOP-09
INSERT INTO public.option_lists (category, value, label, sort_order, is_seed) VALUES
  ('relationship_status', 'prospect',  'Prospect',  1, true),
  ('relationship_status', 'active',    'Active',    2, true),
  ('relationship_status', 'dormant',   'Dormant',   3, true),
  ('relationship_status', 'declined',  'Declined',  4, true);

-- change_type — 7 options from Software Change Log SOP-07
INSERT INTO public.option_lists (category, value, label, sort_order, is_seed) VALUES
  ('change_type', 'control-theory',     'Control theory (PID, motion profile)',  1, true),
  ('change_type', 'sensor-fusion',      'Sensor or sensor fusion',               2, true),
  ('change_type', 'state-machine',      'State machine / code structure',        3, true),
  ('change_type', 'algorithm',          'Algorithm or library',                  4, true),
  ('change_type', 'bug-fix',            'Behavior bug fix',                      5, true),
  ('change_type', 'behavior-refactor',  'Behavior-changing refactor',            6, true),
  ('change_type', 'other',              'Other',                                 7, true);

-- subsystem — no seed rows; team adds their own via the "Add new..." popover.
