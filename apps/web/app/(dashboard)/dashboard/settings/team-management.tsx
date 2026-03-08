'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/AppButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'bg-amber-50 text-amber-700 border-amber-200/60',
  ADMIN: 'bg-blue-50 text-blue-700 border-blue-200/60',
  MEMBER: 'bg-gray-50 text-gray-600 border-gray-200/80',
  VIEWER: 'bg-slate-50 text-slate-500 border-slate-200/60',
};

export function TeamManagement() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>('MEMBER');
  const [loading, setLoading] = useState(true);

  // Invite form
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
        headers: { 'Content-Type': 'application/json' },
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
    try {
      await fetch(`/api/organization/invitations/${invitationId}`, { method: 'DELETE' });
      fetchData();
    } catch {
      // silent
    }
  }

  async function handleRoleChange(memberId: string, newRole: string) {
    try {
      const res = await fetch(`/api/organization/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to update role');
        return;
      }

      fetchData();
      router.refresh();
    } catch {
      // silent
    }
  }

  async function handleRemoveMember(memberId: string, memberName: string) {
    if (!confirm(`Remove ${memberName} from the organization?`)) return;

    try {
      const res = await fetch(`/api/organization/members/${memberId}`, { method: 'DELETE' });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to remove member');
        return;
      }

      fetchData();
    } catch {
      // silent
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-400">Loading team...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Members list */}
      <div>
        <Label className="text-muted-foreground mb-3 block">Members ({members.length})</Label>
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg border border-gray-100 bg-white"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500 shrink-0">
                  {(member.user.name || member.user.email)[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {member.user.name || member.user.email}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{member.user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isOwner && member.role !== 'OWNER' ? (
                  <Select
                    value={member.role}
                    onValueChange={(value) => handleRoleChange(member.id, value)}
                  >
                    <SelectTrigger className="h-7 w-24 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="VIEWER">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className={ROLE_COLORS[member.role] || ''}>
                    {member.role.charAt(0) + member.role.slice(1).toLowerCase()}
                  </Badge>
                )}

                {isOwner && member.role !== 'OWNER' && (
                  <button
                    onClick={() =>
                      handleRemoveMember(member.id, member.user.name || member.user.email)
                    }
                    className="text-gray-300 hover:text-red-500 transition-colors p-1"
                    title="Remove member"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
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
            </div>
          ))}
        </div>
      </div>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div>
          <Label className="text-muted-foreground mb-3 block">Pending Invitations</Label>
          <div className="space-y-2">
            {invitations.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg border border-dashed border-gray-200 bg-gray-50/50"
              >
                <div className="min-w-0">
                  <p className="text-sm text-gray-600 truncate">{invite.email}</p>
                  <p className="text-xs text-gray-400">
                    {invite.role.charAt(0) + invite.role.slice(1).toLowerCase()} &middot; Expires{' '}
                    {new Date(invite.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleRevokeInvite(invite.id)}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors shrink-0"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite form — only OWNER and ADMIN */}
      {isAdmin && (
        <div>
          <Label className="text-muted-foreground mb-3 block">Invite Teammate</Label>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
            <Input
              type="email"
              placeholder="teammate@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              className="flex-1"
            />
            <Select value={inviteRole} onValueChange={setInviteRole}>
              <SelectTrigger className="w-full sm:w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="VIEWER">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" loading={inviting} loadingText="Sending...">
              Invite
            </Button>
          </form>

          {inviteError && (
            <Alert variant="destructive" className="mt-2">
              <AlertDescription>{inviteError}</AlertDescription>
            </Alert>
          )}

          {inviteSuccess && (
            <Alert className="mt-2 border-green-200 bg-green-50 text-green-800">
              <AlertDescription>Invitation sent!</AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
