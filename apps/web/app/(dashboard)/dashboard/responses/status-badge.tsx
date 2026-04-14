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
} as const;

type Status = keyof typeof STATUS_CONFIG;

interface StatusBadgeProps {
  responseId: string;
  status: Status;
}

export function StatusBadge({ responseId, status: initialStatus }: StatusBadgeProps) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync from parent when prop changes (e.g., pagination or router.refresh),
  // but never clobber an in-flight optimistic update — the PATCH's rollback
  // is the source of truth while a request is pending.
  useEffect(() => {
    if (!isUpdating) {
      setStatus(initialStatus);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStatus]);

  const config = STATUS_CONFIG[status];

  const handleStatusChange = async (newStatus: Status) => {
    if (newStatus === status) return;

    const previousStatus = status;
    setStatus(newStatus);
    setIsUpdating(true);

    try {
      const res = await fetch(`/api/responses/${responseId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({ status: newStatus }),
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`inline-flex items-center gap-2 rounded-md border border-editorial-neutral-2 bg-editorial-paper px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors duration-240 ease-page-turn hover:bg-editorial-ink/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-editorial-accent/40 ${config.className} ${isUpdating ? 'pointer-events-none opacity-50' : ''}`}
          disabled={isUpdating}
        >
          {config.icon}
          <span className="hidden sm:inline-block sm:w-[60px] text-left">{config.label}</span>
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
        className="editorial w-48 rounded-md border-editorial-neutral-2 bg-editorial-paper p-1"
      >
        <DropdownMenuLabel className="px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
          Set status
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-editorial-neutral-2" />
        {(Object.keys(STATUS_CONFIG) as Status[]).map((s) => {
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
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
