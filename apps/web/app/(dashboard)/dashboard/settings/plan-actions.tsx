'use client';

import { useState } from 'react';

interface PlanActionsProps {
  currentPlan: string;
}

export function PlanActions({ currentPlan }: PlanActionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
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
      {error && (
        <p className="text-sm text-red-600 mb-4">{error}</p>
      )}

      {currentPlan === 'PRO' ? (
        <button
          onClick={handleManage}
          disabled={loading}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Manage Subscription'}
        </button>
      ) : (
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Upgrade to Pro - $29/month'}
        </button>
      )}
    </div>
  );
}
