'use client';

import { useActionState } from 'react';
import {
  inviteMember,
  resendInvite,
  setMemberRole,
  setMemberActive,
  assignSubsystems,
  type ActionState,
} from './actions';
import { ROLE_VALUES, ROLE_LABELS } from '@/lib/roles';
import type { MemberWithSubsystems } from '@/lib/members';

const INITIAL: ActionState = {};

type SubsystemOption = { id: string; label: string };

function Feedback({ state }: { state: ActionState }) {
  if (state.error) return <p className="mt-1 text-xs text-destructive">{state.error}</p>;
  if (state.message) return <p className="mt-1 text-xs text-emerald-700">{state.message}</p>;
  return null;
}

function InviteForm() {
  const [state, formAction, pending] = useActionState(inviteMember, INITIAL);
  return (
    <form
      action={formAction}
      className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-4 sm:items-end"
    >
      <div className="grid gap-1">
        <label htmlFor="invite-name" className="text-xs font-medium text-muted-foreground">
          Name
        </label>
        <input
          id="invite-name"
          name="display_name"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
          placeholder="Jordan Lee"
        />
      </div>
      <div className="grid gap-1">
        <label htmlFor="invite-email" className="text-xs font-medium text-muted-foreground">
          Email
        </label>
        <input
          id="invite-email"
          name="email"
          type="email"
          required
          className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
          placeholder="jordan@example.com"
        />
      </div>
      <div className="grid gap-1">
        <label htmlFor="invite-role" className="text-xs font-medium text-muted-foreground">
          Initial role
        </label>
        <select
          id="invite-role"
          name="role"
          defaultValue="general_member"
          className="h-9 rounded-md border border-input bg-background px-2 text-sm shadow-sm"
        >
          {ROLE_VALUES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? 'Inviting…' : 'Send invite'}
        </button>
      </div>
      <div className="sm:col-span-4">
        <Feedback state={state} />
      </div>
    </form>
  );
}

function RoleControl({ member }: { member: MemberWithSubsystems }) {
  const [state, formAction] = useActionState(setMemberRole, INITIAL);
  return (
    <form action={formAction}>
      <input type="hidden" name="member_id" value={member.id} />
      <select
        name="role"
        defaultValue={member.role}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="h-8 rounded-md border border-input bg-background px-2 text-xs shadow-sm"
        aria-label={`Role for ${member.display_name}`}
      >
        {ROLE_VALUES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </select>
      <Feedback state={state} />
    </form>
  );
}

function ActiveControl({ member }: { member: MemberWithSubsystems }) {
  const [state, formAction, pending] = useActionState(setMemberActive, INITIAL);
  return (
    <form action={formAction}>
      <input type="hidden" name="member_id" value={member.id} />
      <input type="hidden" name="active" value={(!member.is_active).toString()} />
      <button
        type="submit"
        disabled={pending}
        className={`text-xs underline-offset-4 hover:underline disabled:opacity-50 ${
          member.is_active ? 'text-destructive' : 'text-emerald-700'
        }`}
      >
        {member.is_active ? 'Deactivate' : 'Reactivate'}
      </button>
      <Feedback state={state} />
    </form>
  );
}

function SubsystemControl({
  member,
  subsystems,
}: {
  member: MemberWithSubsystems;
  subsystems: SubsystemOption[];
}) {
  const [state, formAction, pending] = useActionState(assignSubsystems, INITIAL);
  if (subsystems.length === 0) {
    return <span className="text-xs text-muted-foreground">No subsystems defined</span>;
  }
  return (
    <form action={formAction} className="grid gap-1">
      <input type="hidden" name="member_id" value={member.id} />
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {subsystems.map((s) => (
          <label key={s.id} className="inline-flex items-center gap-1 text-xs">
            <input
              type="checkbox"
              name="subsystem_option_id"
              value={s.id}
              defaultChecked={member.subsystem_option_ids.includes(s.id)}
            />
            {s.label}
          </label>
        ))}
      </div>
      <div>
        <button
          type="submit"
          disabled={pending}
          className="text-xs text-primary underline-offset-4 hover:underline disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save subsystems'}
        </button>
      </div>
      <Feedback state={state} />
    </form>
  );
}

function ResendControl({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState(resendInvite, INITIAL);
  return (
    <form action={formAction}>
      <input type="hidden" name="email" value={email} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50"
      >
        {pending ? 'Sending…' : 'Resend invite'}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function MembersTable({
  members,
  subsystems,
}: {
  members: MemberWithSubsystems[];
  subsystems: SubsystemOption[];
}) {
  return (
    <div className="space-y-6">
      <section className="grid gap-2">
        <h2 className="text-sm font-semibold">Invite a teammate</h2>
        <InviteForm />
      </section>

      <section className="grid gap-2">
        <h2 className="text-sm font-semibold">Roster ({members.length})</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Member</th>
                <th className="px-3 py-2 font-medium">Role</th>
                <th className="px-3 py-2 font-medium">Subsystems</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((m) => (
                <tr key={m.id} className={m.is_active ? '' : 'opacity-60'}>
                  <td className="px-3 py-3 align-top">
                    <div className="font-medium">{m.display_name}</div>
                    <div className="text-xs text-muted-foreground">{m.email}</div>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <RoleControl member={m} />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <SubsystemControl member={m} subsystems={subsystems} />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <div className="grid gap-1">
                      <span className={m.is_active ? 'text-xs text-emerald-700' : 'text-xs'}>
                        {m.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <ActiveControl member={m} />
                      <ResendControl email={m.email} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
