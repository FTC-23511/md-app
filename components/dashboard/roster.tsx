import Link from 'next/link';
import type { MemberWithSubsystems } from '@/lib/members';
import { ROLE_LABELS } from '@/lib/roles';

/**
 * Dashboard roster section (3F). Read-only summary of the team + roles, with a
 * link to the management screen (3D). Reuses lib/members.ts#listMembers.
 */
export function Roster({ members }: { members: MemberWithSubsystems[] }) {
  return (
    <section className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Team ({members.length})</h2>
        <Link
          href={'/admin/members' as never}
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Manage members →
        </Link>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Member</th>
              <th className="px-3 py-2 font-medium">Role</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members.map((m) => (
              <tr key={m.id} className={m.is_active ? '' : 'opacity-60'}>
                <td className="px-3 py-2">
                  <div className="font-medium">{m.display_name}</div>
                  <div className="text-xs text-muted-foreground">{m.email}</div>
                </td>
                <td className="px-3 py-2">{ROLE_LABELS[m.role]}</td>
                <td className="px-3 py-2">
                  <span className={m.is_active ? 'text-emerald-700' : 'text-muted-foreground'}>
                    {m.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
