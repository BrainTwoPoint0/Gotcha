'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DashboardFeedback } from '@/app/components/DashboardFeedback';

export function DeleteProjectCard({
  projectName,
  projectSlug,
  userEmail,
}: {
  projectName: string;
  projectSlug: string;
  userEmail?: string;
}) {
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const canDelete = confirmText === projectName;

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectSlug}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({ confirmName: confirmText }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete project');
      }

      router.push('/dashboard/projects');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setDeleting(false);
    }
  };

  return (
    <Card className="border-red-200">
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h3>
        <p className="text-sm text-gray-600 mb-4">
          This action cannot be undone. This will permanently delete the{' '}
          <strong>{projectName}</strong> project and all of its data including responses, API keys,
          webhooks, and metadata fields.
        </p>

        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Type <strong>{projectName}</strong> to confirm
        </label>
        <Input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={projectName}
          className="mb-3 max-w-sm"
        />

        {error && (
          <Alert variant="destructive" className="mb-3">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-3">
          <Button variant="destructive" disabled={!canDelete || deleting} onClick={handleDelete}>
            {deleting ? 'Deleting...' : 'Delete this project'}
          </Button>
          <DashboardFeedback
            elementId="project-delete-preference"
            mode="poll"
            promptText="Would you prefer archive or permanent delete?"
            options={['Archive (hide but keep data)', 'Delete (permanent)', 'Both options']}
            onePerUser={true}
            userEmail={userEmail}
          />
        </div>
      </CardContent>
    </Card>
  );
}
