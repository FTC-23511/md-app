/**
 * Client-safe role constants + types. Kept separate from lib/members.ts (which
 * imports server-only modules) so client components can use the role list /
 * labels without pulling server code into the browser bundle.
 */

export const ROLE_VALUES = [
  'documentation_captain',
  'deputy_documentation_captain',
  'subsystem_documentation_lead',
  'general_member',
  'mentor',
] as const;

export type MemberRole = (typeof ROLE_VALUES)[number];

export const ROLE_LABELS: Record<MemberRole, string> = {
  documentation_captain: 'Documentation Captain',
  deputy_documentation_captain: 'Deputy Captain',
  subsystem_documentation_lead: 'Subsystem Lead',
  general_member: 'General Member',
  mentor: 'Mentor',
};
