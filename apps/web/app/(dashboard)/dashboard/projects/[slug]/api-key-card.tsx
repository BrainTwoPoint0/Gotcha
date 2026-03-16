'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Check, RefreshCw } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  allowedDomains: string[];
  lastUsedAt: Date | null;
  createdAt: Date;
}

function formatDate(date: Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function ApiKeyCard({ apiKey, projectSlug }: { apiKey: ApiKey; projectSlug: string }) {
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectSlug}/regenerate-key`, {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to regenerate key');
      }

      setNewKey(data.apiKey);
      setConfirmRegenerate(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-gray-900">{apiKey.name}</span>
          <span className="text-xs text-gray-400">
            {apiKey.lastUsedAt ? `Last used ${formatDate(apiKey.lastUsedAt)}` : 'Never used'}
          </span>
        </div>

        {newKey ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 text-sm bg-gray-100 px-3 py-2 rounded font-mono text-gray-900 break-all select-all">
                {newKey}
              </code>
              <button
                type="button"
                onClick={() => handleCopy(newKey)}
                className="shrink-0 p-2 rounded hover:bg-gray-100 transition-colors"
                title="Copy"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-500" />
                )}
              </button>
            </div>
            <Alert>
              <AlertDescription>
                Copy this key now — you won&apos;t be able to see it again.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 text-sm bg-gray-100 px-3 py-2 rounded font-mono text-gray-500">
                {apiKey.key}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCopy(apiKey.key)}
                title="Copy prefix"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <p className="mt-2 text-xs text-gray-400">
              Full key was shown only at creation.{' '}
              <button
                type="button"
                onClick={() => setConfirmRegenerate(true)}
                className="text-gray-600 underline hover:text-gray-800"
              >
                Regenerate key
              </button>{' '}
              if lost.
            </p>

            {confirmRegenerate && (
              <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-800 mb-2">
                  This will revoke the current key. Any integrations using it will stop working.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRegenerate}
                    disabled={regenerating}
                  >
                    <RefreshCw className={`h-3 w-3 mr-1.5 ${regenerating ? 'animate-spin' : ''}`} />
                    {regenerating ? 'Regenerating...' : 'Regenerate'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmRegenerate(false)}
                    disabled={regenerating}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="mt-3">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </>
        )}

        {apiKey.allowedDomains.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {apiKey.allowedDomains.map((domain) => (
              <Badge key={domain} variant="secondary" className="text-xs">
                {domain}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
