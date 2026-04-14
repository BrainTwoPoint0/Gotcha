'use client';

import { useState, useEffect, useRef } from 'react';
import { EditorialTD, EditorialTR } from '../../components/editorial/table';
import { StatusBadge } from './status-badge';
import { TagEditor } from './tag-editor';

const MODE_LABELS: Record<string, string> = {
  FEEDBACK: 'Feedback',
  VOTE: 'Vote',
  POLL: 'Poll',
  FEATURE_REQUEST: 'Feature',
  AB: 'A/B',
  NPS: 'NPS',
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

  const modeLabel = MODE_LABELS[response.mode] ?? response.mode.toLowerCase();

  const getPreview = () => {
    if (response.vote) return response.content || response.title || null;
    if (Array.isArray(response.pollSelected) && response.pollSelected.length > 0) {
      return response.pollSelected.join(', ');
    }
    return response.content || response.title || null;
  };

  const preview = getPreview();
  const hasExpandableContent = !isGated && (preview || response.rating || response.vote);

  return (
    <>
      <EditorialTR
        className={`group ${isGated ? 'opacity-60' : 'cursor-pointer'} ${expanded ? 'bg-editorial-ink/[0.02]' : ''}`}
        onClick={() => hasExpandableContent && setExpanded(!expanded)}
      >
        {/* Response column */}
        <EditorialTD className="!py-3">
          <div className={`flex items-center gap-2.5 ${isGated ? 'select-none blur-sm' : ''}`}>
            {response.vote && (
              <span
                className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-editorial-neutral-2 ${
                  response.vote === 'UP' ? 'text-editorial-success' : 'text-editorial-alert'
                }`}
                aria-hidden="true"
              >
                <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
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
              </span>
            )}

            {response.rating && response.mode !== 'NPS' && (
              <div
                className="flex shrink-0 items-center gap-0.5"
                aria-label={`${response.rating} of 5 stars`}
              >
                {Array.from({ length: 5 }, (_, i) => (
                  <svg
                    key={i}
                    width="11"
                    height="11"
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 1.5L7.35 4.2L10.35 4.65L8.175 6.75L8.7 9.75L6 8.325L3.3 9.75L3.825 6.75L1.65 4.65L4.65 4.2L6 1.5Z"
                      fill={i < response.rating! ? 'rgb(var(--editorial-accent))' : 'none'}
                      stroke={
                        i < response.rating!
                          ? 'rgb(var(--editorial-accent))'
                          : 'rgb(var(--editorial-neutral-2))'
                      }
                      strokeWidth="0.75"
                      strokeLinejoin="round"
                    />
                  </svg>
                ))}
              </div>
            )}

            {response.rating && response.mode === 'NPS' && (
              <span className="shrink-0 font-display text-[15px] text-editorial-ink">
                {response.rating}
                <span className="text-editorial-neutral-3">/10</span>
              </span>
            )}

            {preview && (
              <span className="truncate text-[14px] leading-tight text-editorial-ink">
                {preview}
              </span>
            )}
            {!preview && !response.rating && !response.vote && (
              <span className="text-[14px] text-editorial-neutral-3">—</span>
            )}

            {hasExpandableContent && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                className={`ml-auto shrink-0 text-editorial-neutral-3/60 transition-all duration-240 ease-page-turn group-hover:text-editorial-ink ${expanded ? 'rotate-180 text-editorial-ink' : ''}`}
                aria-hidden="true"
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
        </EditorialTD>

        <EditorialTD
          className={`hidden max-w-[140px] truncate text-[13px] text-editorial-neutral-3 sm:table-cell ${isGated ? 'select-none blur-sm' : ''}`}
        >
          {response.project.name}
        </EditorialTD>

        <EditorialTD className={`hidden sm:table-cell ${isGated ? 'select-none blur-sm' : ''}`}>
          <span className="inline-flex items-center rounded-md border border-editorial-neutral-2 bg-editorial-paper px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-editorial-neutral-3">
            {modeLabel}
          </span>
        </EditorialTD>

        <EditorialTD onClick={(e) => e.stopPropagation()}>
          {!isGated ? (
            <StatusBadge
              responseId={response.id}
              status={response.status as 'NEW' | 'REVIEWED' | 'ADDRESSED' | 'ARCHIVED'}
            />
          ) : (
            <span className="select-none font-mono text-[10px] uppercase tracking-[0.14em] text-editorial-neutral-3/60 blur-sm">
              New
            </span>
          )}
        </EditorialTD>

        <EditorialTD
          className={`hidden max-w-[180px] md:table-cell ${isGated ? 'select-none blur-sm' : ''}`}
        >
          <code className="block max-w-full truncate font-mono text-[11px] text-editorial-neutral-3">
            {response.elementIdRaw}
          </code>
        </EditorialTD>

        <EditorialTD
          className={`hidden whitespace-nowrap font-mono text-[12px] tabular-nums text-editorial-neutral-3 sm:table-cell ${isGated ? 'select-none blur-sm' : ''}`}
        >
          {formatDate(new Date(response.createdAt))}
        </EditorialTD>
      </EditorialTR>

      {/* Expanded detail */}
      <tr className={`${expanded && !isGated ? '' : 'hidden'}`}>
        <td colSpan={6} className="border-b border-editorial-neutral-2 p-0">
          <div
            ref={detailRef}
            className="overflow-hidden transition-[max-height] duration-240 ease-page-turn"
            style={{ maxHeight: expanded ? `${height + 32}px` : '0px' }}
          >
            <div className="bg-editorial-ink/[0.02] px-6 py-5">
              <div className="max-w-2xl space-y-4">
                {response.rating && response.mode !== 'NPS' && (
                  <DetailRow label="Rating">
                    <span className="font-display text-[18px] text-editorial-ink">
                      {response.rating}
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-editorial-neutral-3">
                      of 5
                    </span>
                  </DetailRow>
                )}

                {response.rating && response.mode === 'NPS' && (
                  <DetailRow label="NPS">
                    <span className="font-display text-[18px] text-editorial-ink">
                      {response.rating}
                      <span className="text-editorial-neutral-3">/10</span>
                    </span>
                  </DetailRow>
                )}

                {response.vote && (
                  <DetailRow label="Vote">
                    <span
                      className={`text-[14px] ${response.vote === 'UP' ? 'text-editorial-success' : 'text-editorial-alert'}`}
                    >
                      {response.vote === 'UP' ? 'Upvote' : 'Downvote'}
                    </span>
                  </DetailRow>
                )}

                {Array.isArray(response.pollSelected) && response.pollSelected.length > 0 && (
                  <DetailRow label="Selected">
                    <div className="flex flex-wrap gap-1.5">
                      {response.pollSelected.map((opt: string) => (
                        <span
                          key={opt}
                          className="inline-flex items-center rounded-md border border-editorial-neutral-2 bg-editorial-paper px-2 py-0.5 text-[12px] text-editorial-ink"
                        >
                          {opt}
                        </span>
                      ))}
                    </div>
                  </DetailRow>
                )}

                {response.title && (
                  <DetailRow label="Title">
                    <span className="text-[14px] text-editorial-ink">{response.title}</span>
                  </DetailRow>
                )}

                {response.content && (
                  <DetailRow label="Content">
                    <p className="whitespace-pre-wrap text-[14px] leading-[1.6] text-editorial-ink">
                      {response.content}
                    </p>
                  </DetailRow>
                )}

                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-editorial-neutral-2 pt-3">
                  <span className="font-mono text-[11px] text-editorial-neutral-3">
                    {formatDateLong(new Date(response.createdAt))}
                  </span>
                  <code className="break-all font-mono text-[11px] text-editorial-neutral-3">
                    {response.elementIdRaw}
                  </code>
                </div>

                <TagEditor
                  responseId={response.id}
                  initialTags={response.tags}
                  isPro={isPro}
                  availableTags={availableTags}
                />
              </div>
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-5">
      <span className="w-20 shrink-0 pt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
        {label}
      </span>
      <div className="flex flex-1 items-center gap-2">{children}</div>
    </div>
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatDate(date: Date): string {
  const m = MONTHS[date.getMonth()];
  const d = date.getDate();
  let h = date.getHours();
  const min = date.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${m} ${d}, ${h}:${min} ${ampm}`;
}

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
