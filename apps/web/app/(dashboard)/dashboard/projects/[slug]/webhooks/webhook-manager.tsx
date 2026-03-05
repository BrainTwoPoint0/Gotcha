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

const TYPE_CONFIG: Record<WebhookType, { label: string; icon: string; placeholder: string }> = {
  slack: {
    label: 'Slack',
    icon: '#',
    placeholder: 'https://hooks.slack.com/services/...',
  },
  discord: {
    label: 'Discord',
    icon: '🎮',
    placeholder: 'https://discord.com/api/webhooks/...',
  },
  custom: {
    label: 'Webhook',
    icon: '🔗',
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
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [expandedLogs, setExpandedLogs] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; statusCode: number | null; error: string | null } | null>>({});

  useEffect(() => {
    const handler = () => setShowAdd(true);
    window.addEventListener('gotcha:add-webhook', handler);
    return () => window.removeEventListener('gotcha:add-webhook', handler);
  }, []);

  const createWebhook = async () => {
    if (!newType) return;
    setLoading('create');
    try {
      const res = await fetch(`/api/projects/${projectSlug}/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: newUrl,
          events: ['response.created'],
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
        setNewType(null);
        setShowAdd(false);
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to create webhook:', error);
    } finally {
      setLoading(null);
    }
  };

  const toggleWebhook = async (id: string, active: boolean) => {
    setLoading(id);
    try {
      await fetch(`/api/projects/${projectSlug}/webhooks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      });
      router.refresh();
    } catch (error) {
      console.error('Failed to toggle webhook:', error);
    } finally {
      setLoading(null);
    }
  };

  const deleteWebhook = async (id: string) => {
    if (!confirm('Delete this integration? This cannot be undone.')) return;
    setLoading(id);
    try {
      await fetch(`/api/projects/${projectSlug}/webhooks/${id}`, {
        method: 'DELETE',
      });
      router.refresh();
    } catch (error) {
      console.error('Failed to delete webhook:', error);
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
      return <Badge className="bg-amber-100 text-amber-800">Failing ({webhook.failureCount})</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">Active</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Secret display (shown after creation) */}
      {createdSecret && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm font-medium text-amber-800 mb-2">
            Webhook secret — copy it now, it won&apos;t be shown again:
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white px-3 py-2 rounded border text-sm font-mono">
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
        <div className="w-full bg-white rounded-lg border border-gray-200 p-4 sm:p-6 space-y-4">
          <h3 className="font-medium text-gray-900">Choose Integration Type</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['slack', 'discord', 'custom'] as WebhookType[]).map((type) => (
              <button
                key={type}
                onClick={() => setNewType(type)}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                <span className="text-2xl">{TYPE_CONFIG[type].icon}</span>
                <span className="text-sm font-medium text-gray-900">{TYPE_CONFIG[type].label}</span>
              </button>
            ))}
          </div>
          <Button variant="ghost" onClick={() => setShowAdd(false)}>
            Cancel
          </Button>
        </div>
      )}

      {showAdd && newType && (
        <div className="w-full bg-white rounded-lg border border-gray-200 p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setNewType(null)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className="font-medium text-gray-900">
              New {TYPE_CONFIG[newType].label} Integration
            </h3>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-600">
              {newType === 'slack' ? 'Slack Webhook URL' : newType === 'discord' ? 'Discord Webhook URL' : 'Endpoint URL'}
            </label>
            <Input
              type="url"
              placeholder={TYPE_CONFIG[newType].placeholder}
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-600">Description (optional)</label>
            <Input
              type="text"
              placeholder={`e.g. ${newType === 'slack' ? '#feedback channel' : newType === 'discord' ? '#feedback channel' : 'Production notifications'}`}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </div>
          <p className="text-xs text-gray-500">
            Events: <code className="bg-gray-100 px-1 rounded">response.created</code>
          </p>
          <div className="flex gap-2">
            <Button onClick={createWebhook} disabled={!newUrl || loading === 'create'}>
              {loading === 'create' ? 'Creating...' : `Create ${TYPE_CONFIG[newType].label} Integration`}
            </Button>
            <Button variant="ghost" onClick={() => { setShowAdd(false); setNewType(null); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Webhook list */}
      {webhooks.length === 0 && !showAdd ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500">
          <p>No integrations configured yet.</p>
          <p className="text-sm mt-1">
            Add Slack, Discord, or a custom webhook to receive real-time notifications.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <div key={webhook.id} className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {TYPE_CONFIG[webhook.type as WebhookType]?.icon}{' '}
                        {TYPE_CONFIG[webhook.type as WebhookType]?.label || webhook.type}
                      </Badge>
                      {statusBadge(webhook)}
                      {webhook.description && (
                        <span className="text-sm font-medium text-gray-900">
                          {webhook.description}
                        </span>
                      )}
                    </div>
                    <code className="text-sm text-gray-600 break-all">{webhook.url}</code>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                      <span>
                        Events: {webhook.events.join(', ')}
                      </span>
                      {webhook.lastTriggeredAt && (
                        <span>
                          Last triggered: {new Date(webhook.lastTriggeredAt).toLocaleDateString()}
                        </span>
                      )}
                      {webhook.lastStatusCode && (
                        <span>Last status: {webhook.lastStatusCode}</span>
                      )}
                    </div>

                    {/* Test result */}
                    {testResults[webhook.id] !== undefined && testResults[webhook.id] !== null && (
                      <div
                        className={`mt-2 text-xs px-2 py-1 rounded inline-block ${
                          testResults[webhook.id]!.success
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
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
                <div className="border-t border-gray-200">
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
