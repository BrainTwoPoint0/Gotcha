'use client';

import { useState } from 'react';

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

  const maskedKey = apiKey.key.slice(0, 12) + '•'.repeat(20) + apiKey.key.slice(-4);

  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-gray-900">{apiKey.name}</span>
        <span className="text-xs text-gray-400">
          {apiKey.lastUsedAt
            ? `Last used ${formatDate(apiKey.lastUsedAt)}`
            : 'Never used'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <code className="flex-1 text-sm bg-gray-100 px-3 py-2 rounded font-mono text-gray-700 overflow-hidden">
          {showKey ? apiKey.key : maskedKey}
        </code>
        <button
          onClick={() => setShowKey(!showKey)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
          title={showKey ? 'Hide' : 'Show'}
        >
          {showKey ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
        <button
          onClick={handleCopy}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
          title="Copy"
        >
          {copied ? (
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>

      {apiKey.allowedDomains.length > 0 && (
        <div className="mt-2">
          <span className="text-xs text-gray-500">Allowed domains: </span>
          <span className="text-xs text-gray-700">
            {apiKey.allowedDomains.join(', ')}
          </span>
        </div>
      )}
    </div>
  );
}
