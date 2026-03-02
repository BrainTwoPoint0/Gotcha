'use client';

import { useState } from 'react';
import { Button } from '@/app/components/AppButton';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface PlanActionsProps {
  currentPlan: string;
  hasStripeSubscription: boolean;
}

export function PlanActions({ currentPlan, hasStripeSubscription }: PlanActionsProps) {
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
        hasStripeSubscription ? (
          <Button
            variant="secondary"
            onClick={handleManage}
            loading={loading}
            loadingText="Loading..."
          >
            Manage Subscription
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Your Pro plan was activated manually. No billing to manage.
          </p>
        )
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span
              className={`text-sm font-medium ${billing === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}
            >
              Monthly
            </span>
            <Switch
              checked={billing === 'annual'}
              onCheckedChange={(checked) => setBilling(checked ? 'annual' : 'monthly')}
            />
            <span
              className={`text-sm font-medium ${billing === 'annual' ? 'text-gray-900' : 'text-gray-500'}`}
            >
              Annual
            </span>
            {billing === 'annual' && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                Save 17%
              </Badge>
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
