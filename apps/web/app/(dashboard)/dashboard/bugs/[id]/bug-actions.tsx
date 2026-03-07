'use client';

import { useState } from 'react';
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

export function BugActions({ bugId, currentStatus, currentPriority, reporterEmail }: BugActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [priority, setPriority] = useState(currentPriority);
  const [resolutionNote, setResolutionNote] = useState('');
  const [reporterMessage, setReporterMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  const hasChanges = status !== currentStatus || priority !== currentPriority;

  async function handleSave() {
    setIsSaving(true);
    try {
      await fetch(`/api/bugs/${bugId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, priority }),
      });
      router.refresh();
    } catch (err) {
      console.error('Failed to update bug:', err);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleResolve() {
    setIsResolving(true);
    try {
      await fetch(`/api/bugs/${bugId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolutionNote: resolutionNote || undefined,
          reporterMessage: reporterMessage || undefined,
        }),
      });
      router.refresh();
    } catch (err) {
      console.error('Failed to resolve bug:', err);
    } finally {
      setIsResolving(false);
    }
  }

  const isResolved = currentStatus === 'RESOLVED' || currentStatus === 'CLOSED';

  return (
    <Card className="p-5">
      <h2 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-4">Actions</h2>

      <div className="space-y-4">
        <div>
          <label className="text-[11px] text-gray-400 block mb-1.5">Status</label>
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
          <label className="text-[11px] text-gray-400 block mb-1.5">Priority</label>
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
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full"
            size="sm"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}

        {!isResolved && (
          <>
            <div className="border-t border-gray-100 pt-4">
              <label className="text-[11px] text-gray-400 block mb-1.5">
                Internal Note
              </label>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="How was this resolved? (internal only)"
                rows={2}
                className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 resize-none transition-colors"
              />
            </div>

            {reporterEmail && (
              <div>
                <label className="text-[11px] text-gray-400 block mb-1.5">
                  Message to Reporter
                  <span className="text-gray-300 ml-1">({reporterEmail})</span>
                </label>
                <textarea
                  value={reporterMessage}
                  onChange={(e) => setReporterMessage(e.target.value)}
                  placeholder="Let them know it's been fixed..."
                  rows={2}
                  className="w-full text-sm border border-blue-200/60 rounded-md px-3 py-2 text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-300 resize-none transition-colors bg-blue-50/30"
                />
              </div>
            )}

            <Button
              onClick={handleResolve}
              disabled={isResolving}
              variant="outline"
              className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
              size="sm"
            >
              {isResolving ? (
                'Resolving...'
              ) : (
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3.5 7L6 9.5L10.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Mark as Resolved
                </span>
              )}
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
