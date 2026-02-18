'use client';

import { useState } from 'react';
import { Button } from '@/app/components/Button';

interface PlanActionsProps {
  currentPlan: string;
}

export function PlanActions({ currentPlan }: PlanActionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billing }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to start checkout');
      }
    } catch (err) {
      console.error('Upgrade error:', err);
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleManage = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to open portal');
      }
    } catch (err) {
      console.error('Portal error:', err);
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {currentPlan === 'PRO' ? (
        <Button
          variant="secondary"
          onClick={handleManage}
          loading={loading}
          loadingText="Loading..."
        >
          Manage Subscription
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span
              className={`text-sm font-medium ${billing === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}
            >
              Monthly
            </span>
            <button
              type="button"
              onClick={() => setBilling(billing === 'monthly' ? 'annual' : 'monthly')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                billing === 'annual' ? 'bg-slate-700' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billing === 'annual' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span
              className={`text-sm font-medium ${billing === 'annual' ? 'text-gray-900' : 'text-gray-500'}`}
            >
              Annual
            </span>
            {billing === 'annual' && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                Save 17%
              </span>
            )}
          </div>
          <Button onClick={handleUpgrade} loading={loading} loadingText="Loading...">
            Upgrade to Pro - {billing === 'annual' ? '$24/mo (billed annually)' : '$29/month'}
          </Button>
        </div>
      )}
    </div>
  );
}
