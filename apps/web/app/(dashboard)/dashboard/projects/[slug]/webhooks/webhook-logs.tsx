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

  const fetchLogs = useCallback(async (p: number) => {
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
  }, [projectSlug, webhookId]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchLogs(next);
  };

  if (loading && logs.length === 0) {
    return <div className="p-4 text-sm text-gray-500">Loading logs...</div>;
  }

  if (logs.length === 0) {
    return <div className="p-4 text-sm text-gray-500">No delivery logs yet.</div>;
  }

  return (
    <div className="p-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="pb-2 font-medium">Time</th>
            <th className="pb-2 font-medium">Event</th>
            <th className="pb-2 font-medium">Status</th>
            <th className="pb-2 font-medium">Duration</th>
            <th className="pb-2 font-medium">Result</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="py-2 text-gray-600">
                {new Date(log.createdAt).toLocaleString()}
              </td>
              <td className="py-2">
                <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{log.event}</code>
              </td>
              <td className="py-2">
                {log.statusCode ? (
                  <span
                    className={
                      log.success ? 'text-green-700' : 'text-red-700'
                    }
                  >
                    {log.statusCode}
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="py-2 text-gray-600">
                {log.responseMs ? `${log.responseMs}ms` : '—'}
              </td>
              <td className="py-2">
                {log.success ? (
                  <span className="text-green-700 text-xs">OK</span>
                ) : (
                  <span className="text-red-700 text-xs" title={log.error || undefined}>
                    {log.error || 'Failed'}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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
