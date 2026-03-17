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

// Desaturated, professional status colors — inspired by Linear's status system
const STATUS_CONFIG = {
  NEW: {
    label: 'New',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="5.5" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="3 2" />
      </svg>
    ),
    textClass: 'text-blue-600',
    bgClass: 'bg-blue-50/80 border-blue-200/60 hover:bg-blue-100/80 hover:border-blue-300/60',
  },
  REVIEWED: {
    label: 'Reviewed',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="5.5" stroke="#D97706" strokeWidth="1.5" />
        <circle cx="7" cy="7" r="2.5" fill="#D97706" />
      </svg>
    ),
    textClass: 'text-amber-700',
    bgClass: 'bg-amber-50/80 border-amber-200/60 hover:bg-amber-100/80 hover:border-amber-300/60',
  },
  ADDRESSED: {
    label: 'Addressed',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="5.5" stroke="#059669" strokeWidth="1.5" />
        <path
          d="M4.5 7L6.5 9L9.5 5"
          stroke="#059669"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    textClass: 'text-emerald-700',
    bgClass:
      'bg-emerald-50/80 border-emerald-200/60 hover:bg-emerald-100/80 hover:border-emerald-300/60',
  },
  ARCHIVED: {
    label: 'Archived',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="5.5" stroke="#9CA3AF" strokeWidth="1.5" />
        <path d="M5 7H9" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    textClass: 'text-gray-500',
    bgClass: 'bg-gray-50/80 border-gray-200/60 hover:bg-gray-100/80 hover:border-gray-300/60',
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

  // Sync state when server data changes (e.g. pagination)
  useEffect(() => {
    setStatus(initialStatus);
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
          className={`
            inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium
            border cursor-pointer
            transition-all duration-150 ease-out
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-1
            active:scale-[0.97]
            ${config.bgClass} ${config.textClass}
            ${isUpdating ? 'opacity-40 pointer-events-none' : ''}
          `}
          disabled={isUpdating}
        >
          {config.icon}
          <span className="hidden sm:inline-block sm:w-[58px]">{config.label}</span>
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            className="ml-0.5 opacity-40 hidden sm:block"
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
      <DropdownMenuContent align="start" className="w-44 p-1">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-gray-400 font-medium px-2 py-1">
          Set status
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.keys(STATUS_CONFIG) as Status[]).map((s) => {
          const c = STATUS_CONFIG[s];
          const isActive = s === status;
          return (
            <DropdownMenuItem
              key={s}
              onClick={() => handleStatusChange(s)}
              className={`
                flex items-center gap-2.5 cursor-pointer rounded-md px-2 py-1.5
                transition-colors duration-100
                ${isActive ? 'bg-gray-100' : ''}
              `}
            >
              {c.icon}
              <span
                className={`text-sm ${isActive ? 'font-medium text-gray-900' : 'text-gray-600'}`}
              >
                {c.label}
              </span>
              {isActive && (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  className="ml-auto text-gray-400"
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
