'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WebhookLogs } from './webhook-logs';

export function AddWebhookButton() {
  return (
    <Button onClick={() => window.dispatchEvent(new CustomEvent('gotcha:add-webhook'))}>
      Add Integration
    </Button>
  );
}

type WebhookType = 'custom' | 'slack' | 'discord';

interface Webhook {
  id: string;
  type: string;
  url: string;
  events: string[];
  active: boolean;
  description: string | null;
  lastTriggeredAt: string | null;
  lastStatusCode: number | null;
  failureCount: number;
  createdAt: string;
}

function SlackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 2447.6 2452.5" xmlns="http://www.w3.org/2000/svg">
      <g clipRule="evenodd" fillRule="evenodd">
        <path
          d="m897.4 0c-135.3.1-244.8 109.9-244.7 245.2-.1 135.3 109.5 245.1 244.8 245.2h244.8v-245.1c.1-135.3-109.5-245.1-244.9-245.3.1 0 .1 0 0 0m0 654h-652.6c-135.3.1-244.9 109.9-244.8 245.2-.2 135.3 109.4 245.1 244.7 245.3h652.7c135.3-.1 244.9-109.9 244.8-245.2.1-135.4-109.5-245.2-244.8-245.3z"
          fill="#36c5f0"
        />
        <path
          d="m2447.6 899.2c.1-135.3-109.5-245.1-244.8-245.2-135.3.1-244.9 109.9-244.8 245.2v245.3h244.8c135.3-.1 244.9-109.9 244.8-245.3zm-652.7 0v-654c.1-135.2-109.4-245-244.7-245.2-135.3.1-244.9 109.9-244.8 245.2v654c-.2 135.3 109.4 245.1 244.7 245.3 135.3-.1 244.9-109.9 244.8-245.3z"
          fill="#2eb67d"
        />
        <path
          d="m1550.1 2452.5c135.3-.1 244.9-109.9 244.8-245.2.1-135.3-109.5-245.1-244.8-245.2h-244.8v245.2c-.1 135.2 109.5 245 244.8 245.2zm0-654.1h652.7c135.3-.1 244.9-109.9 244.8-245.2.2-135.3-109.4-245.1-244.7-245.3h-652.7c-135.3.1-244.9 109.9-244.8 245.2-.1 135.4 109.4 245.2 244.7 245.3z"
          fill="#ecb22e"
        />
        <path
          d="m0 1553.2c-.1 135.3 109.5 245.1 244.8 245.2 135.3-.1 244.9-109.9 244.8-245.2v-245.2h-244.8c-135.3.1-244.9 109.9-244.8 245.2zm652.7 0v654c-.2 135.3 109.4 245.1 244.7 245.3 135.3-.1 244.9-109.9 244.8-245.2v-653.9c.2-135.3-109.4-245.1-244.7-245.3-135.4 0-244.9 109.8-244.8 245.1 0 0 0 .1 0 0"
          fill="#e01e5a"
        />
      </g>
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 127.14 96.36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2.03a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2.03a68.68 68.68 0 0 1-10.87 5.19 77.3 77.3 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15ZM42.45 65.69C36.18 65.69 31 60 31 53.05s5-12.68 11.45-12.68S54 46.07 53.89 53.05c0 6.95-5.11 12.64-11.44 12.64Zm42.24 0C78.41 65.69 73.25 60 73.25 53.05s5-12.68 11.44-12.68S96.23 46.07 96.12 53.05c0 6.95-5.07 12.64-11.43 12.64Z"
        fill="#5865F2"
      />
    </svg>
  );
}

function WebhookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
  );
}

const TYPE_ICONS: Record<WebhookType, (props: { className?: string }) => React.ReactNode> = {
  slack: SlackIcon,
  discord: DiscordIcon,
  custom: WebhookIcon,
};

const TYPE_CONFIG: Record<WebhookType, { label: string; placeholder: string }> = {
  slack: {
    label: 'Slack',
    placeholder: 'https://hooks.slack.com/services/...',
  },
  discord: {
    label: 'Discord',
    placeholder: 'https://discord.com/api/webhooks/...',
  },
  custom: {
    label: 'Webhook',
    placeholder: 'https://example.com/webhook',
  },
};

interface WebhookManagerProps {
  projectSlug: string;
  webhooks: Webhook[];
}

export function WebhookManager({ projectSlug, webhooks }: WebhookManagerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newType, setNewType] = useState<WebhookType | null>(null);
  const [newUrl, setNewUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    'response.created',
    'bug.created',
    'bug.resolved',
  ]);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [expandedLogs, setExpandedLogs] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, { success: boolean; statusCode: number | null; error: string | null } | null>
  >({});

  useEffect(() => {
    const handler = () => setShowAdd(true);
    window.addEventListener('gotcha:add-webhook', handler);
    return () => window.removeEventListener('gotcha:add-webhook', handler);
  }, []);

  const createWebhook = async () => {
    if (!newType) return;
    setLoading('create');
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectSlug}/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({
          url: newUrl,
          events: selectedEvents,
          description: newDescription || undefined,
          type: newType,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        if (data.webhook.secret) {
          setCreatedSecret(data.webhook.secret);
        }
        setNewUrl('');
        setNewDescription('');
        setSelectedEvents(['response.created', 'bug.created', 'bug.resolved']);
        setNewType(null);
        setShowAdd(false);
        router.refresh();
      } else {
        setError(data.error || 'Failed to create webhook');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create webhook');
    } finally {
      setLoading(null);
    }
  };

  const toggleWebhook = async (id: string, active: boolean) => {
    setLoading(id);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectSlug}/webhooks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to toggle webhook');
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle webhook');
    } finally {
      setLoading(null);
    }
  };

  const deleteWebhook = async (id: string) => {
    if (!confirm('Delete this integration? This cannot be undone.')) return;
    setLoading(id);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectSlug}/webhooks/${id}`, {
        method: 'DELETE',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to delete webhook');
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete webhook');
    } finally {
      setLoading(null);
    }
  };

  const testWebhook = async (id: string) => {
    setTestResults((prev) => ({ ...prev, [id]: null }));
    setLoading(`test-${id}`);
    try {
      const res = await fetch(`/api/projects/${projectSlug}/webhooks/${id}/test`, {
        method: 'POST',
      });
      const data = await res.json();
      setTestResults((prev) => ({
        ...prev,
        [id]: { success: data.success, statusCode: data.statusCode, error: data.error },
      }));
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        [id]: { success: false, statusCode: null, error: 'Request failed' },
      }));
    } finally {
      setLoading(null);
    }
  };

  const statusBadge = (webhook: Webhook) => {
    if (!webhook.active && webhook.failureCount >= 10) {
      return <Badge variant="destructive">Auto-disabled</Badge>;
    }
    if (!webhook.active) {
      return <Badge variant="secondary">Disabled</Badge>;
    }
    if (webhook.failureCount > 0) {
      return (
        <Badge className="border border-editorial-alert/30 bg-editorial-alert/[0.08] text-editorial-alert">
          Failing ({webhook.failureCount})
        </Badge>
      );
    }
    return <Badge className="bg-green-100 text-green-800">Active</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Error display */}
      {error && (
        <div className="bg-editorial-alert/[0.04] border border-red-200 rounded-md px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Secret display (shown after creation) */}
      {createdSecret && (
        <div className="bg-editorial-accent/[0.06] border border-amber-200 rounded-md p-4">
          <p className="text-sm font-medium text-editorial-alert mb-2">
            Webhook secret — copy it now, it won&apos;t be shown again:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-editorial-paper px-3 py-2 rounded border text-sm font-mono">
              {createdSecret}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(createdSecret);
              }}
            >
              Copy
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setCreatedSecret(null)}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Add integration flow */}
      {showAdd && !newType && (
        <div className="w-full bg-editorial-paper rounded-md border border-editorial-neutral-2 p-4 sm:p-6 space-y-4">
          <h3 className="font-medium text-editorial-ink">Choose Integration Type</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['slack', 'discord', 'custom'] as WebhookType[]).map((type) => {
              const Icon = TYPE_ICONS[type];
              return (
                <button
                  key={type}
                  onClick={() => setNewType(type)}
                  className="flex flex-col items-center gap-2 p-4 rounded-md border border-editorial-neutral-2 hover:border-editorial-ink/30 hover:bg-editorial-ink/[0.02] transition-colors"
                >
                  <Icon className="w-8 h-8 text-editorial-ink" />
                  <span className="text-sm font-medium text-editorial-ink">
                    {TYPE_CONFIG[type].label}
                  </span>
                </button>
              );
            })}
          </div>
          <Button variant="ghost" onClick={() => setShowAdd(false)}>
            Cancel
          </Button>
        </div>
      )}

      {showAdd && newType && (
        <div className="w-full bg-editorial-paper rounded-md border border-editorial-neutral-2 p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setNewType(null)}
              className="text-editorial-neutral-3/80 hover:text-editorial-neutral-3"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h3 className="font-medium text-editorial-ink">
              New {TYPE_CONFIG[newType].label} Integration
            </h3>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-editorial-neutral-3">
              {newType === 'slack'
                ? 'Slack Webhook URL'
                : newType === 'discord'
                  ? 'Discord Webhook URL'
                  : 'Endpoint URL'}
            </label>
            <Input
              type="url"
              placeholder={TYPE_CONFIG[newType].placeholder}
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-editorial-neutral-3">Description (optional)</label>
            <Input
              type="text"
              placeholder={`e.g. ${newType === 'slack' ? '#feedback channel' : newType === 'discord' ? '#feedback channel' : 'Production notifications'}`}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-editorial-neutral-3">Events</label>
            <div className="flex flex-wrap gap-3">
              {[
                { value: 'response.created', label: 'New response' },
                { value: 'bug.created', label: 'Bug reported' },
                { value: 'bug.resolved', label: 'Bug resolved' },
                { value: 'bug.updated', label: 'Bug updated' },
              ].map((event) => (
                <label key={event.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(event.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEvents((prev) => [...prev, event.value]);
                      } else {
                        setSelectedEvents((prev) => prev.filter((ev) => ev !== event.value));
                      }
                    }}
                    className="rounded border-editorial-neutral-2 text-editorial-ink focus:ring-editorial-accent/40"
                  />
                  <span className="text-sm text-editorial-ink">{event.label}</span>
                  <code className="text-xs text-editorial-neutral-3/80 bg-editorial-ink/[0.02] px-1 rounded">
                    {event.value}
                  </code>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={createWebhook}
              disabled={!newUrl || selectedEvents.length === 0 || loading === 'create'}
            >
              {loading === 'create'
                ? 'Creating...'
                : `Create ${TYPE_CONFIG[newType].label} Integration`}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setShowAdd(false);
                setNewType(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Webhook list */}
      {webhooks.length === 0 && !showAdd ? (
        <div className="bg-editorial-paper rounded-md border border-editorial-neutral-2 p-6 text-center text-editorial-neutral-3">
          <p>No integrations configured yet.</p>
          <p className="text-sm mt-1">
            Add Slack, Discord, or a custom webhook to receive real-time notifications.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className="bg-editorial-paper rounded-md border border-editorial-neutral-2"
            >
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        {(() => {
                          const Icon = TYPE_ICONS[webhook.type as WebhookType];
                          return Icon ? <Icon className="w-3.5 h-3.5" /> : null;
                        })()}
                        {TYPE_CONFIG[webhook.type as WebhookType]?.label || webhook.type}
                      </Badge>
                      {statusBadge(webhook)}
                      {webhook.description && (
                        <span className="text-sm font-medium text-editorial-ink">
                          {webhook.description}
                        </span>
                      )}
                    </div>
                    <code className="text-sm text-editorial-neutral-3 break-all">
                      {webhook.url}
                    </code>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-editorial-neutral-3">
                      <span>Events: {webhook.events.join(', ')}</span>
                      {webhook.lastTriggeredAt && (
                        <span>
                          Last triggered: {new Date(webhook.lastTriggeredAt).toLocaleDateString()}
                        </span>
                      )}
                      {webhook.lastStatusCode && <span>Last status: {webhook.lastStatusCode}</span>}
                    </div>

                    {/* Test result */}
                    {testResults[webhook.id] !== undefined && testResults[webhook.id] !== null && (
                      <div
                        className={`mt-2 text-xs px-2 py-1 rounded inline-block ${
                          testResults[webhook.id]!.success
                            ? 'bg-editorial-success/[0.06] text-editorial-success'
                            : 'bg-editorial-alert/[0.04] text-red-700'
                        }`}
                      >
                        {testResults[webhook.id]!.success
                          ? `Test passed (${testResults[webhook.id]!.statusCode})`
                          : `Test failed: ${testResults[webhook.id]!.error}`}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testWebhook(webhook.id)}
                      disabled={loading === `test-${webhook.id}`}
                    >
                      {loading === `test-${webhook.id}` ? 'Testing...' : 'Send Test'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleWebhook(webhook.id, !webhook.active)}
                      disabled={loading === webhook.id}
                    >
                      {webhook.active ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setExpandedLogs(expandedLogs === webhook.id ? null : webhook.id)
                      }
                    >
                      {expandedLogs === webhook.id ? 'Hide Logs' : 'Logs'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteWebhook(webhook.id)}
                      disabled={loading === webhook.id}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>

              {/* Delivery logs */}
              {expandedLogs === webhook.id && (
                <div className="border-t border-editorial-neutral-2">
                  <WebhookLogs projectSlug={projectSlug} webhookId={webhook.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
