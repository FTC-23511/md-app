-- =============================================================================
-- Migration 002: Core enums and reference tables
--
-- Reference data that every entry depends on: teams, seasons, subsystems,
-- members. Plus all enum types used by detail tables.
-- =============================================================================

-- ---- Enums ------------------------------------------------------------------

CREATE TYPE public.member_role AS ENUM (
  'documentation_captain',
  'deputy_documentation_captain',
  'subsystem_documentation_lead',
  'general_member',
  'mentor'
);

CREATE TYPE public.entry_type AS ENUM (
  'session_log',
  'outreach_log',
  'meeting_notes',
  'competition_recap',
  'decision_log',
  'hardware_change_log',
  'software_change_log',
  'test_log',
  'contact_log',
  'subsystem_handoff'
);

CREATE TYPE public.entry_state AS ENUM ('draft', 'complete');

CREATE TYPE public.outreach_event_type AS ENUM (
  'private_sponsor_or_mentor_meeting',
  'public_robot_and_first_showcase',
  'presentation_or_conference',
  'classroom_or_school_assembly',
  'workshop_we_host',
  'recurring_program_fll_coaching',
  'first_community_engagement',
  'online_virtual_outreach',
  'other'
);

CREATE TYPE public.meeting_type AS ENUM (
  'kickoff', 'weekly_all_hands', 'strategy', 'retro', 'planning', 'other'
);

CREATE TYPE public.sw_change_classification AS ENUM (
  'control_theory',
  'sensor_or_sensor_fusion',
  'state_machine_or_architecture',
  'algorithm_or_library',
  'bug_fix',
  'behavior_changing_refactor',
  'refactor_only_skip',
  'other'
);

CREATE TYPE public.test_type AS ENUM ('pass_fail', 'continuous');

CREATE TYPE public.sample_size_justification AS ENUM (
  'pattern_stabilized',
  'time_constrained_retest_planned',
  'each_failure_mode_seen_twice',
  'other'
);

CREATE TYPE public.contact_relationship_type AS ENUM (
  'mentor', 'sponsor', 'university', 'alumni', 'industry', 'community', 'other'
);

CREATE TYPE public.contact_relationship_status AS ENUM (
  'prospect', 'active', 'dormant', 'declined'
);

CREATE TYPE public.contact_interaction_type AS ENUM (
  'email', 'call', 'meeting', 'site_visit', 'event_encounter', 'other'
);

CREATE TYPE public.flag_status AS ENUM (
  'open', 'filed', 'overdue', 'escalated', 'cancelled'
);

CREATE TYPE public.media_kind AS ENUM (
  'photo', 'video', 'voice_memo', 'document'
);

CREATE TYPE public.media_storage AS ENUM (
  'supabase_storage', 'google_drive', 'external_url'
);

CREATE TYPE public.permission_status AS ENUM (
  'yes', 'no', 'pending', 'anonymized'
);

CREATE TYPE public.classification_confidence AS ENUM (
  'ai_low', 'ai_medium', 'ai_high', 'human_confirmed'
);

CREATE TYPE public.action_item_status AS ENUM (
  'open', 'done', 'cancelled'
);

CREATE TYPE public.handoff_status AS ENUM (
  'working_as_designed', 'known_issues', 'in_development'
);

CREATE TYPE public.confidence_rating AS ENUM (
  'high', 'medium', 'low'
);

-- ---- Teams ------------------------------------------------------------------
-- For Phase 1 there is exactly one team row. The schema is multi-tenant-ready
-- (every other table scopes by team_id) so adding more teams later is free.

CREATE TABLE public.teams (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- Seasons ---------------------------------------------------------------

CREATE TABLE public.seasons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  game_code   TEXT,
  start_date  DATE NOT NULL,
  end_date    DATE,
  is_active   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (team_id, name)
);
-- Exactly one active season per team.
CREATE UNIQUE INDEX seasons_one_active_per_team
  ON public.seasons (team_id)
  WHERE is_active = TRUE;

-- ---- Subsystems -------------------------------------------------------------

CREATE TABLE public.subsystems (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id      UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL,
  description  TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (team_id, slug)
);

-- ---- Members ----------------------------------------------------------------
-- Linked to auth.users via auth_user_id (1:1). A row in members can exist
-- without a linked auth user (e.g. mentor we want to attribute work to but
-- who hasn't signed in yet) — auth_user_id is nullable for this reason.

CREATE TABLE public.members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  auth_user_id    UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL,
  role            public.member_role NOT NULL DEFAULT 'general_member',
  github_handle   TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (team_id, email)
);
CREATE TRIGGER members_updated_at BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Subsystem lead assignments (many-to-many across seasons).
CREATE TABLE public.subsystem_leads (
  subsystem_id  UUID NOT NULL REFERENCES public.subsystems(id) ON DELETE CASCADE,
  member_id     UUID NOT NULL REFERENCES public.members(id)    ON DELETE CASCADE,
  season_id     UUID NOT NULL REFERENCES public.seasons(id)    ON DELETE CASCADE,
  PRIMARY KEY (subsystem_id, member_id, season_id)
);
