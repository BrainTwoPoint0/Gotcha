'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardFeedback } from '@/app/components/DashboardFeedback';
import { EditorialButton } from '../../../components/editorial/button';
import { EditorialFormField, EditorialInput } from '../../../components/editorial/form-field';

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
    <div className="rounded-md border border-editorial-alert/30 bg-editorial-alert/[0.03] p-6">
      <div className="mb-3 flex items-center gap-3">
        <span className="h-px w-6 bg-editorial-alert" aria-hidden="true" />
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-alert">
          Danger zone
        </span>
      </div>
      <h3 className="font-display text-[1.25rem] font-normal leading-[1.2] tracking-[-0.01em] text-editorial-ink">
        Delete this project
      </h3>
      <p className="mt-2 max-w-2xl text-[14px] leading-[1.6] text-editorial-neutral-3">
        This cannot be undone. All responses, API keys, webhooks, metadata fields, and bug tickets
        tied to <span className="text-editorial-ink">{projectName}</span> will be permanently
        removed.
      </p>

      <div className="mt-6 max-w-sm">
        <EditorialFormField
          label={
            <>
              Type <span className="text-editorial-ink">{projectName}</span> to confirm
            </>
          }
        >
          <EditorialInput
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={projectName}
            autoComplete="off"
            spellCheck={false}
          />
        </EditorialFormField>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 border-l-2 border-editorial-alert bg-editorial-alert/[0.04] px-4 py-3 text-[13px] text-editorial-alert"
        >
          {error}
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <EditorialButton
          variant="ink"
          disabled={!canDelete || deleting}
          onClick={handleDelete}
          className="bg-editorial-alert text-editorial-paper hover:bg-editorial-alert/90"
        >
          {deleting ? 'Deleting…' : 'Delete this project'}
        </EditorialButton>
        <DashboardFeedback
          elementId="project-delete-preference"
          mode="poll"
          promptText="Would you prefer archive or permanent delete?"
          options={['Archive (hide but keep data)', 'Delete (permanent)', 'Both options']}
          onePerUser={true}
          userEmail={userEmail}
        />
      </div>
    </div>
  );
}
