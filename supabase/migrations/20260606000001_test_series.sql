-- =============================================================================
-- Migration 016: test_series — compute-support rollup for Test Log trends
--
-- Phase 2 batch 2C. The 2A schema (migration 014) deliberately deferred this
-- table so we didn't ship an unused one — it lands here, alongside the
-- auto-compute that writes it (docs/phase2/03-test-log.md; 01-schema.md §4).
--
-- One row per Test Log submit, written by the same compute step that fills
-- test_logs.extras.computed (app submit path AND the fallback importer — a
-- shared, path-independent module, no DB trigger). It exists so the dashboard
-- and the 2D Comp Recap companion view can read last-run / trend data cheaply
-- by test_label without re-deriving stats from test_logs on every read
-- (brief Q1: use the table — trends are read often).
--
-- This is a derived rollup, NOT an entry table, so it does not carry the full
-- common-column set (no created_by / created_via / extras / entry_state /
-- updated_at). Rows are written once and not edited; if a parent test_logs row
-- is hard-deleted, its rollup rows go with it (ON DELETE CASCADE). Soft-deletes
-- (test_logs.deleted_at) leave the rollup intact — the compute step owns
-- consistency.
--
-- Conventions mirror migration 014 (docs/phase2/01-schema.md §0): permissive
-- Phase 1-style RLS (*_all_authenticated; Phase 3 replaces); grants land in the
-- FOLLOWING migration (017), tracked separately — "expose new tables" is off.
-- =============================================================================

CREATE TABLE public.test_series (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at     timestamptz NOT NULL DEFAULT now(),

  test_label     text NOT NULL,   -- time-series key; matches test_logs.test_label
  test_log_id    uuid NOT NULL REFERENCES public.test_logs(id) ON DELETE CASCADE,
  test_date      date NOT NULL,
  headline_stat  numeric,         -- the run's headline metric (null if non-numeric)
  headline_label text             -- human label for headline_stat (e.g. "pass rate")
);

-- Trend / last-run lookups are always "rows for this label, newest first."
CREATE INDEX test_series_label_idx
ON public.test_series (test_label, test_date DESC);

ALTER TABLE public.test_series ENABLE ROW LEVEL SECURITY;

CREATE POLICY test_series_all_authenticated ON public.test_series
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
