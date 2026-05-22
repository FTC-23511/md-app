-- =============================================================================
-- Migration 004: Detail tables for each of the 10 entry types
--
-- Each detail table is 1:1 with an entries row via entry_id as PK + FK with
-- cascade delete. Field names mirror the charter templates (T-01 through T-10)
-- as closely as practical.
-- =============================================================================

-- ---- SESSION LOG (T-01) ----------------------------------------------------

CREATE TABLE public.session_logs (
  entry_id              UUID PRIMARY KEY REFERENCES public.entries(id) ON DELETE CASCADE,
  duration_hours        NUMERIC(4,2) NOT NULL CHECK (duration_hours >= 0),
  what_did_we_work_on   TEXT,
  what_worked           TEXT,
  what_did_not_work     TEXT,
  numbers_measured      TEXT,
  next_session          TEXT,
  voice_memo_url        TEXT
);


-- ---- OUTREACH LOG (T-02) ---------------------------------------------------

CREATE TABLE public.outreach_logs (
  entry_id                          UUID PRIMARY KEY REFERENCES public.entries(id) ON DELETE CASCADE,
  event_type                        public.outreach_event_type NOT NULL,
  event_type_other_detail           TEXT,
  host_organization                 TEXT,
  our_role                          TEXT,
  city                              TEXT NOT NULL,
  state_or_region                   TEXT,
  country                           TEXT NOT NULL DEFAULT 'USA',
  total_attendees                   INTEGER NOT NULL CHECK (total_attendees >= 0),
  zero_prior_first_count            INTEGER NOT NULL CHECK (zero_prior_first_count >= 0),
  age_range                         TEXT,
  -- Engagement depth — multi-select, one boolean per option.
  engagement_hands_on               BOOLEAN NOT NULL DEFAULT FALSE,
  engagement_sustained              BOOLEAN NOT NULL DEFAULT FALSE,
  engagement_substantive_questions  BOOLEAN NOT NULL DEFAULT FALSE,
  engagement_network_expansion      BOOLEAN NOT NULL DEFAULT FALSE,
  engagement_direct_interest        BOOLEAN NOT NULL DEFAULT FALSE,
  engagement_specific_next_step     BOOLEAN NOT NULL DEFAULT FALSE,
  engagement_brief_walk_by          BOOLEAN NOT NULL DEFAULT FALSE,
  engagement_distracted_audience    BOOLEAN NOT NULL DEFAULT FALSE,
  engagement_custom_note            TEXT,
  -- Conversion outcomes (free-text since may include names).
  new_fll_inspired                  TEXT,
  new_ftc_inspired                  TEXT,
  new_mentors_volunteers            TEXT,
  first_community_re_engaged        TEXT,
  what_worked                       TEXT,
  what_to_change                    TEXT,
  -- Follow-up plan
  followup_kind                     TEXT, -- 'none' | 'group_via_host' | 'individual_via_contact_log' | 're_engagement'
  followup_individual_names         TEXT,
  followup_re_engagement_entry_id   UUID REFERENCES public.entries(id)
);

CREATE TABLE public.outreach_stories (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outreach_log_entry_id    UUID NOT NULL REFERENCES public.outreach_logs(entry_id) ON DELETE CASCADE,
  person_name              TEXT,
  person_role              TEXT,
  person_age_range         TEXT,
  what_happened            TEXT NOT NULL,
  direct_quote             TEXT,
  permission_status        public.permission_status NOT NULL DEFAULT 'pending',
  photo_url                TEXT,
  is_polished              BOOLEAN NOT NULL DEFAULT FALSE,
  polished_text            TEXT,
  display_order            INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX outreach_stories_log_idx ON public.outreach_stories (outreach_log_entry_id, display_order);


-- ---- MEETING NOTES (T-03) --------------------------------------------------

CREATE TABLE public.meeting_notes (
  entry_id              UUID PRIMARY KEY REFERENCES public.entries(id) ON DELETE CASCADE,
  meeting_type          public.meeting_type NOT NULL,
  agenda_and_outcomes   TEXT NOT NULL,
  open_questions        TEXT,
  next_meeting_date     DATE
);


-- ---- COMPETITION RECAP (T-04) ---------------------------------------------

CREATE TABLE public.competition_recaps (
  entry_id                         UUID PRIMARY KEY REFERENCES public.entries(id) ON DELETE CASCADE,
  competition_name                 TEXT NOT NULL,
  comp_start_date                  DATE NOT NULL,
  comp_end_date                    DATE NOT NULL,
  outcome                          TEXT,
  facilitator_id                   UUID REFERENCES public.members(id),
  -- Judging
  formal_interview_rating          TEXT,
  formal_interview_strengths       TEXT,
  formal_interview_weaknesses      TEXT,
  formal_interview_feedback        TEXT,
  evidence_gaps                    TEXT,
  -- Robot performance
  match_results_summary            TEXT,
  autonomous_reliability_pct       NUMERIC(5,2),
  top_scoring_strategy             TEXT,
  most_failure_prone_subsystem_id  UUID REFERENCES public.subsystems(id),
  -- Strategic
  alliance_partner_feedback        TEXT,
  notable_opponent_strategies      TEXT,
  -- What worked / next-event changes
  what_worked                      TEXT,
  changes_before_next_event        TEXT,
  -- Documentation self-audit
  documentation_self_audit         TEXT
);

CREATE TABLE public.competition_pit_panels (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_recap_entry_id   UUID NOT NULL REFERENCES public.competition_recaps(entry_id) ON DELETE CASCADE,
  panel_order                  INTEGER NOT NULL,
  num_judges                   INTEGER,
  lanyard_color                TEXT,
  likely_award_areas           TEXT,
  how_it_went                  TEXT
);

CREATE TABLE public.competition_failure_analyses (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_recap_entry_id   UUID NOT NULL REFERENCES public.competition_recaps(entry_id) ON DELETE CASCADE,
  failure_order                INTEGER NOT NULL CHECK (failure_order BETWEEN 1 AND 3),
  failure_description          TEXT NOT NULL,
  matches_affected             TEXT,
  why_1                        TEXT,
  why_2                        TEXT,
  why_3                        TEXT,
  why_4                        TEXT,
  why_5                        TEXT,
  actionable_root_cause        TEXT,
  owner_id                     UUID REFERENCES public.members(id),
  next_action                  TEXT
);

CREATE TABLE public.competition_notable_matches (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_recap_entry_id   UUID NOT NULL REFERENCES public.competition_recaps(entry_id) ON DELETE CASCADE,
  match_identifier             TEXT NOT NULL,
  partner_team_numbers         TEXT,
  opposing_team_numbers        TEXT,
  why_notable                  TEXT,
  auto_outcome                 TEXT,
  teleop_key_sequences         TEXT,
  endgame_outcome              TEXT,
  key_takeaway                 TEXT
);

CREATE TABLE public.competition_strategic_insights (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_recap_entry_id   UUID NOT NULL REFERENCES public.competition_recaps(entry_id) ON DELETE CASCADE,
  insight                      TEXT NOT NULL,
  triggers_decision_log        BOOLEAN NOT NULL DEFAULT FALSE,
  owner_id                     UUID REFERENCES public.members(id)
);


-- ---- DECISION LOG (T-05) --------------------------------------------------

CREATE TABLE public.decision_logs (
  entry_id                        UUID PRIMARY KEY REFERENCES public.entries(id) ON DELETE CASCADE,
  problem_statement               TEXT NOT NULL,
  constraints                     TEXT,
  paths_not_taken                 TEXT NOT NULL,
  decision_summary                TEXT NOT NULL,
  rationale                       TEXT NOT NULL,
  predicted_outcome               TEXT NOT NULL,
  -- Filled in later (outcome-tracking).
  actual_outcome                  TEXT,
  outcome_delta                   TEXT,
  what_we_learned                 TEXT,
  outcome_recorded_at             TIMESTAMPTZ,
  -- Trigger flags (objective; Captain spot-checks at Friday 15).
  requires_tradeoff_matrix        BOOLEAN NOT NULL DEFAULT FALSE,
  requires_first_principles_math  BOOLEAN NOT NULL DEFAULT FALSE,
  requires_sensitivity_analysis   BOOLEAN NOT NULL DEFAULT FALSE,
  requires_fmea                   BOOLEAN NOT NULL DEFAULT FALSE,
  -- Depth-field content.
  tradeoff_matrix_data            JSONB,
  first_principles_math           TEXT,
  first_principles_attachment_urls TEXT[],
  sensitivity_analysis_text       TEXT,
  fmea_data                       JSONB
);

CREATE TABLE public.decision_alternatives (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_log_entry_id    UUID NOT NULL REFERENCES public.decision_logs(entry_id) ON DELETE CASCADE,
  alternative_order        INTEGER NOT NULL,   -- 1 = A, 2 = B, ...
  description              TEXT NOT NULL,
  pros                     TEXT,
  cons                     TEXT,
  predicted_performance    TEXT,
  was_chosen               BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (decision_log_entry_id, alternative_order)
);
-- Exactly one alternative may be chosen per Decision Log.
CREATE UNIQUE INDEX decision_alternatives_one_chosen
  ON public.decision_alternatives (decision_log_entry_id)
  WHERE was_chosen = TRUE;


-- ---- HARDWARE CHANGE LOG (T-06) -------------------------------------------

CREATE TABLE public.hardware_change_logs (
  entry_id                         UUID PRIMARY KEY REFERENCES public.entries(id) ON DELETE CASCADE,
  version_number                   TEXT NOT NULL,
  previous_version_number          TEXT,
  parent_decision_log_entry_id     UUID REFERENCES public.entries(id),
  what_changed                     TEXT NOT NULL,
  why_changed                      TEXT NOT NULL,
  trade_offs_introduced            TEXT,
  hero_photo_url                   TEXT
);

CREATE TABLE public.hardware_change_deltas (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hardware_change_log_entry_id  UUID NOT NULL REFERENCES public.hardware_change_logs(entry_id) ON DELETE CASCADE,
  metric_name                   TEXT NOT NULL,
  was_value                     TEXT NOT NULL,
  now_value                     TEXT NOT NULL
);


-- ---- SOFTWARE CHANGE LOG (T-07) -------------------------------------------

CREATE TABLE public.software_change_logs (
  entry_id                          UUID PRIMARY KEY REFERENCES public.entries(id) ON DELETE CASCADE,
  commit_hash                       TEXT NOT NULL,
  commit_branch                     TEXT NOT NULL,
  commit_timestamp                  TIMESTAMPTZ,
  files_changed                     TEXT[],
  parent_decision_log_entry_id      UUID REFERENCES public.entries(id),
  classification                    public.sw_change_classification NOT NULL,
  classification_other_detail       TEXT,
  -- Always-required baseline fields (per SOP-07).
  what_changed                      TEXT NOT NULL,
  why_changed                       TEXT NOT NULL,
  hardware_sensors_involved         TEXT,
  game_challenge_addressed          TEXT,
  before_behavior                   TEXT NOT NULL,
  after_behavior                    TEXT NOT NULL,
  known_failure_modes               TEXT,
  -- Verification (one of these two paths must be filled — enforced by app).
  unit_test_reference               TEXT,
  no_unit_test_reasoning            TEXT,
  integration_test_approach         TEXT,
  -- AI-prompted deep dive (populated by the integration in MD_SCL_AI_Integration.md).
  ai_deep_dive_payload              JSONB,
  ai_prompt_version                 TEXT,
  ai_transcript_url                 TEXT
);
CREATE UNIQUE INDEX software_change_logs_commit_unique
  ON public.software_change_logs (commit_hash);


-- ---- TEST LOG (T-08) -------------------------------------------------------
-- test_series is the cross-run grouping; Test Logs reference a series_id
-- rather than typing a string label each time. This is what makes the
-- time-series rollups reliable (see MD App Charter discussion).

CREATE TABLE public.test_series (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id       UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  label         TEXT NOT NULL,
  description   TEXT,
  metric_type   public.test_type NOT NULL,
  metric_unit   TEXT,
  subsystem_id  UUID REFERENCES public.subsystems(id),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (team_id, label)
);
CREATE INDEX test_series_team_active_idx ON public.test_series (team_id, is_active);

CREATE TABLE public.test_logs (
  entry_id                              UUID PRIMARY KEY REFERENCES public.entries(id) ON DELETE CASCADE,
  test_series_id                        UUID NOT NULL REFERENCES public.test_series(id),
  hypothesis                            TEXT NOT NULL,
  hardware_version_entry_id             UUID REFERENCES public.entries(id),
  field_setup                           TEXT,
  method                                TEXT NOT NULL,
  -- Raw data is an array of trial objects:
  --   pass/fail trials: [{ "result": "success"|"fail", "note"?: "..." }, ...]
  --   continuous trials: [{ "value": 1.23, "note"?: "..." }, ...]
  -- The auto-compute trigger reads from this column on insert/update.
  raw_data                              JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Auto-computed columns (populated by trigger in migration 005).
  n_trials                              INTEGER,
  pass_count                            INTEGER,
  pass_rate                             NUMERIC(6,4),
  ci_lower                              NUMERIC(6,4),
  ci_upper                              NUMERIC(6,4),
  mean_value                            NUMERIC,
  stddev_value                          NUMERIC,
  min_value                             NUMERIC,
  max_value                             NUMERIC,
  last_run_entry_id                     UUID REFERENCES public.entries(id),
  -- Depth fields (required, per SOP-08).
  sample_size_justification             public.sample_size_justification NOT NULL,
  sample_size_justification_other       TEXT,
  controlled_variables                  TEXT NOT NULL,
  what_failed                           TEXT,
  repeatability_check                   TEXT,
  comparison_interpretation             TEXT,
  interpretation                        TEXT NOT NULL,
  action_taken_entry_id                 UUID REFERENCES public.entries(id)
);
CREATE INDEX test_logs_series_idx ON public.test_logs (test_series_id);


-- ---- CONTACT LOG (T-09) ---------------------------------------------------

-- Contacts directory (people we have substantive contact with). Stored
-- separately from contact_logs because one person can appear in many logs
-- and we want a single source of truth for their org/role/status.

CREATE TABLE public.contacts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id             UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  role                TEXT,
  organization        TEXT,
  relationship_type   public.contact_relationship_type NOT NULL,
  current_status      public.contact_relationship_status NOT NULL DEFAULT 'prospect',
  -- Contact info kept in a separate column with restricted RLS — see
  -- migration 006 for the policy. Encrypt at the app layer for sensitive
  -- entries if desired (Phase 2+).
  contact_email       TEXT,
  contact_phone       TEXT,
  notes               TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX contacts_team_active_idx ON public.contacts (team_id, is_active);
CREATE TRIGGER contacts_updated_at BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.contact_logs (
  entry_id                UUID PRIMARY KEY REFERENCES public.entries(id) ON DELETE CASCADE,
  contact_id              UUID NOT NULL REFERENCES public.contacts(id),
  interaction_type        public.contact_interaction_type NOT NULL,
  how_we_connected        TEXT,
  is_first_contact        BOOLEAN NOT NULL DEFAULT FALSE,
  topic_discussed         TEXT NOT NULL,
  outcomes_commitments    TEXT NOT NULL,
  follow_up_date          DATE,
  next_action             TEXT
);
CREATE INDEX contact_logs_contact_idx ON public.contact_logs (contact_id);


-- ---- SUBSYSTEM HANDOFF (T-10) ---------------------------------------------

CREATE TABLE public.subsystem_handoffs (
  entry_id                              UUID PRIMARY KEY REFERENCES public.entries(id) ON DELETE CASCADE,
  outgoing_lead_id                      UUID NOT NULL REFERENCES public.members(id),
  incoming_lead_id                      UUID NOT NULL REFERENCES public.members(id),
  status_at_handoff                     public.handoff_status NOT NULL,
  prior_handoff_entry_id                UUID REFERENCES public.entries(id),
  changes_since_prior                   TEXT,
  system_overview                       TEXT NOT NULL,
  integration_with_robot                TEXT,
  current_version                       TEXT,
  -- Tiered key knowledge (Must / Should / Worth-knowing).
  must_know                             TEXT NOT NULL,
  should_know                           TEXT,
  worth_knowing_design_rationale        TEXT,
  worth_knowing_failure_modes           TEXT,
  worth_knowing_things_tried            TEXT,
  worth_knowing_things_not_tried        TEXT,
  -- Operational notes
  assembly_disassembly                  TEXT,
  tuning_procedure                      TEXT,
  tools_required                        TEXT,
  spare_parts_location                  TEXT,
  external_vendors                      TEXT,
  -- 4-step transition process record
  step1_walkthrough_completed_at        TIMESTAMPTZ,
  step1_mentor_witness                  TEXT,
  step1_clarifications                  TEXT,
  step2_review_completed_at             TIMESTAMPTZ,
  step2_questions_and_answers           TEXT,
  step3_demo_completed_at               TIMESTAMPTZ,
  step3_operation_performed             TEXT,
  step3_observed_outcome                TEXT,
  step4_cosign_completed_at             TIMESTAMPTZ,
  step4_mentor_witness                  TEXT,
  -- Incoming-lead acceptance block
  acceptance_date                       DATE,
  confidence_rating                     public.confidence_rating,
  confidence_blockers                   TEXT,
  first_month_focus_1                   TEXT,
  first_month_focus_2                   TEXT,
  first_month_focus_3                   TEXT
);
