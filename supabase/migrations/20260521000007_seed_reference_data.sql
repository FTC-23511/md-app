-- =============================================================================
-- Migration 007: Seed reference data
--
-- Inserts the single team row, the current FTC season, default subsystems, and
-- the current FTC award catalog with criteria placeholders. Edit the criterion
-- text in-app once the season's manual is published — placeholders here are
-- the long-stable criterion intent so the schema isn't blocked on manual text.
-- =============================================================================

-- ---- The team --------------------------------------------------------------
INSERT INTO public.teams (id, name, slug)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'FTC 23511',
  'ftc-23511'
);

-- ---- The current season ----------------------------------------------------
INSERT INTO public.seasons (id, team_id, name, game_code, start_date, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  '2026-27',
  'TBD',
  '2026-09-01',
  TRUE
);

-- ---- Default subsystems ----------------------------------------------------
-- Edit/extend in-app as needed; this is just a useful starting set.
INSERT INTO public.subsystems (team_id, name, slug, description) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Drivetrain',  'drivetrain',  'Chassis, drive motors, odometry'),
  ('00000000-0000-0000-0000-000000000001', 'Intake',      'intake',      'Game-piece intake mechanism'),
  ('00000000-0000-0000-0000-000000000001', 'Scoring',     'scoring',     'Outtake / scoring mechanism'),
  ('00000000-0000-0000-0000-000000000001', 'Lift',        'lift',        'Vertical lift / elevator'),
  ('00000000-0000-0000-0000-000000000001', 'Electronics', 'electronics', 'Wiring, sensors, control hub'),
  ('00000000-0000-0000-0000-000000000001', 'Software',    'software',    'Robot code, autonomous routines'),
  ('00000000-0000-0000-0000-000000000001', 'Strategy',    'strategy',    'Match strategy, scouting, alliance selection'),
  ('00000000-0000-0000-0000-000000000001', 'Outreach',    'outreach',    'Community, FLL coaching, demos'),
  ('00000000-0000-0000-0000-000000000001', 'Business',    'business',    'Sponsorship, finance, branding'),
  ('00000000-0000-0000-0000-000000000001', 'Team Ops',    'team-ops',    'Logistics, scheduling, training');

-- ---- Awards catalog --------------------------------------------------------
-- The seven canonical FTC season-end judged awards plus Dean's List.
-- Criterion text below is the long-stable intent; Captain edits to current
-- manual wording during pre-season setup.

WITH season AS (
  SELECT id, team_id FROM public.seasons WHERE id = '00000000-0000-0000-0000-000000000010'
)
INSERT INTO public.awards (team_id, season_id, name, display_order)
SELECT team_id, id, name, ord
FROM season, (VALUES
  ('Inspire',  1),
  ('Think',    2),
  ('Connect',  3),
  ('Motivate', 4),
  ('Innovate', 5),
  ('Control',  6),
  ('Design',   7),
  ('Dean''s List', 8)
) AS a(name, ord);

-- Award criteria (placeholders — Captain updates in-app from current manual).
INSERT INTO public.award_criteria (award_id, criterion_text, display_order)
SELECT a.id, c.criterion_text, c.ord
FROM public.awards a
JOIN (
  VALUES
    -- Inspire
    ('Inspire',  'Strongest overall ambassador for the FIRST program',        1),
    ('Inspire',  'Embodies FIRST values across engineering, outreach, team',  2),
    ('Inspire',  'Sustained, measurable impact on community',                 3),
    ('Inspire',  'Documentation across all award categories',                 4),

    -- Think
    ('Think',    'Engineering design process documented end-to-end',          1),
    ('Think',    'Iteration history with rationale and outcomes',             2),
    ('Think',    'Quantitative testing and analysis',                         3),
    ('Think',    'Engineering portfolio quality and depth',                   4),

    -- Connect
    ('Connect',  'Mentor network developed and sustained',                    1),
    ('Connect',  'STEM community connections (industry, university, alumni)', 2),
    ('Connect',  'Helping other teams beyond our own',                        3),
    ('Connect',  'Long-term plan for community engagement',                   4),

    -- Motivate
    ('Motivate', 'Spreading FIRST values in the community',                   1),
    ('Motivate', 'Recruitment of new members and mentors',                    2),
    ('Motivate', 'Team enthusiasm and identity',                              3),
    ('Motivate', 'Fundraising and sponsorship engagement',                    4),

    -- Innovate
    ('Innovate', 'Unique, creative solution to a game challenge',             1),
    ('Innovate', 'Risk-taking with documented decision process',              2),
    ('Innovate', 'Implementation succeeded in competition',                   3),

    -- Control
    ('Control',  'Sensor use and integration',                                1),
    ('Control',  'Control loops and tuning documented',                       2),
    ('Control',  'Autonomous performance and reliability',                    3),
    ('Control',  'Software architecture and code quality',                    4),

    -- Design
    ('Design',   'Industrial-design quality of the robot',                    1),
    ('Design',   'Mechanical elegance and constraint handling',               2),
    ('Design',   'Manufacturing reproducibility',                             3),

    -- Dean's List
    ('Dean''s List', 'Individual student leadership in technical work',       1),
    ('Dean''s List', 'Individual student leadership in non-technical work',   2),
    ('Dean''s List', 'Mentoring of other students',                           3)
) AS c(award_name, criterion_text, ord)
  ON c.award_name = a.name
WHERE a.season_id = '00000000-0000-0000-0000-000000000010';
