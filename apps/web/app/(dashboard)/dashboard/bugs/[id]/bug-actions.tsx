'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const STATUSES = [
  { value: 'OPEN', label: 'Open' },
  { value: 'INVESTIGATING', label: 'Investigating' },
  { value: 'FIXING', label: 'Fixing' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'WONT_FIX', label: "Won't Fix" },
];

const PRIORITIES = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

interface BugActionsProps {
  bugId: string;
  currentStatus: string;
  currentPriority: string;
  reporterEmail?: string | null;
}

export function BugActions({
  bugId,
  currentStatus,
  currentPriority,
  reporterEmail,
}: BugActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [priority, setPriority] = useState(currentPriority);
  const [isSaving, setIsSaving] = useState(false);

  const [noteContent, setNoteContent] = useState('');
  const [isExternal, setIsExternal] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync local state when server data changes (e.g. after resolve)
  useEffect(() => {
    setStatus(currentStatus);
  }, [currentStatus]);
  useEffect(() => {
    setPriority(currentPriority);
  }, [currentPriority]);

  const hasChanges = status !== currentStatus || priority !== currentPriority;
  const isResolved = currentStatus === 'RESOLVED' || currentStatus === 'CLOSED';
  const hasNote = noteContent.trim().length > 0;

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/bugs/${bugId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({ status, priority }),
      });
      if (!res.ok) throw new Error(`Failed to update (${res.status})`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddNote() {
    if (!hasNote) return;
    setIsAddingNote(true);
    setError(null);
    try {
      const res = await fetch(`/api/bugs/${bugId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({ content: noteContent.trim(), isExternal }),
      });
      if (!res.ok) throw new Error(`Failed to add note (${res.status})`);
      setNoteContent('');
      setIsExternal(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsAddingNote(false);
    }
  }

  async function handleResolve() {
    setIsResolving(true);
    setError(null);
    try {
      const res = await fetch(`/api/bugs/${bugId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({
          resolutionNote: noteContent.trim() || undefined,
          reporterMessage: isExternal && noteContent.trim() ? noteContent.trim() : undefined,
        }),
      });
      if (!res.ok) throw new Error(`Failed to resolve (${res.status})`);
      setNoteContent('');
      setIsExternal(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsResolving(false);
    }
  }

  return (
    <Card className="p-5">
      <h2 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-4">Actions</h2>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {/* Status & Priority */}
      <div className="space-y-3">
        <div>
          <span className="text-[11px] text-gray-400 block mb-1.5">Status</span>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <span className="text-[11px] text-gray-400 block mb-1.5">Priority</span>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-full text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasChanges && (
          <Button onClick={handleSave} disabled={isSaving} className="w-full" size="sm">
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 my-4" />

      {/* Note */}
      <div className="space-y-3">
        <span className="text-[11px] text-gray-400 block">Note</span>
        <textarea
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          placeholder="Add a note or resolution message..."
          rows={3}
          maxLength={5000}
          className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 resize-none transition-colors"
        />

        {reporterEmail && (
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={isExternal}
              onChange={(e) => setIsExternal(e.target.checked)}
              className="rounded border-gray-300 text-slate-700 focus:ring-slate-500 transition-colors"
            />
            <span className="text-[11px] text-gray-400 group-hover:text-gray-500 transition-colors">
              Also email to <span className="text-gray-500 font-medium">{reporterEmail}</span>
            </span>
          </label>
        )}

        <Button
          onClick={handleAddNote}
          disabled={isAddingNote || !hasNote}
          variant="outline"
          className="w-full"
          size="sm"
        >
          {isAddingNote ? 'Adding...' : 'Add Note'}
        </Button>

        {!isResolved && (
          <Button
            onClick={handleResolve}
            disabled={isResolving}
            variant="outline"
            className="w-full border-emerald-200/60 text-emerald-700 hover:bg-emerald-50/80 hover:text-emerald-800 transition-colors"
            size="sm"
          >
            {isResolving ? (
              'Resolving...'
            ) : (
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M3.5 7L6 9.5L10.5 4.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {hasNote ? 'Resolve with Note' : 'Mark as Resolved'}
              </span>
            )}
          </Button>
        )}
      </div>
    </Card>
  );
}
