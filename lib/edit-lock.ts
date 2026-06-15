/**
 * The 24h edit-lock decision — the app-layer half of the hybrid enforcement
 * (docs/phase3/02-edit-lock.md; plan decision 3). RLS is the authoritative hard
 * gate (3B UPDATE clause); this mirrors the SAME decision in TypeScript only to
 * return friendly messages and to require/record an edit_reason on a
 * Captain/Deputy override. If this is ever wrong, RLS still refuses — so a
 * surprising 0-row update result falls back to a generic permission message.
 *
 * Keyed off members.role (via current_role_name()) and the row's created_by /
 * created_at, exactly like the RLS predicate. created_at — not updated_at — so
 * editing never extends the window.
 */

export const EDIT_WINDOW_HOURS = 24;

const CAPTAIN = 'documentation_captain';
const DEPUTY = 'deputy_documentation_captain';

/** The outcome of the pre-update check. */
export type EditCapability =
  | { kind: 'allow' } //                no reason needed — proceed
  | { kind: 'reason_required' } //      Captain/Deputy override past 24h — collect + audit
  | { kind: 'locked' } //               own entry past 24h, no override right — deny
  | { kind: 'role_denied' } //          mentor / inactive / non-member — deny
  | { kind: 'denied' }; //              editing a row with no right — deny (generic)

export const EDIT_MESSAGES = {
  role_denied: 'Your role does not permit editing entries.',
  locked:
    'This entry is locked. Only the Documentation Captain or Deputy can edit it more than 24 hours after it was filed.',
  reason_required: 'An edit reason is required to edit an entry more than 24 hours old.',
  denied: "You don't have permission to make this change.",
} as const;

/** Whether `createdAt` is within the edit window relative to `nowMs`. */
export function withinEditWindow(createdAt: string | null, nowMs: number): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return false;
  return created + EDIT_WINDOW_HOURS * 60 * 60 * 1000 > nowMs;
}

/**
 * Mirror of the RLS UPDATE predicate. Inputs are everything RLS keys on:
 *  - role: current_role_name() — null for an inactive / non-member caller
 *  - isOwner: created_by === auth.uid()
 *  - withinWindow: within_edit_window(created_at)
 *  - hasExtendedRight: the caller has a table-specific indefinite-edit right on
 *    THIS row — Outreach Reporter on their own outreach_log, or Subsystem Lead
 *    on an hw_change_log / decision_log they lead. (Resolved by the caller via
 *    the matching SECURITY DEFINER helpers; false where no such column exists.)
 */
export function decideEdit(params: {
  role: string | null;
  isOwner: boolean;
  withinWindow: boolean;
  hasExtendedRight: boolean;
}): EditCapability {
  const { role, isOwner, withinWindow, hasExtendedRight } = params;

  // Inactive / non-member (role null) or read-only mentor: never edit.
  if (role === null || role === 'mentor') return { kind: 'role_denied' };

  // Captain / Deputy: anytime, but a past-24h edit of a row they did not author
  // needs a reason (their own / in-window edits don't).
  if (role === CAPTAIN || role === DEPUTY) {
    if (withinWindow || isOwner) return { kind: 'allow' };
    return { kind: 'reason_required' };
  }

  // General member / Subsystem Lead / Outreach Reporter.
  if (hasExtendedRight) return { kind: 'allow' }; // indefinite right on this row
  if (isOwner && withinWindow) return { kind: 'allow' }; // author, in window
  if (isOwner) return { kind: 'locked' }; // author, past window — frozen
  return { kind: 'denied' }; // editing someone else's row, no right
}
