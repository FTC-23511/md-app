-- =============================================================================
-- Migration 005: Triggers and computed-column functions
--
-- Three pieces of automation live here:
--   1. entry_revisions audit snapshots on every entries UPDATE
--   2. test_logs auto-compute (n, pass rate + 95% CI, mean/stddev/min/max,
--      last-run lookup) on raw_data insert/update
--   3. updated_at touches on rows that need them
-- =============================================================================

-- ---- 1. Entry revision snapshot --------------------------------------------
-- Snapshots the OLD row into entry_revisions whenever an entries row is
-- updated. edit_reason is read from entries.last_edit_reason (set by the app
-- before the UPDATE). The 24h-window enforcement and "must have edit_reason
-- if >24h old" logic live in the server action layer, where they can be read
-- and tested as TypeScript.

CREATE OR REPLACE FUNCTION public.snapshot_entry_revision()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_actor_id UUID;
BEGIN
  -- Only snapshot on actual content changes — skip pure timestamp touches.
  IF row_to_json(OLD)::jsonb - 'updated_at'
     IS DISTINCT FROM
     row_to_json(NEW)::jsonb - 'updated_at' THEN

    v_actor_id := public.current_member_id();

    -- If RLS / server action skipped setting a member context (e.g. service
    -- role), fall back to the entry's author. This still produces a valid
    -- audit row.
    IF v_actor_id IS NULL THEN
      v_actor_id := OLD.author_id;
    END IF;

    INSERT INTO public.entry_revisions (entry_id, edited_by, edit_reason, snapshot)
    VALUES (
      NEW.id,
      v_actor_id,
      NEW.last_edit_reason,
      row_to_json(OLD)::jsonb
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER entries_revision_snapshot
  AFTER UPDATE ON public.entries
  FOR EACH ROW EXECUTE FUNCTION public.snapshot_entry_revision();


-- ---- 2. Test Log auto-compute ----------------------------------------------
-- Reads raw_data + the parent test_series to compute headline statistics on
-- every insert/update of a test_logs row. Frees the student from typing
-- (and from understanding) the math while still producing statistically
-- honest entries.
--
-- raw_data shape:
--   pass/fail tests:  [{ "result": "success"|"fail", "note"?: "..." }, ...]
--   continuous tests: [{ "value": <number>, "note"?: "..." }, ...]

CREATE OR REPLACE FUNCTION public.compute_test_log_statistics()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_metric_type  public.test_type;
  v_team_id      UUID;
  v_n            INTEGER;
  v_pass_count   INTEGER;
  v_pass_rate    NUMERIC;
  v_z            CONSTANT NUMERIC := 1.96;
  v_se           NUMERIC;
  v_mean         NUMERIC;
  v_stddev       NUMERIC;
  v_min          NUMERIC;
  v_max          NUMERIC;
  v_last_run     UUID;
  v_event_date   DATE;
BEGIN
  SELECT metric_type INTO v_metric_type
    FROM public.test_series WHERE id = NEW.test_series_id;

  v_n := COALESCE(jsonb_array_length(NEW.raw_data), 0);
  NEW.n_trials := v_n;

  IF v_n = 0 THEN
    -- Clear computed fields if no data was provided.
    NEW.pass_count := NULL;
    NEW.pass_rate := NULL;
    NEW.ci_lower := NULL;
    NEW.ci_upper := NULL;
    NEW.mean_value := NULL;
    NEW.stddev_value := NULL;
    NEW.min_value := NULL;
    NEW.max_value := NULL;
  ELSIF v_metric_type = 'pass_fail' THEN
    SELECT COUNT(*) INTO v_pass_count
      FROM jsonb_array_elements(NEW.raw_data) AS elem
      WHERE elem->>'result' = 'success';

    v_pass_rate := v_pass_count::NUMERIC / v_n;
    v_se := sqrt(v_pass_rate * (1 - v_pass_rate) / v_n);

    NEW.pass_count := v_pass_count;
    NEW.pass_rate  := v_pass_rate;
    NEW.ci_lower   := GREATEST(0::NUMERIC, v_pass_rate - v_z * v_se);
    NEW.ci_upper   := LEAST(1::NUMERIC,   v_pass_rate + v_z * v_se);
    -- Continuous-only columns stay null.
    NEW.mean_value := NULL;
    NEW.stddev_value := NULL;
    NEW.min_value := NULL;
    NEW.max_value := NULL;
  ELSE
    -- continuous
    SELECT
      AVG((elem->>'value')::NUMERIC),
      STDDEV_SAMP((elem->>'value')::NUMERIC),
      MIN((elem->>'value')::NUMERIC),
      MAX((elem->>'value')::NUMERIC)
    INTO v_mean, v_stddev, v_min, v_max
    FROM jsonb_array_elements(NEW.raw_data) AS elem;

    NEW.mean_value   := v_mean;
    NEW.stddev_value := v_stddev;
    NEW.min_value    := v_min;
    NEW.max_value    := v_max;
    -- Pass/fail-only columns stay null.
    NEW.pass_count := NULL;
    NEW.pass_rate := NULL;
    NEW.ci_lower := NULL;
    NEW.ci_upper := NULL;
  END IF;

  -- Last-run lookup: most recent earlier Test Log in this series, by the
  -- parent entry's event_date.
  SELECT e_this.event_date INTO v_event_date
    FROM public.entries e_this WHERE e_this.id = NEW.entry_id;

  IF v_event_date IS NOT NULL THEN
    SELECT tl.entry_id INTO v_last_run
      FROM public.test_logs tl
      JOIN public.entries e ON e.id = tl.entry_id
      WHERE tl.test_series_id = NEW.test_series_id
        AND tl.entry_id <> NEW.entry_id
        AND e.event_date < v_event_date
      ORDER BY e.event_date DESC
      LIMIT 1;
    NEW.last_run_entry_id := v_last_run;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER test_logs_auto_compute
  BEFORE INSERT OR UPDATE OF raw_data, test_series_id ON public.test_logs
  FOR EACH ROW EXECUTE FUNCTION public.compute_test_log_statistics();


-- ---- 3. Flag auto-overdue --------------------------------------------------
-- When a flag's status is 'open' and we read it via the dashboard, the app
-- can call this function (or include a "WHERE due_at < NOW() AND status = 'open'"
-- in queries). To keep status accurate over time without a cron job, we expose
-- a function the app can call from a Friday-15 endpoint or scheduled job.

CREATE OR REPLACE FUNCTION public.mark_overdue_flags(p_team_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.flags
     SET status = 'overdue',
         updated_at = NOW()
   WHERE team_id = p_team_id
     AND status = 'open'
     AND due_at < NOW();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
