'use client';

import { useState, useEffect, useRef } from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from './status-badge';
import { TagEditor } from './tag-editor';

// Mode badge styling — desaturated, muted tones matching Linear's label system
const MODE_CONFIG: Record<string, { label: string; className: string }> = {
  FEEDBACK: {
    label: 'Feedback',
    className: 'bg-slate-50 text-slate-600 border-slate-200/80',
  },
  VOTE: {
    label: 'Vote',
    className: 'bg-emerald-50/80 text-emerald-700 border-emerald-200/60',
  },
  POLL: {
    label: 'Poll',
    className: 'bg-violet-50/80 text-violet-700 border-violet-200/60',
  },
  FEATURE_REQUEST: {
    label: 'Feature',
    className: 'bg-amber-50/80 text-amber-700 border-amber-200/60',
  },
  AB: {
    label: 'A/B',
    className: 'bg-rose-50/80 text-rose-700 border-rose-200/60',
  },
  NPS: {
    label: 'NPS',
    className: 'bg-teal-50/80 text-teal-700 border-teal-200/60',
  },
};

interface ResponseRowProps {
  response: {
    id: string;
    mode: string;
    content: string | null;
    title: string | null;
    rating: number | null;
    vote: string | null;
    pollSelected: unknown;
    elementIdRaw: string;
    gated: boolean;
    status: string;
    tags: string[];
    createdAt: Date;
    project: { name: string; slug: string };
  };
  isGated: boolean;
  isPro: boolean;
  availableTags: { tag: string; count: number }[];
}

export function ResponseRow({ response, isGated, isPro, availableTags }: ResponseRowProps) {
  const [expanded, setExpanded] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (detailRef.current) {
      setHeight(detailRef.current.scrollHeight);
    }
  }, [expanded]);

  const modeConfig = MODE_CONFIG[response.mode] || {
    label: response.mode.toLowerCase(),
    className: 'bg-gray-50 text-gray-600 border-gray-200/80',
  };

  // Format the response preview text
  const getPreview = () => {
    if (response.vote) {
      return response.content || response.title || null;
    }
    if (Array.isArray(response.pollSelected) && response.pollSelected.length > 0) {
      return response.pollSelected.join(', ');
    }
    return response.content || response.title || null;
  };

  const preview = getPreview();
  const hasExpandableContent = !isGated && (preview || response.rating || response.vote);

  return (
    <>
      <TableRow
        className={`
          group transition-colors duration-100
          ${isGated ? 'opacity-60' : 'cursor-pointer'}
          ${expanded ? 'bg-gray-50/80' : isGated ? '' : 'hover:bg-gray-50/50'}
        `}
        onClick={() => hasExpandableContent && setExpanded(!expanded)}
      >
        {/* Response column */}
        <TableCell className="!py-2">
          <div className={`flex items-center gap-2.5 ${isGated ? 'blur-sm select-none' : ''}`}>
            {/* Vote indicator */}
            {response.vote && (
              <div
                className={`
                flex items-center justify-center w-6 h-6 rounded-full shrink-0
                ${
                  response.vote === 'UP'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-red-50 text-red-500'
                }
              `}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  {response.vote === 'UP' ? (
                    <path
                      d="M7 3L7 11M7 3L4 6M7 3L10 6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : (
                    <path
                      d="M7 11L7 3M7 11L4 8M7 11L10 8"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </svg>
              </div>
            )}

            {/* Rating stars (feedback) */}
            {response.rating && response.mode !== 'NPS' && (
              <div className="flex items-center gap-0.5 shrink-0">
                {Array.from({ length: 5 }, (_, i) => (
                  <svg key={i} width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M6 1.5L7.35 4.2L10.35 4.65L8.175 6.75L8.7 9.75L6 8.325L3.3 9.75L3.825 6.75L1.65 4.65L4.65 4.2L6 1.5Z"
                      fill={i < response.rating! ? '#F59E0B' : 'none'}
                      stroke={i < response.rating! ? '#F59E0B' : '#D1D5DB'}
                      strokeWidth="0.75"
                      strokeLinejoin="round"
                    />
                  </svg>
                ))}
              </div>
            )}

            {/* NPS score */}
            {response.rating && response.mode === 'NPS' && (
              <span className="text-sm font-medium text-teal-600 shrink-0">
                {response.rating}/10
              </span>
            )}

            {/* Preview text */}
            {preview && (
              <span className="text-sm text-gray-700 truncate leading-tight">{preview}</span>
            )}
            {!preview && !response.rating && !response.vote && (
              <span className="text-sm text-gray-400">—</span>
            )}

            {/* Expand chevron */}
            {hasExpandableContent && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className={`
                  shrink-0 ml-auto text-gray-300
                  transition-all duration-200 ease-out
                  group-hover:text-gray-500
                  ${expanded ? 'rotate-180 text-gray-500' : ''}
                `}
              >
                <path
                  d="M4.5 6.5L8 10L11.5 6.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </TableCell>

        {/* Project */}
        <TableCell
          className={`!py-2 hidden sm:table-cell text-sm text-gray-500 max-w-[120px] truncate ${isGated ? 'blur-sm select-none' : ''}`}
        >
          {response.project.name}
        </TableCell>

        {/* Type badge */}
        <TableCell className={`!py-2 hidden sm:table-cell ${isGated ? 'blur-sm select-none' : ''}`}>
          <Badge variant="outline" className={modeConfig.className}>
            {modeConfig.label}
          </Badge>
        </TableCell>

        {/* Status */}
        <TableCell className="!py-2" onClick={(e) => e.stopPropagation()}>
          {!isGated ? (
            <StatusBadge
              responseId={response.id}
              status={response.status as 'NEW' | 'REVIEWED' | 'ADDRESSED' | 'ARCHIVED'}
            />
          ) : (
            <span className="blur-sm select-none text-xs text-gray-400">New</span>
          )}
        </TableCell>

        {/* Element */}
        <TableCell
          className={`!py-2 hidden md:table-cell max-w-[160px] ${isGated ? 'blur-sm select-none' : ''}`}
        >
          <code className="text-xs text-gray-400 font-mono bg-gray-50 px-1.5 py-0.5 rounded truncate block max-w-full">
            {response.elementIdRaw}
          </code>
        </TableCell>

        {/* Date */}
        <TableCell
          className={`!py-2 hidden sm:table-cell text-sm tabular-nums text-gray-400 whitespace-nowrap ${isGated ? 'blur-sm select-none' : ''}`}
        >
          {formatDate(new Date(response.createdAt))}
        </TableCell>

        {/* Gated overlay */}
        {isGated && (
          <TableCell className="absolute inset-0 flex items-center justify-center">
            <span className="text-[11px] text-gray-400 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md border border-gray-200/60 shadow-sm">
              Upgrade to view
            </span>
          </TableCell>
        )}
      </TableRow>

      {/* Expanded detail panel */}
      <TableRow
        className={`
          border-0
          ${expanded && !isGated ? '' : 'hidden'}
        `}
      >
        <TableCell colSpan={6} className="p-0 border-0">
          <div
            ref={detailRef}
            className="overflow-hidden transition-all duration-200 ease-out"
            style={{ maxHeight: expanded ? `${height + 32}px` : '0px' }}
          >
            <div className="px-3 py-3 sm:px-6 sm:py-4 bg-gradient-to-b from-gray-50/80 to-white border-b border-gray-100">
              <div className="max-w-2xl space-y-3">
                {/* Rating detail */}
                {response.rating && response.mode !== 'NPS' && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium uppercase tracking-wider text-gray-400 w-16">
                      Rating
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }, (_, i) => (
                          <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path
                              d="M7 1.75L8.575 4.9L12.075 5.425L9.5375 7.875L10.15 11.375L7 9.7125L3.85 11.375L4.4625 7.875L1.925 5.425L5.425 4.9L7 1.75Z"
                              fill={i < response.rating! ? '#F59E0B' : 'none'}
                              stroke={i < response.rating! ? '#F59E0B' : '#E5E7EB'}
                              strokeWidth="0.75"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">{response.rating} of 5</span>
                    </div>
                  </div>
                )}

                {/* NPS score detail */}
                {response.rating && response.mode === 'NPS' && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium uppercase tracking-wider text-gray-400 w-16">
                      NPS
                    </span>
                    <span className="text-sm font-medium text-teal-600">{response.rating}/10</span>
                  </div>
                )}

                {/* Vote detail */}
                {response.vote && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium uppercase tracking-wider text-gray-400 w-16">
                      Vote
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        response.vote === 'UP' ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {response.vote === 'UP' ? 'Upvote' : 'Downvote'}
                    </span>
                  </div>
                )}

                {/* Poll selections */}
                {Array.isArray(response.pollSelected) && response.pollSelected.length > 0 && (
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-medium uppercase tracking-wider text-gray-400 w-16 pt-0.5">
                      Selected
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {response.pollSelected.map((opt: string) => (
                        <Badge
                          key={opt}
                          variant="outline"
                          className="bg-violet-50/60 text-violet-700 border-violet-200/60 text-xs font-normal"
                        >
                          {opt}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Title */}
                {response.title && (
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-medium uppercase tracking-wider text-gray-400 w-16 pt-0.5">
                      Title
                    </span>
                    <span className="text-sm text-gray-800 font-medium">{response.title}</span>
                  </div>
                )}

                {/* Content */}
                {response.content && (
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-medium uppercase tracking-wider text-gray-400 w-16 pt-0.5">
                      Content
                    </span>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {response.content}
                    </p>
                  </div>
                )}

                <Separator className="my-2" />

                {/* Metadata row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <div className="flex items-center gap-1.5">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      className="text-gray-300"
                    >
                      <path
                        d="M6 3V6L8 7.5"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeLinecap="round"
                      />
                      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1" />
                    </svg>
                    <span className="text-[11px] text-gray-400">
                      {formatDateLong(new Date(response.createdAt))}
                    </span>
                  </div>
                  <code className="text-[11px] text-gray-400 font-mono break-all">
                    {response.elementIdRaw}
                  </code>
                </div>

                {/* Tags */}
                <TagEditor
                  responseId={response.id}
                  initialTags={response.tags}
                  isPro={isPro}
                  availableTags={availableTags}
                />
              </div>
            </div>
          </div>
        </TableCell>
      </TableRow>
    </>
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Compact date formatter — "Mar 4, 2:30 PM" (locale-independent to avoid hydration mismatch) */
function formatDate(date: Date): string {
  const m = MONTHS[date.getMonth()];
  const d = date.getDate();
  let h = date.getHours();
  const min = date.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${m} ${d}, ${h}:${min} ${ampm}`;
}

/** Long format — "Wed, Mar 4, 2026, 2:30 PM" */
function formatDateLong(date: Date): string {
  const day = DAYS[date.getDay()];
  const m = MONTHS[date.getMonth()];
  const d = date.getDate();
  const y = date.getFullYear();
  let h = date.getHours();
  const min = date.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${day}, ${m} ${d}, ${y}, ${h}:${min} ${ampm}`;
}
