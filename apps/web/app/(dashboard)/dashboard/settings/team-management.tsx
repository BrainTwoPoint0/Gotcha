'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EditorialButton } from '../../components/editorial/button';
import { EditorialInput } from '../../components/editorial/form-field';

interface Member {
  id: string;
  role: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  expiresAt: string;
  invitedBy: { name: string | null; email: string };
}

const ROLE_TONE: Record<string, string> = {
  OWNER: 'text-editorial-accent',
  ADMIN: 'text-editorial-ink',
  MEMBER: 'text-editorial-neutral-3',
  VIEWER: 'text-editorial-neutral-3/70',
};

function roleLabel(role: string) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
      {children}
    </p>
  );
}

export function TeamManagement() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>('MEMBER');
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const router = useRouter();
  const isOwner = currentUserRole === 'OWNER';
  const isAdmin = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [membersRes, invitesRes] = await Promise.all([
        fetch('/api/organization/members'),
        fetch('/api/organization/invitations'),
      ]);

      if (membersRes.ok) {
        const data = await membersRes.json();
        setMembers(data.members);
        setCurrentUserRole(data.currentUserRole);
      }

      if (invitesRes.ok) {
        const data = await invitesRes.json();
        setInvitations(data.invitations);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setInviteError(null);
    setInviteSuccess(false);

    try {
      const res = await fetch('/api/organization/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send invitation');
      }

      setInviteEmail('');
      setInviteSuccess(true);
      setTimeout(() => setInviteSuccess(false), 3000);
      fetchData();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setInviting(false);
    }
  }

  async function handleRevokeInvite(invitationId: string) {
    setActionError(null);
    try {
      const res = await fetch(`/api/organization/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || 'Failed to revoke invitation');
        return;
      }
      fetchData();
    } catch {
      setActionError('Failed to revoke invitation. Please try again.');
    }
  }

  async function handleRoleChange(memberId: string, newRole: string) {
    setActionError(null);
    try {
      const res = await fetch(`/api/organization/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || 'Failed to update role');
        return;
      }

      fetchData();
      router.refresh();
    } catch {
      setActionError('Failed to update role. Please try again.');
    }
  }

  async function handleRemoveMember(memberId: string, memberName: string) {
    if (!confirm(`Remove ${memberName} from the organization?`)) return;

    setActionError(null);
    try {
      const res = await fetch(`/api/organization/members/${memberId}`, {
        method: 'DELETE',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || 'Failed to remove member');
        return;
      }

      fetchData();
    } catch {
      setActionError('Failed to remove member. Please try again.');
    }
  }

  if (loading) {
    return (
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-editorial-neutral-3">
        Loading team…
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {actionError && (
        <div
          role="alert"
          className="border-l-2 border-editorial-alert bg-editorial-alert/[0.04] px-4 py-3 text-[13px] text-editorial-alert"
        >
          {actionError}
        </div>
      )}

      <div>
        <SectionLabel>Members ({members.length})</SectionLabel>
        <ul className="space-y-2">
          {members.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between gap-3 rounded-md border border-editorial-neutral-2 bg-editorial-paper px-3 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-editorial-neutral-2 bg-editorial-ink/[0.02] font-mono text-[12px] text-editorial-neutral-3"
                >
                  {(member.user.name || member.user.email)[0].toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[14px] text-editorial-ink">
                    {member.user.name || member.user.email}
                  </p>
                  <p className="truncate font-mono text-[11px] text-editorial-neutral-3">
                    {member.user.email}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {isOwner && member.role !== 'OWNER' ? (
                  <Select
                    value={member.role}
                    onValueChange={(value) => handleRoleChange(member.id, value)}
                  >
                    <SelectTrigger
                      aria-label={`Role for ${member.user.name || member.user.email}`}
                      className="h-8 w-28 rounded-md border-editorial-neutral-2 bg-editorial-paper text-[12px] text-editorial-ink focus:border-editorial-accent focus:ring-2 focus:ring-editorial-accent/25"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="editorial border-editorial-neutral-2 bg-editorial-paper">
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="VIEWER">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span
                    className={`font-mono text-[10px] uppercase tracking-[0.14em] ${
                      ROLE_TONE[member.role] || 'text-editorial-neutral-3'
                    }`}
                  >
                    {roleLabel(member.role)}
                  </span>
                )}

                {isOwner && member.role !== 'OWNER' && (
                  <button
                    onClick={() =>
                      handleRemoveMember(member.id, member.user.name || member.user.email)
                    }
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-editorial-neutral-3 transition-colors hover:bg-editorial-alert/[0.06] hover:text-editorial-alert focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-editorial-alert/40"
                    aria-label={`Remove ${member.user.name || member.user.email}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path
                        d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {invitations.length > 0 && (
        <div>
          <SectionLabel>Pending invitations</SectionLabel>
          <ul className="space-y-2">
            {invitations.map((invite) => (
              <li
                key={invite.id}
                className="flex items-center justify-between gap-3 rounded-md border border-dashed border-editorial-neutral-2 bg-editorial-ink/[0.02] px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-[14px] text-editorial-ink">{invite.email}</p>
                  <p className="font-mono text-[11px] text-editorial-neutral-3">
                    {roleLabel(invite.role)} · Expires{' '}
                    {new Date(invite.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleRevokeInvite(invite.id)}
                    className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-editorial-neutral-3 transition-colors hover:text-editorial-alert"
                  >
                    Revoke
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {isAdmin && (
        <div>
          <SectionLabel>Invite a teammate</SectionLabel>
          <form onSubmit={handleInvite} className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <EditorialInput
              type="email"
              placeholder="teammate@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              autoComplete="email"
              className="flex-1"
            />
            <Select value={inviteRole} onValueChange={setInviteRole}>
              <SelectTrigger
                aria-label="Invitation role"
                className="h-10 w-full rounded-md border-editorial-neutral-2 bg-editorial-paper text-[14px] text-editorial-ink focus:border-editorial-accent focus:ring-2 focus:ring-editorial-accent/25 sm:w-28"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="editorial border-editorial-neutral-2 bg-editorial-paper">
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="VIEWER">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <EditorialButton type="submit" variant="ink" disabled={inviting}>
              {inviting ? 'Sending…' : 'Invite'}
            </EditorialButton>
          </form>

          {inviteError && (
            <div
              role="alert"
              className="mt-3 border-l-2 border-editorial-alert bg-editorial-alert/[0.04] px-4 py-3 text-[13px] text-editorial-alert"
            >
              {inviteError}
            </div>
          )}

          {inviteSuccess && (
            <div
              role="status"
              className="mt-3 border-l-2 border-editorial-success bg-editorial-success/[0.04] px-4 py-3 text-[13px] text-editorial-success"
            >
              Invitation sent.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
