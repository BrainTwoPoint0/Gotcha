'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EditorialButton } from '../../../components/editorial/button';
import {
  EditorialCard,
  EditorialCardBody,
  EditorialCardHeader,
} from '../../../components/editorial/card';
import { EditorialTextarea } from '../../../components/editorial/form-field';

const STATUSES = [
  { value: 'OPEN', label: 'Open' },
  { value: 'INVESTIGATING', label: 'Investigating' },
  { value: 'FIXING', label: 'Fixing' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'WONT_FIX', label: "Won't fix" },
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

const SELECT_TRIGGER_CLASS =
  'h-10 w-full rounded-md border-editorial-neutral-2 bg-editorial-paper text-[13px] text-editorial-ink focus:border-editorial-accent focus:ring-2 focus:ring-editorial-accent/25';

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
      {children}
    </span>
  );
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

  // Don't clobber optimistic local edits on re-render; only sync when the
  // underlying server value genuinely changes (matches status-badge pattern).
  useEffect(() => {
    if (!isSaving) setStatus(currentStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStatus]);
  useEffect(() => {
    if (!isSaving) setPriority(currentPriority);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <EditorialCard>
      <EditorialCardHeader>
        <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
          Actions
        </h2>
      </EditorialCardHeader>
      <EditorialCardBody className="space-y-5">
        {error && (
          <div
            role="alert"
            className="border-l-2 border-editorial-alert bg-editorial-alert/[0.04] px-4 py-3 text-[13px] text-editorial-alert"
          >
            {error}
          </div>
        )}

        <div>
          <FieldLabel>Status</FieldLabel>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger aria-label="Status" className={SELECT_TRIGGER_CLASS}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="editorial border-editorial-neutral-2 bg-editorial-paper">
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <FieldLabel>Priority</FieldLabel>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger aria-label="Priority" className={SELECT_TRIGGER_CLASS}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="editorial border-editorial-neutral-2 bg-editorial-paper">
              {PRIORITIES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasChanges && (
          <EditorialButton
            onClick={handleSave}
            disabled={isSaving}
            variant="ink"
            size="sm"
            className="w-full"
          >
            {isSaving ? 'Saving…' : 'Save changes'}
          </EditorialButton>
        )}

        <div className="space-y-3 border-t border-editorial-neutral-2 pt-4">
          <div>
            <FieldLabel>Note</FieldLabel>
            <EditorialTextarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Add a note or resolution message…"
              rows={3}
              maxLength={5000}
              className="min-h-[88px] text-[13px]"
            />
          </div>

          {reporterEmail && (
            <label className="group flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={isExternal}
                onChange={(e) => setIsExternal(e.target.checked)}
                className="h-4 w-4 rounded border-editorial-neutral-2 text-editorial-accent focus:ring-editorial-accent/40"
              />
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-editorial-neutral-3 transition-colors group-hover:text-editorial-ink">
                Also email to <span className="text-editorial-ink">{reporterEmail}</span>
              </span>
            </label>
          )}

          <EditorialButton
            onClick={handleAddNote}
            disabled={isAddingNote || !hasNote}
            variant="ghost"
            size="sm"
            className="w-full"
          >
            {isAddingNote ? 'Adding…' : 'Add note'}
          </EditorialButton>

          {!isResolved && (
            <EditorialButton
              onClick={handleResolve}
              disabled={isResolving}
              variant="ghost"
              size="sm"
              className="w-full border-editorial-success/30 text-editorial-success hover:bg-editorial-success/[0.05] hover:text-editorial-success"
            >
              {isResolving ? (
                'Resolving…'
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path
                      d="M3.5 7L6 9.5L10.5 4.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {hasNote ? 'Resolve with note' : 'Mark as resolved'}
                </>
              )}
            </EditorialButton>
          )}
        </div>
      </EditorialCardBody>
    </EditorialCard>
  );
}
