'use client';

import { useState } from 'react';
import { Button } from '@/app/components/Button';

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
        <Button onClick={handleUpgrade} loading={loading} loadingText="Loading...">
          Upgrade to Pro - $29/month
        </Button>
      )}
    </div>
  );
}
