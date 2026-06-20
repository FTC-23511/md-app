-- ===========================================================================
-- Hardware Change Log: allow decimal version numbers (App Lead request).
-- `version` / `replaces_version` were `integer`; widen to `numeric` so iterative
-- bumps like v3.1 are possible. Widening is non-destructive — existing integer
-- values cast cleanly to numeric. No grant changes (ALTER COLUMN keeps grants).
-- ===========================================================================

ALTER TABLE public.hw_change_logs
  ALTER COLUMN version TYPE numeric USING version::numeric;

ALTER TABLE public.hw_change_logs
  ALTER COLUMN replaces_version TYPE numeric USING replaces_version::numeric;
