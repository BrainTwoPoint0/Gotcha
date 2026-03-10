'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/app/components/AppButton';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Check } from 'lucide-react';

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
    await navigator.clipboard.writeText(createdProject.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Project created</h1>
          <p className="text-gray-600">
            Save your API key now — you won&apos;t be able to see it again.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Your API Key</Label>
              <div className="mt-1 flex items-center gap-2">
                <code className="min-w-0 flex-1 text-sm bg-gray-100 px-3 py-2 rounded font-mono text-gray-900 break-all select-all">
                  {createdProject.apiKey}
                </code>
                <button
                  type="button"
                  onClick={handleCopy}
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
            </div>

            <Alert>
              <AlertDescription>
                This is the only time your full API key will be shown. Copy it and store it
                securely. If you lose it, you&apos;ll need to regenerate a new one.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end">
              <Button onClick={() => router.push(`/dashboard/projects/${createdProject.slug}`)}>
                Go to Project
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link
          href="/dashboard/projects"
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Projects
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Create a new project</h1>
        <p className="text-gray-600">Set up a new project to start collecting feedback.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Project name</Label>
                <Input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Awesome App"
                />
                {slug && (
                  <p className="text-sm text-muted-foreground">
                    Slug: <code className="bg-muted px-1 rounded">{slug}</code>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A brief description of your project"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <Link
                href="/dashboard/projects"
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Link>
              <Button
                type="submit"
                disabled={!name.trim()}
                loading={loading}
                loadingText="Creating..."
              >
                Create Project
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
