-- =============================================================================
-- Migration 022 (Phase 3 / 3C): entry_edit_audit table + record_entry_edit RPC
--
-- The audit trail for Captain/Deputy edits of entries older than 24h. The 24h
-- lock is enforced by RLS (3B UPDATE clause); this batch adds the app-layer
-- friendly messaging + this audit table so an override leaves a record and the
-- frozen contemporaneous record stays trustworthy.
--
-- A dedicated table — NOT an extras key: lib/update-entry.ts read-merges
-- `extras`, so a reason stored there would be clobbered (R8). Polymorphic,
-- matching the flags/media_links shape (entry_type registry key + entry_id).
--
-- Spec: docs/phase3/02-edit-lock.md §2-§3.
-- =============================================================================

CREATE TABLE public.entry_edit_audit (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_type       text NOT NULL,         -- registry key, e.g. 'decision_log'
  entry_id         uuid NOT NULL,
  editor_member_id uuid NOT NULL REFERENCES public.members(id),
  edit_reason      text NOT NULL,
  edited_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX entry_edit_audit_entry_idx
  ON public.entry_edit_audit (entry_type, entry_id);

ALTER TABLE public.entry_edit_audit ENABLE ROW LEVEL SECURITY;

-- SELECT: any active member may read the audit trail (a future viewer UI).
CREATE POLICY entry_edit_audit_select ON public.entry_edit_audit
  FOR SELECT TO authenticated
  USING ( is_active_member() );

-- INSERT: only Captain/Deputy, and only as themselves. (The RPC below is
-- SECURITY DEFINER and bypasses RLS; this policy guards any direct insert.)
CREATE POLICY entry_edit_audit_insert ON public.entry_edit_audit
  FOR INSERT TO authenticated
  WITH CHECK ( is_captain_or_deputy() AND editor_member_id = auth.uid() );

-- No UPDATE / DELETE policies → the audit trail is append-only / immutable.


-- ---- record_entry_edit RPC ------------------------------------------------
-- Writes one audit row for auth.uid(). SECURITY DEFINER so it commits the row
-- regardless of the (already-RLS-authorized) caller context, and so the
-- editor_member_id can't be forged — it is always auth.uid(). Re-checks the
-- Captain/Deputy gate and a non-empty reason defensively.

CREATE OR REPLACE FUNCTION public.record_entry_edit(
  p_entry_type  text,
  p_entry_id    uuid,
  p_edit_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_captain_or_deputy() THEN
    RAISE EXCEPTION 'Only the Documentation Captain or Deputy may record an edit reason';
  END IF;

  IF p_edit_reason IS NULL OR btrim(p_edit_reason) = '' THEN
    RAISE EXCEPTION 'An edit reason is required';
  END IF;

  INSERT INTO public.entry_edit_audit (entry_type, entry_id, editor_member_id, edit_reason)
  VALUES (p_entry_type, p_entry_id, auth.uid(), btrim(p_edit_reason));
END;
$$;
