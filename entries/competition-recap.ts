import type { EntryDefinition } from './_types';

/**
 * Competition Recap (Tier 1, T-04 + SOP-04) — the heaviest entry, filed from
 * the structured 60–90 min team recap meeting at T+48h. Captures judging
 * (interview, pit panels, evidence gaps), robot performance, the structured
 * 5-whys root-cause analysis (hard cap 3 failures, brief Q2), notable
 * matches (2–4), strategic insights, alliance & scouting, what worked,
 * changes before next event, per-person contributions, and the
 * documentation self-audit. Organized with `section-header` blocks so the
 * long form stays navigable (02-forms-and-detail.md §5).
 *
 * Filed complete — no draft→complete flow (2D brief, out of scope). Judge
 * interactions live entirely here; there is no separate Judge Interaction
 * Log (SOP-04).
 *
 * Storage note: the `01-schema.md` §6 sketch lists grouped extras keys
 * (`judging`, `alliance_scouting`, `documentation_self_audit`); the engine
 * stores one value per field, so those groups are flattened to prefixed
 * keys under their section headers (e.g. `judging_interview_rating`). The
 * array sections (`root_cause`, `notable_matches`, `strategic_insights`,
 * `changes_before_next`) store arrays as sketched. The T-04 5-whys ladder is
 * stored as one row per failure with `why_1`..`why_5` columns (equivalent to
 * the sketch's `whys[]`).
 *
 * The auto-generated companion view (Test Log trend) is computed for display
 * on the detail page, NOT stored on this entry (SOP-04; `01-schema.md` §6).
 */
export const competitionRecapEntry: EntryDefinition = {
  type: 'comp_recap',
  table: 'comp_recaps',
  label: 'Competition Recap',
  description:
    'The structured post-competition recap (T+48h meeting). Work top to ' +
    'bottom — judging, root causes, notable matches, insights, and the ' +
    'self-audit. The Test Log trend view generates automatically on the ' +
    'detail page.',
  fields: [
    {
      type: 'text',
      name: 'competition_name',
      label: 'Competition',
      required: true,
      storage: 'column',
      maxLength: 200,
    },
    {
      type: 'date',
      name: 'comp_start_date',
      label: 'Competition start date',
      required: true,
      storage: 'column',
    },
    {
      type: 'date',
      name: 'comp_end_date',
      label: 'Competition end date',
      helper: 'Optional — leave blank for one-day events.',
      required: false,
      storage: 'column',
    },
    {
      type: 'text',
      name: 'outcome',
      label: 'Outcome',
      helper: 'Advancement, awards, finishing rank.',
      required: false,
      storage: 'column',
      maxLength: 300,
    },
    {
      type: 'date',
      name: 'recap_meeting_date',
      label: 'Recap meeting date',
      helper: 'Within 7 days of competition end.',
      required: false,
      storage: 'extras',
      defaultValue: 'today',
    },
    {
      type: 'text',
      name: 'facilitator',
      label: 'Facilitator',
      helper: 'Usually the Documentation Captain.',
      required: false,
      storage: 'extras',
      maxLength: 100,
    },

    // ==== JUDGING ===========================================================
    {
      type: 'section-header',
      name: 'judging_interview_section',
      label: 'Judging — formal interview / Q&A',
      required: false,
      storage: 'extras',
    },
    {
      type: 'choice',
      name: 'judging_interview_rating',
      label: 'How did it go',
      required: false,
      storage: 'extras',
      display: 'radio',
      options: [
        { value: 'great', label: 'Great' },
        { value: 'good', label: 'Good' },
        { value: 'okay', label: 'Okay' },
        { value: 'weak', label: 'Weak' },
      ],
    },
    {
      type: 'long-text',
      name: 'judging_interview_strong',
      label: 'Questions we answered strongly',
      required: false,
      storage: 'extras',
      maxLength: 2000,
      rows: 2,
    },
    {
      type: 'long-text',
      name: 'judging_interview_weak',
      label: 'Questions that exposed weaknesses or surprised us',
      required: false,
      storage: 'extras',
      maxLength: 2000,
      rows: 2,
    },
    {
      type: 'long-text',
      name: 'judging_interview_feedback',
      label: 'Specific written or verbal feedback received',
      required: false,
      storage: 'extras',
      maxLength: 2000,
      rows: 2,
    },
    {
      type: 'section-header',
      name: 'judging_pit_section',
      label: 'Judging — pit panels',
      helper: 'One row per panel received, with inferred award areas.',
      required: false,
      storage: 'extras',
    },
    {
      type: 'repeating-rows',
      name: 'judging_pit_panels',
      label: 'Pit panels',
      required: false,
      storage: 'extras',
      maxRows: 8,
      addLabel: 'Add panel',
      columns: [
        { name: 'judges', label: 'Judges / lanyard color' },
        { name: 'award_areas', label: 'Likely award area(s)' },
        { name: 'how_it_went', label: 'How it went' },
      ],
    },
    {
      type: 'long-text',
      name: 'judging_evidence_gaps',
      label: 'Evidence gaps across all judging',
      helper:
        'What did we fail to include or present the best? One per line — each becomes a ' +
        'pre-prep item for the next event.',
      required: false,
      storage: 'extras',
      maxLength: 2000,
      rows: 3,
    },

    // ==== ROBOT PERFORMANCE =================================================
    {
      type: 'section-header',
      name: 'performance_section',
      label: 'Robot performance',
      required: false,
      storage: 'extras',
    },
    {
      type: 'long-text',
      name: 'match_results',
      label: 'Match results summary',
      required: false,
      storage: 'extras',
      maxLength: 2000,
      rows: 2,
    },
    {
      type: 'number',
      name: 'auto_reliability_pct',
      label: 'Autonomous reliability',
      helper: 'Percent of matches where auto ran as intended.',
      required: false,
      storage: 'column',
      min: 0,
      max: 100,
      decimals: true,
      unit: '%',
    },
    {
      type: 'text',
      name: 'top_scoring_strategy',
      label: 'Top scoring strategy used',
      required: false,
      storage: 'extras',
      maxLength: 300,
    },
    {
      type: 'text',
      name: 'most_failure_prone_subsystem',
      label: 'Most failure-prone subsystem this event',
      required: false,
      storage: 'extras',
      maxLength: 200,
    },

    // ==== STRUCTURED ROOT-CAUSE ANALYSIS ====================================
    {
      type: 'section-header',
      name: 'root_cause_section',
      label: 'Structured root-cause analysis (5-whys)',
      helper:
        'Up to 3 failures that meaningfully affected the event — a match loss, a missed ' +
        'scoring opportunity worth ≥10 points, or a pit reset. Stop earlier than 5 whys if ' +
        'a real root cause emerges sooner.',
      required: false,
      storage: 'extras',
    },
    {
      type: 'repeating-rows',
      name: 'root_cause',
      label: 'Failures analyzed',
      required: false,
      storage: 'extras',
      maxRows: 3,
      addLabel: 'Add failure',
      columns: [
        { name: 'failure', label: 'Failure + match(es) affected' },
        { name: 'why_1', label: 'Why? (1)' },
        { name: 'why_2', label: 'Why? (2)' },
        { name: 'why_3', label: 'Why? (3)' },
        { name: 'why_4', label: 'Why? (4)' },
        { name: 'why_5', label: 'Why? (5)' },
        { name: 'root_cause', label: 'Actionable root cause' },
        { name: 'owner_action', label: 'Owner / next action' },
      ],
    },
    {
      type: 'long-text',
      name: 'other_issues',
      label: 'Non-match-affecting issues observed',
      helper: 'Loose bullets, no 5-whys needed.',
      required: false,
      storage: 'extras',
      maxLength: 2000,
      rows: 2,
    },

    // ==== NOTABLE MATCHES ===================================================
    {
      type: 'section-header',
      name: 'notable_matches_section',
      label: 'Notable matches',
      helper:
        'Capture only the 2–4 matches that revealed something or showcased something — ' +
        'skip matches that played out as expected.',
      required: false,
      storage: 'extras',
    },
    {
      type: 'repeating-rows',
      name: 'notable_matches',
      label: 'Matches',
      required: false,
      storage: 'extras',
      maxRows: 4,
      addLabel: 'Add match',
      columns: [
        { name: 'match', label: 'Match (e.g. Q7)' },
        { name: 'alliance', label: 'Alliance vs. opponents' },
        { name: 'why_notable', label: 'Why worth writing about' },
        { name: 'auto_outcome', label: 'Auto outcome' },
        { name: 'teleop', label: 'Teleop key sequences' },
        { name: 'endgame', label: 'Endgame outcome' },
        { name: 'takeaway', label: 'Key takeaway' },
      ],
    },

    // ==== STRATEGIC INSIGHTS ================================================
    {
      type: 'section-header',
      name: 'strategic_insights_section',
      label: 'Strategic insights',
      helper:
        'Things learned about the game, opponents, or field conditions we didn’t know ' +
        'going in. Each insight is flagged for follow-up.',
      required: false,
      storage: 'extras',
    },
    {
      type: 'repeating-rows',
      name: 'strategic_insights',
      label: 'Insights',
      required: false,
      storage: 'extras',
      maxRows: 10,
      addLabel: 'Add insight',
      columns: [
        { name: 'insight', label: 'Insight' },
        { name: 'decision_trigger', label: 'Decision Log trigger? (yes / no)' },
        { name: 'owner', label: 'Owner' },
      ],
    },

    // ==== ALLIANCE & SCOUTING ===============================================
    {
      type: 'section-header',
      name: 'alliance_section',
      label: 'Alliance & scouting',
      required: false,
      storage: 'extras',
    },
    {
      type: 'text',
      name: 'alliance_partners',
      label: 'Alliance partner(s)',
      required: false,
      storage: 'extras',
      maxLength: 200,
    },
    {
      type: 'long-text',
      name: 'partner_feedback',
      label: 'Feedback from alliance partners on our robot',
      required: false,
      storage: 'extras',
      maxLength: 2000,
      rows: 2,
    },
    {
      type: 'long-text',
      name: 'opponent_strategies',
      label: 'Notable opponent strategies observed',
      required: false,
      storage: 'extras',
      maxLength: 2000,
      rows: 2,
    },

    // ==== LESSONS + PEOPLE ==================================================
    {
      type: 'long-text',
      name: 'what_worked',
      label: 'What worked',
      helper: '2–5 bullets — what went better than expected, beyond the notable matches.',
      required: false,
      storage: 'extras',
      maxLength: 2000,
      rows: 3,
    },
    {
      type: 'repeating-rows',
      name: 'changes_before_next',
      label: 'Changes to make before next event',
      helper: 'Derived from root causes, evidence gaps, and strategic insights above.',
      required: false,
      storage: 'extras',
      maxRows: 8,
      addLabel: 'Add change',
      columns: [
        { name: 'change', label: 'Change' },
        { name: 'owner', label: 'Owner' },
        { name: 'due', label: 'Due' },
      ],
    },
    {
      type: 'person-attribution',
      name: 'per_person',
      label: 'Per-person contributions at event',
      helper: 'One line per attending team member.',
      required: false,
      storage: 'extras',
      contributionLabel: 'What they did / learned',
    },

    // ==== DOCUMENTATION SELF-AUDIT ==========================================
    {
      type: 'section-header',
      name: 'self_audit_section',
      label: 'Documentation self-audit',
      helper: 'Anything surfaced here becomes a system iteration item for the Quarterly Retro.',
      required: false,
      storage: 'extras',
    },
    {
      type: 'long-text',
      name: 'doc_capture_gaps',
      label: 'What did we fail to capture at this event that we wish we had',
      required: false,
      storage: 'extras',
      maxLength: 2000,
      rows: 2,
    },
    {
      type: 'long-text',
      name: 'doc_system_changes',
      label: 'What changes to the MD system come out of this event',
      required: false,
      storage: 'extras',
      maxLength: 2000,
      rows: 2,
    },

    // ==== SPECIALTY ENTRIES TRIGGERED =======================================
    {
      type: 'specialty-triggers',
      name: 'specialty_triggers',
      label: 'Specialty entries triggered',
      helper: 'Tier 2 entries this recap requires — judges and sponsors met go to a Contact Log.',
      required: false,
      storage: 'extras',
    },
  ],
};

// Used by the list view to format a one-line headline per row.
export function listSummary(row: Record<string, unknown>): string {
  const name = row.competition_name ? String(row.competition_name) : 'Competition';
  const outcome = row.outcome ? ` — ${String(row.outcome)}` : '';
  const date = row.comp_start_date ? ` (${String(row.comp_start_date)})` : '';
  return `${name}${outcome}${date}`.slice(0, 100);
}
