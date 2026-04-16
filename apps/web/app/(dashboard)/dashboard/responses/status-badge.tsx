'use client';

import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

// Triage = the inbox states. Lifecycle = the Canny-style loop that's
// surfaced on the public roadmap and triggers the notify-back email when
// a row hits SHIPPED. The dropdown groups them under separate labels so
// admins don't accidentally treat triage statuses as commitments.
const STATUS_CONFIG = {
  NEW: {
    label: 'New',
    icon: (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <circle
          cx="5"
          cy="5"
          r="3.75"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeDasharray="2.5 1.5"
        />
      </svg>
    ),
    className: 'text-editorial-accent',
  },
  REVIEWED: {
    label: 'Reviewed',
    icon: (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <circle cx="5" cy="5" r="3.75" stroke="currentColor" strokeWidth="1.25" />
        <circle cx="5" cy="5" r="1.75" fill="currentColor" />
      </svg>
    ),
    className: 'text-editorial-neutral-3',
  },
  ADDRESSED: {
    label: 'Addressed',
    icon: (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <circle cx="5" cy="5" r="3.75" stroke="currentColor" strokeWidth="1.25" />
        <path
          d="M3.25 5L4.5 6.25L6.75 3.75"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    className: 'text-editorial-success',
  },
  ARCHIVED: {
    label: 'Archived',
    icon: (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <circle cx="5" cy="5" r="3.75" stroke="currentColor" strokeWidth="1.25" />
        <path d="M3.5 5H6.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </svg>
    ),
    className: 'text-editorial-neutral-3/70',
  },
  UNDER_REVIEW: {
    label: 'Under review',
    icon: (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <circle cx="5" cy="5" r="3.75" stroke="currentColor" strokeWidth="1.25" />
      </svg>
    ),
    className: 'text-editorial-neutral-3',
  },
  PLANNED: {
    label: 'Planned',
    icon: (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <circle
          cx="5"
          cy="5"
          r="3.75"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeDasharray="1.5 1.25"
        />
      </svg>
    ),
    className: 'text-editorial-accent',
  },
  IN_PROGRESS: {
    label: 'In progress',
    icon: (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <circle cx="5" cy="5" r="3.75" stroke="currentColor" strokeWidth="1.25" />
        <path
          d="M5 1.25 A3.75 3.75 0 0 1 8.75 5"
          stroke="currentColor"
          strokeWidth="1.25"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    ),
    className: 'text-editorial-accent',
  },
  SHIPPED: {
    label: 'Shipped',
    icon: (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <circle
          cx="5"
          cy="5"
          r="3.75"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.25"
        />
        <path
          d="M3.25 5L4.5 6.25L6.75 3.75"
          stroke="#FAF8F4"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    className: 'text-editorial-success',
  },
  DECLINED: {
    label: 'Declined',
    icon: (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <circle cx="5" cy="5" r="3.75" stroke="currentColor" strokeWidth="1.25" />
        <path d="M3.5 5H6.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </svg>
    ),
    className: 'text-editorial-neutral-3/70',
  },
} as const;

type Status = keyof typeof STATUS_CONFIG;

const TRIAGE_GROUP: Status[] = ['NEW', 'REVIEWED', 'ADDRESSED', 'ARCHIVED'];
const LIFECYCLE_GROUP: Status[] = ['UNDER_REVIEW', 'PLANNED', 'IN_PROGRESS', 'SHIPPED', 'DECLINED'];

const NOTE_MAX_LEN = 280;

interface StatusBadgeProps {
  responseId: string;
  status: Status;
}

export function StatusBadge({ responseId, status: initialStatus }: StatusBadgeProps) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [isUpdating, setIsUpdating] = useState(false);

  // Compose-mode state for the SHIPPED note. We don't open a separate modal
  // for the rest of the dropdown — the note prompt is inline-only and shows
  // when the admin selects SHIPPED. Cancelling reverts the optimistic flip.
  const [composing, setComposing] = useState<{ from: Status } | null>(null);
  const [note, setNote] = useState('');

  // Sync from parent when prop changes (e.g., pagination or router.refresh),
  // but never clobber an in-flight optimistic update — the PATCH's rollback
  // is the source of truth while a request is pending.
  useEffect(() => {
    if (!isUpdating && !composing) {
      setStatus(initialStatus);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStatus]);

  const config = STATUS_CONFIG[status];

  const performUpdate = async (newStatus: Status, previousStatus: Status, body: object) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/responses/${responseId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setStatus(previousStatus);
      }
    } catch {
      setStatus(previousStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = async (newStatus: Status) => {
    if (newStatus === status) return;
    const previousStatus = status;

    // SHIPPED transitions get an inline note prompt before the PATCH so the
    // admin can inject one line of context into the notify-back email.
    if (newStatus === 'SHIPPED') {
      setStatus(newStatus);
      setComposing({ from: previousStatus });
      setNote('');
      return;
    }

    setStatus(newStatus);
    await performUpdate(newStatus, previousStatus, { status: newStatus });
  };

  const handleSendShipped = async () => {
    if (!composing) return;
    const previousStatus = composing.from;
    setComposing(null);
    const trimmed = note.trim();
    await performUpdate('SHIPPED', previousStatus, {
      status: 'SHIPPED',
      ...(trimmed.length > 0 && { note: trimmed.slice(0, NOTE_MAX_LEN) }),
    });
  };

  const handleCancelShipped = () => {
    if (!composing) return;
    setStatus(composing.from);
    setComposing(null);
    setNote('');
  };

  const renderItem = (s: Status) => {
    const c = STATUS_CONFIG[s];
    const isActive = s === status;
    return (
      <DropdownMenuItem
        key={s}
        onClick={() => handleStatusChange(s)}
        className={`flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-[13px] transition-colors ${isActive ? 'bg-editorial-ink/[0.04]' : ''}`}
      >
        <span className={c.className}>{c.icon}</span>
        <span className={isActive ? 'text-editorial-ink' : 'text-editorial-neutral-3'}>
          {c.label}
        </span>
        {isActive && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 14 14"
            fill="none"
            className="ml-auto text-editorial-accent"
            aria-hidden="true"
          >
            <path
              d="M3.5 7L6 9.5L10.5 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </DropdownMenuItem>
    );
  };

  return (
    <div className="relative inline-flex flex-col items-start gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={`inline-flex items-center gap-2 rounded-md border border-editorial-neutral-2 bg-editorial-paper px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors duration-240 ease-page-turn hover:bg-editorial-ink/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-editorial-accent/40 ${config.className} ${isUpdating ? 'pointer-events-none opacity-50' : ''}`}
            disabled={isUpdating || composing !== null}
            aria-label={`Status: ${config.label}. Click to change.`}
          >
            {config.icon}
            {/* Fixed width so every badge in the column aligns identically
                regardless of label length. Longer labels (Under review,
                In progress) truncate with ellipsis — the full text stays
                available via the trigger's aria-label + title for
                screen readers and hover. */}
            <span
              title={config.label}
              className="hidden overflow-hidden text-left sm:inline-block sm:w-[88px] sm:truncate sm:whitespace-nowrap"
            >
              {config.label}
            </span>
            <svg
              width="8"
              height="8"
              viewBox="0 0 10 10"
              fill="none"
              className="hidden opacity-50 sm:block"
              aria-hidden="true"
            >
              <path
                d="M3 4L5 6L7 4"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="editorial w-56 rounded-md border-editorial-neutral-2 bg-editorial-paper p-1"
        >
          <DropdownMenuLabel className="px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
            Inbox
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-editorial-neutral-2" />
          {TRIAGE_GROUP.map(renderItem)}
          <DropdownMenuLabel className="mt-1 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
            Roadmap
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-editorial-neutral-2" />
          {LIFECYCLE_GROUP.map(renderItem)}
        </DropdownMenuContent>
      </DropdownMenu>

      {composing && (
        <div className="z-30 w-72 rounded-md border border-editorial-neutral-2 bg-editorial-paper p-3 shadow-sm">
          <label
            htmlFor={`shipped-note-${responseId}`}
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3"
          >
            Note (optional, sent to submitter)
          </label>
          <textarea
            id={`shipped-note-${responseId}`}
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX_LEN))}
            placeholder="One line of context — what you shipped, where to find it…"
            className="mt-2 h-16 w-full resize-none rounded-md border border-editorial-neutral-2 bg-editorial-paper px-2 py-1.5 font-sans text-[13px] text-editorial-ink placeholder:text-editorial-neutral-3/70 focus:border-editorial-accent focus:outline-none"
            autoFocus
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="font-mono text-[10px] text-editorial-neutral-3">
              {note.length}/{NOTE_MAX_LEN}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancelShipped}
                className="rounded-md border border-editorial-neutral-2 bg-editorial-paper px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-editorial-neutral-3 transition-colors hover:text-editorial-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendShipped}
                className="rounded-md bg-editorial-ink px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-editorial-paper transition-colors hover:bg-editorial-accent"
              >
                Mark shipped
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
