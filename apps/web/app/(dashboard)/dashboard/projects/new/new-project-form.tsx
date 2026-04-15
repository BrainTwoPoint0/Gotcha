'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Copy, Check } from 'lucide-react';
import { EditorialButton } from '../../../components/editorial/button';
import {
  EditorialFormField,
  EditorialInput,
  EditorialTextarea,
} from '../../../components/editorial/form-field';

export function NewProjectForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdProject, setCreatedProject] = useState<{ slug: string; apiKey: string } | null>(
    null
  );
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const handleCopy = async () => {
    if (!createdProject) return;
    try {
      await navigator.clipboard.writeText(createdProject.apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({ name, description }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      setCreatedProject({ slug: data.slug, apiKey: data.apiKey });
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  if (createdProject) {
    return (
      <div>
        <div className="mb-5 flex items-center gap-3">
          <span className="h-px w-6 bg-editorial-success" aria-hidden="true" />
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-success">
            Project created
          </span>
        </div>
        <h2 className="font-display text-2xl font-normal leading-[1.15] tracking-[-0.01em] text-editorial-ink">
          Your API key — copy it now
        </h2>
        <p className="mt-2 text-[14px] leading-[1.6] text-editorial-neutral-3">
          This is the only time we will show you the full key. Save it somewhere safe; if you lose
          it, you can regenerate a new one from the project page.
        </p>

        <div className="mt-6 flex items-center gap-2">
          <code className="min-w-0 flex-1 select-all break-all rounded-md border border-editorial-neutral-2 bg-editorial-ink px-3 py-2.5 font-mono text-[13px] text-editorial-paper">
            {createdProject.apiKey}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-editorial-ink transition-colors hover:bg-editorial-ink/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-editorial-accent/40"
            aria-label={copied ? 'Copied' : 'Copy key'}
          >
            {copied ? (
              <Check className="h-4 w-4 text-editorial-success" />
            ) : (
              <Copy className="h-4 w-4 text-editorial-neutral-3" />
            )}
          </button>
        </div>

        <div className="mt-6 flex justify-end">
          <EditorialButton
            variant="ink"
            onClick={() => router.push(`/dashboard/projects/${createdProject.slug}`)}
          >
            Go to project
            <span aria-hidden="true">→</span>
          </EditorialButton>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div
          role="alert"
          className="mb-5 border-l-2 border-editorial-alert bg-editorial-alert/[0.04] px-4 py-3 text-[13px] text-editorial-alert"
        >
          {error}
        </div>
      )}

      <div className="space-y-5">
        <EditorialFormField
          label="Project name"
          htmlFor="name"
          hint={
            slug ? (
              <>
                Slug: <code className="font-mono text-[12px] text-editorial-ink">{slug}</code>
              </>
            ) : undefined
          }
        >
          <EditorialInput
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Awesome App"
            autoComplete="off"
            spellCheck={false}
          />
        </EditorialFormField>

        <EditorialFormField
          label={
            <>
              Description{' '}
              <span className="text-editorial-neutral-3 normal-case tracking-normal">
                (optional)
              </span>
            </>
          }
          htmlFor="description"
        >
          <EditorialTextarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A brief description of your project"
          />
        </EditorialFormField>
      </div>

      <div className="mt-8 flex items-center justify-end gap-4">
        <Link
          href="/dashboard/projects"
          className="text-[13px] text-editorial-neutral-3 transition-colors hover:text-editorial-ink"
        >
          Cancel
        </Link>
        <EditorialButton type="submit" variant="ink" disabled={!name.trim() || loading}>
          {loading ? 'Creating…' : 'Create project'}
        </EditorialButton>
      </div>
    </form>
  );
}
