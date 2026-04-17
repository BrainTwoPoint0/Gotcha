'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface LogEntry {
  id: string;
  event: string;
  statusCode: number | null;
  responseMs: number | null;
  error: string | null;
  success: boolean;
  createdAt: string;
}

interface WebhookLogsProps {
  projectSlug: string;
  webhookId: string;
}

export function WebhookLogs({ projectSlug, webhookId }: WebhookLogsProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(
    async (p: number) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/projects/${projectSlug}/webhooks/${webhookId}/logs?page=${p}&limit=10`
        );
        const data = await res.json();
        if (p === 1) {
          setLogs(data.logs);
        } else {
          setLogs((prev) => [...prev, ...data.logs]);
        }
        setHasMore(data.pagination.hasMore);
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      } finally {
        setLoading(false);
      }
    },
    [projectSlug, webhookId]
  );

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchLogs(next);
  };

  if (loading && logs.length === 0) {
    return <div className="p-4 text-[13px] text-editorial-neutral-3">Loading logs…</div>;
  }

  if (logs.length === 0) {
    return <div className="p-4 text-[13px] text-editorial-neutral-3">No delivery logs yet.</div>;
  }

  return (
    <div className="p-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-editorial-neutral-2">
              <th className="py-2.5 pr-4 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
                Time
              </th>
              <th className="py-2.5 pr-4 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
                Event
              </th>
              <th className="py-2.5 pr-4 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
                Status
              </th>
              <th className="py-2.5 pr-4 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
                Duration
              </th>
              <th className="py-2.5 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
                Result
              </th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-editorial-neutral-2">
                <td className="py-2.5 pr-4 font-mono text-[12px] tabular-nums text-editorial-neutral-3">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="py-2.5 pr-4">
                  <code className="rounded-sm bg-editorial-ink/[0.04] px-1.5 py-0.5 font-mono text-[11px] text-editorial-ink">
                    {log.event}
                  </code>
                </td>
                <td className="py-2.5 pr-4">
                  {log.statusCode ? (
                    <span
                      className={`font-mono text-[13px] tabular-nums ${log.success ? 'text-editorial-success' : 'text-editorial-alert'}`}
                    >
                      {log.statusCode}
                    </span>
                  ) : (
                    <span className="text-editorial-neutral-3">—</span>
                  )}
                </td>
                <td className="py-2.5 pr-4 font-mono text-[12px] tabular-nums text-editorial-neutral-3">
                  {log.responseMs ? `${log.responseMs}ms` : '—'}
                </td>
                <td className="py-2.5">
                  {log.success ? (
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-editorial-success">
                      OK
                    </span>
                  ) : (
                    <span
                      className="font-mono text-[10px] uppercase tracking-[0.14em] text-editorial-alert"
                      title={log.error || undefined}
                    >
                      {log.error || 'Failed'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="mt-3 text-center">
          <Button variant="ghost" size="sm" onClick={loadMore} disabled={loading}>
            {loading ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  );
}
