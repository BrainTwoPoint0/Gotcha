import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ApiKeyCard } from './api-key-card';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

interface ApiKeyItem {
  id: string;
  name: string;
  key: string;
  allowedDomains: string[];
  lastUsedAt: Date | null;
  createdAt: Date;
}

interface ResponseItem {
  id: string;
  mode: string;
  content: string | null;
  rating: number | null;
  vote: string | null;
  elementIdRaw: string;
  createdAt: Date;
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const dbUser = user
    ? await prisma.user.findUnique({
        where: { email: user.email! },
        include: {
          memberships: {
            include: { organization: true },
          },
        },
      })
    : null;

  const organization = dbUser?.memberships[0]?.organization;

  if (!organization) {
    notFound();
  }

  const project = await prisma.project.findUnique({
    where: {
      organizationId_slug: {
        organizationId: organization.id,
        slug,
      },
    },
    include: {
      apiKeys: {
        where: { revokedAt: null },
        orderBy: { createdAt: 'desc' },
      },
      responses: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      _count: {
        select: { responses: true },
      },
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <div>
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
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            {project.description && <p className="text-gray-600">{project.description}</p>}
          </div>
          <Link
            href={`/dashboard/projects/${slug}/settings/metadata`}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
              />
            </svg>
            Metadata Settings
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-500">Total Responses</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{project._count.responses}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-500">Active API Keys</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{project.apiKeys.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-500">Created</p>
          <p className="mt-2 text-xl font-semibold text-gray-900">
            {new Date(project.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* API Keys */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">API Keys</h2>

          {project.apiKeys.length === 0 ? (
            <p className="text-gray-500 text-sm">No API keys yet.</p>
          ) : (
            <div className="space-y-4">
              {(project.apiKeys as ApiKeyItem[]).map((apiKey) => (
                <ApiKeyCard key={apiKey.id} apiKey={apiKey} />
              ))}
            </div>
          )}

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Quick Start</h3>
            <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
              {`npm install gotcha-feedback

import { GotchaProvider, Gotcha } from 'gotcha-feedback'

<GotchaProvider apiKey="${project.apiKeys[0]?.key || 'YOUR_API_KEY'}">
  <Gotcha elementId="feature-card">
    <YourComponent />
  </Gotcha>
</GotchaProvider>`}
            </pre>
          </div>
        </div>

        {/* Recent Responses */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Responses</h2>
          </div>

          {project.responses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No responses yet.</p>
              <p className="text-sm mt-1">Integrate the SDK to start collecting feedback.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(project.responses as ResponseItem[]).map((response) => (
                <div
                  key={response.id}
                  className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getModeStyle(response.mode)}`}
                      >
                        {response.mode.toLowerCase()}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatTimeAgo(response.createdAt)}
                      </span>
                    </div>
                    {response.rating && (
                      <span className="text-yellow-500 text-sm">
                        {'★'.repeat(response.rating)}
                        {'☆'.repeat(5 - response.rating)}
                      </span>
                    )}
                    {response.vote && (
                      <span className={response.vote === 'UP' ? 'text-green-600' : 'text-red-600'}>
                        {response.vote === 'UP' ? '👍' : '👎'}
                      </span>
                    )}
                  </div>
                  {response.content && (
                    <p className="mt-2 text-sm text-gray-700">{response.content}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">Element: {response.elementIdRaw}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getModeStyle(mode: string): string {
  const styles: Record<string, string> = {
    FEEDBACK: 'bg-slate-100 text-slate-800',
    VOTE: 'bg-green-100 text-green-800',
    POLL: 'bg-purple-100 text-purple-800',
    FEATURE_REQUEST: 'bg-orange-100 text-orange-800',
    AB: 'bg-pink-100 text-pink-800',
  };
  return styles[mode] || 'bg-gray-100 text-gray-800';
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}
