-- =============================================================================
-- Migration 006: Row-Level Security policies
--
-- Access model (from MD App Charter §6):
--   - Documentation Captain                  : full read/write
--   - Deputy Documentation Captain           : full read/write except member roles
--   - Subsystem Documentation Lead           : full read; write within subsystem
--   - General team member                    : full read; write own (insert + 24h edit)
--   - Mentor                                 : full read; no write
--
-- Plus the public showcase: anyone (unauthenticated) can read entries with
-- is_public_showcase = TRUE, but nothing else.
--
-- The 24h author-edit window is enforced via the
-- "(author_id = me AND created_at > NOW() - 24h)" predicate. Captain/Deputy
-- bypass this. edit_reason for >24h edits is enforced at the server-action
-- layer (not here) because the UI flow needs to ask for it interactively.
-- =============================================================================

-- ---- helper: is captain or deputy ------------------------------------------
CREATE OR REPLACE FUNCTION public.current_is_captain_or_deputy()
RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
  SELECT public.current_member_role() IN
         ('documentation_captain', 'deputy_documentation_captain')
$$;

CREATE OR REPLACE FUNCTION public.current_is_captain()
RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
  SELECT public.current_member_role() = 'documentation_captain'
$$;

CREATE OR REPLACE FUNCTION public.current_can_write()
RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
  SELECT public.current_member_role() IN
         ('documentation_captain',
          'deputy_documentation_captain',
          'subsystem_documentation_lead',
          'general_member')
$$;

-- ============================================================================
-- TEAMS
-- ============================================================================
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY teams_select_member ON public.teams FOR SELECT
  USING (id = public.current_team_id());

-- Only captain can change team metadata.
CREATE POLICY teams_update_captain ON public.teams FOR UPDATE
  USING (id = public.current_team_id() AND public.current_is_captain())
  WITH CHECK (id = public.current_team_id());

-- ============================================================================
-- SEASONS
-- ============================================================================
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY seasons_select_team ON public.seasons FOR SELECT
  USING (team_id = public.current_team_id());

CREATE POLICY seasons_write_captain ON public.seasons FOR ALL
  USING (team_id = public.current_team_id() AND public.current_is_captain_or_deputy())
  WITH CHECK (team_id = public.current_team_id());

-- ============================================================================
-- SUBSYSTEMS
-- ============================================================================
ALTER TABLE public.subsystems ENABLE ROW LEVEL SECURITY;

CREATE POLICY subsystems_select_team ON public.subsystems FOR SELECT
  USING (team_id = public.current_team_id());

CREATE POLICY subsystems_write_captain ON public.subsystems FOR ALL
  USING (team_id = public.current_team_id() AND public.current_is_captain_or_deputy())
  WITH CHECK (team_id = public.current_team_id());

-- ============================================================================
-- MEMBERS
-- ============================================================================
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Everyone in the team can see who's on it.
CREATE POLICY members_select_team ON public.members FOR SELECT
  USING (team_id = public.current_team_id());

-- Only Captain can change member rows (role assignment is captain-only;
-- Deputy intentionally excluded per charter §6).
CREATE POLICY members_write_captain ON public.members FOR ALL
  USING (team_id = public.current_team_id() AND public.current_is_captain())
  WITH CHECK (team_id = public.current_team_id());

-- Members can update their OWN profile (name, github_handle), but not role.
-- (Enforced at app layer — RLS allows the update, server action validates
-- which columns are being changed.)
CREATE POLICY members_update_self ON public.members FOR UPDATE
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid() AND team_id = public.current_team_id());

-- ============================================================================
-- SUBSYSTEM_LEADS
-- ============================================================================
ALTER TABLE public.subsystem_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY subsystem_leads_select_team ON public.subsystem_leads FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.subsystems s
            WHERE s.id = subsystem_id AND s.team_id = public.current_team_id())
  );

CREATE POLICY subsystem_leads_write_captain ON public.subsystem_leads FOR ALL
  USING (
    public.current_is_captain_or_deputy() AND
    EXISTS (SELECT 1 FROM public.subsystems s
            WHERE s.id = subsystem_id AND s.team_id = public.current_team_id())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.subsystems s
            WHERE s.id = subsystem_id AND s.team_id = public.current_team_id())
  );

-- ============================================================================
-- ENTRIES (the core table)
-- ============================================================================
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

-- Read: any team member sees their team's entries.
CREATE POLICY entries_select_team ON public.entries FOR SELECT
  USING (team_id = public.current_team_id());

-- Read: anyone (including unauthenticated) sees public-showcase entries.
-- Anon users have no current_team_id() — this policy is purely an OR with
-- the team-member one.
CREATE POLICY entries_select_public ON public.entries FOR SELECT
  TO anon, authenticated
  USING (is_public_showcase = TRUE);

-- Insert: any writing member can create entries as themselves on their team.
CREATE POLICY entries_insert_self ON public.entries FOR INSERT
  WITH CHECK (
    team_id = public.current_team_id() AND
    author_id = public.current_member_id() AND
    public.current_can_write()
  );

-- Update: author within 24h.
CREATE POLICY entries_update_author_24h ON public.entries FOR UPDATE
  USING (
    team_id = public.current_team_id() AND
    author_id = public.current_member_id() AND
    created_at > NOW() - INTERVAL '24 hours'
  )
  WITH CHECK (team_id = public.current_team_id());

-- Update: Captain or Deputy any time.
CREATE POLICY entries_update_captain ON public.entries FOR UPDATE
  USING (team_id = public.current_team_id() AND public.current_is_captain_or_deputy())
  WITH CHECK (team_id = public.current_team_id());

-- Delete: Captain only.
CREATE POLICY entries_delete_captain ON public.entries FOR DELETE
  USING (team_id = public.current_team_id() AND public.current_is_captain());

-- ============================================================================
-- ENTRY-SCOPED CHILD TABLES
--
-- For tables keyed off entry_id, we use a shared idiom: "you can do X on this
-- row if you can do X on the parent entry." This delegates the access model
-- to entries and avoids duplicating the 24h logic everywhere.
-- ============================================================================

-- Helper: can the current member read this entry?
CREATE OR REPLACE FUNCTION public.can_read_entry(p_entry_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.entries e
    WHERE e.id = p_entry_id
      AND (e.team_id = public.current_team_id() OR e.is_public_showcase = TRUE)
  )
$$;

-- Helper: can the current member write to this entry's children?
CREATE OR REPLACE FUNCTION public.can_write_entry(p_entry_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.entries e
    WHERE e.id = p_entry_id
      AND e.team_id = public.current_team_id()
      AND (
        public.current_is_captain_or_deputy()
        OR (e.author_id = public.current_member_id()
            AND e.created_at > NOW() - INTERVAL '24 hours')
      )
  )
$$;

-- Apply the standard policy set to every entry-scoped table.
-- (Loop done in plpgsql so it's mechanical.)
DO $$
DECLARE
  t TEXT;
  child_tables TEXT[] := ARRAY[
    'session_logs', 'outreach_logs', 'outreach_stories', 'meeting_notes',
    'competition_recaps', 'competition_pit_panels', 'competition_failure_analyses',
    'competition_notable_matches', 'competition_strategic_insights',
    'decision_logs', 'decision_alternatives',
    'hardware_change_logs', 'hardware_change_deltas',
    'software_change_logs', 'test_logs',
    'contact_logs', 'subsystem_handoffs',
    'entry_attendees', 'media_attachments', 'action_items', 'classification_tags'
  ];
  entry_fk_col TEXT;
BEGIN
  FOREACH t IN ARRAY child_tables LOOP
    -- These tables all reference an entry via either entry_id (most) or a
    -- foreign key with a more specific name. Figure out which one for this table.
    SELECT column_name INTO entry_fk_col
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = t
        AND column_name IN (
          'entry_id', 'outreach_log_entry_id', 'competition_recap_entry_id',
          'decision_log_entry_id', 'hardware_change_log_entry_id'
        )
      ORDER BY
        CASE column_name
          WHEN 'entry_id' THEN 0 ELSE 1
        END
      LIMIT 1;

    IF entry_fk_col IS NULL THEN
      RAISE EXCEPTION 'Table % has no entry FK column we recognize', t;
    END IF;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY %I_select ON public.%I FOR SELECT USING (public.can_read_entry(%I))',
      t, t, entry_fk_col);
    EXECUTE format(
      'CREATE POLICY %I_insert ON public.%I FOR INSERT WITH CHECK (public.can_write_entry(%I))',
      t, t, entry_fk_col);
    EXECUTE format(
      'CREATE POLICY %I_update ON public.%I FOR UPDATE USING (public.can_write_entry(%I)) WITH CHECK (public.can_write_entry(%I))',
      t, t, entry_fk_col, entry_fk_col);
    EXECUTE format(
      'CREATE POLICY %I_delete ON public.%I FOR DELETE USING (public.can_write_entry(%I))',
      t, t, entry_fk_col);
  END LOOP;
END $$;

-- ============================================================================
-- ENTRY REVISIONS (audit trail)
-- ============================================================================
ALTER TABLE public.entry_revisions ENABLE ROW LEVEL SECURITY;
-- Read: anyone on the team can see the audit trail for any entry they can see.
CREATE POLICY entry_revisions_select ON public.entry_revisions FOR SELECT
  USING (public.can_read_entry(entry_id));
-- No direct inserts: the trigger creates these. Block all writes via no
-- policy + RLS enabled = denied.

-- ============================================================================
-- FLAGS
-- ============================================================================
ALTER TABLE public.flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY flags_select_team ON public.flags FOR SELECT
  USING (team_id = public.current_team_id());

CREATE POLICY flags_insert_writers ON public.flags FOR INSERT
  WITH CHECK (team_id = public.current_team_id() AND public.current_can_write());

-- The owner, the Captain, and the Deputy can update a flag.
CREATE POLICY flags_update_owner_or_captain ON public.flags FOR UPDATE
  USING (
    team_id = public.current_team_id() AND
    (target_owner_id = public.current_member_id() OR public.current_is_captain_or_deputy())
  )
  WITH CHECK (team_id = public.current_team_id());

CREATE POLICY flags_delete_captain ON public.flags FOR DELETE
  USING (team_id = public.current_team_id() AND public.current_is_captain_or_deputy());

-- ============================================================================
-- TEST SERIES
-- ============================================================================
ALTER TABLE public.test_series ENABLE ROW LEVEL SECURITY;

CREATE POLICY test_series_select_team ON public.test_series FOR SELECT
  USING (team_id = public.current_team_id());

CREATE POLICY test_series_write_team ON public.test_series FOR ALL
  USING (team_id = public.current_team_id() AND public.current_can_write())
  WITH CHECK (team_id = public.current_team_id());

-- ============================================================================
-- CONTACTS
-- ============================================================================
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY contacts_select_team ON public.contacts FOR SELECT
  USING (team_id = public.current_team_id());

CREATE POLICY contacts_write_team ON public.contacts FOR ALL
  USING (team_id = public.current_team_id() AND public.current_can_write())
  WITH CHECK (team_id = public.current_team_id());

-- ============================================================================
-- AWARDS / AWARD_CRITERIA
-- ============================================================================
ALTER TABLE public.awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY awards_select_team ON public.awards FOR SELECT
  USING (team_id = public.current_team_id());

CREATE POLICY awards_write_captain ON public.awards FOR ALL
  USING (team_id = public.current_team_id() AND public.current_is_captain_or_deputy())
  WITH CHECK (team_id = public.current_team_id());

ALTER TABLE public.award_criteria ENABLE ROW LEVEL SECURITY;

CREATE POLICY award_criteria_select_team ON public.award_criteria FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.awards a
            WHERE a.id = award_id AND a.team_id = public.current_team_id())
  );

CREATE POLICY award_criteria_write_captain ON public.award_criteria FOR ALL
  USING (
    public.current_is_captain_or_deputy() AND
    EXISTS (SELECT 1 FROM public.awards a
            WHERE a.id = award_id AND a.team_id = public.current_team_id())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.awards a
            WHERE a.id = award_id AND a.team_id = public.current_team_id())
  );
