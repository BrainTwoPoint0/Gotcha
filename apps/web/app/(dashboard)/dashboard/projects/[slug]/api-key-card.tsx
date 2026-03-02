'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';

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

export function ApiKeyCard({ apiKey }: { apiKey: ApiKey }) {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(apiKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const maskedKey = apiKey.key.slice(0, 12) + '\u2022'.repeat(20) + apiKey.key.slice(-4);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-gray-900">{apiKey.name}</span>
          <span className="text-xs text-gray-400">
            {apiKey.lastUsedAt ? `Last used ${formatDate(apiKey.lastUsedAt)}` : 'Never used'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm bg-gray-100 px-3 py-2 rounded font-mono text-gray-700 overflow-hidden">
            {showKey ? apiKey.key : maskedKey}
          </code>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowKey(!showKey)}
            title={showKey ? 'Hide' : 'Show'}
          >
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy">
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

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
