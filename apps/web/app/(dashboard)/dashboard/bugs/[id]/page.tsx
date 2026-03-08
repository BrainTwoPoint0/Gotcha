import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrganization } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { canAccessBugFeatures } from '@/lib/plan-limits';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BugActions } from './bug-actions';
import { DashboardFeedback } from '@/app/components/DashboardFeedback';

export const dynamic = 'force-dynamic';

const STATUS_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  OPEN: {
    label: 'Open',
    className: 'bg-red-50/80 text-red-700 border-red-200/60',
    dot: 'bg-red-500',
  },
  INVESTIGATING: {
    label: 'Investigating',
    className: 'bg-amber-50/80 text-amber-700 border-amber-200/60',
    dot: 'bg-amber-500',
  },
  FIXING: {
    label: 'Fixing',
    className: 'bg-blue-50/80 text-blue-700 border-blue-200/60',
    dot: 'bg-blue-500',
  },
  RESOLVED: {
    label: 'Resolved',
    className: 'bg-emerald-50/80 text-emerald-700 border-emerald-200/60',
    dot: 'bg-emerald-500',
  },
  CLOSED: {
    label: 'Closed',
    className: 'bg-gray-50 text-gray-500 border-gray-200/60',
    dot: 'bg-gray-400',
  },
  WONT_FIX: {
    label: "Won't Fix",
    className: 'bg-gray-50 text-gray-500 border-gray-200/60',
    dot: 'bg-gray-400',
  },
};

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  LOW: { label: 'Low', className: 'bg-gray-50 text-gray-500 border-gray-200/60' },
  MEDIUM: { label: 'Medium', className: 'bg-blue-50/80 text-blue-700 border-blue-200/60' },
  HIGH: { label: 'High', className: 'bg-orange-50/80 text-orange-700 border-orange-200/60' },
  CRITICAL: { label: 'Critical', className: 'bg-red-50/80 text-red-700 border-red-200/60' },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BugDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const dbUser = user
    ? await prisma.user.findUnique({
        where: { email: user.email! },
      })
    : null;

  const activeOrg = user?.email ? await getActiveOrganization(user.email) : null;
  const organization = activeOrg?.organization;
  if (!organization) notFound();

  // Pro gate — redirect FREE users to bugs list (shows upgrade prompt)
  const isPro = canAccessBugFeatures(organization.subscription?.plan ?? 'FREE');
  if (!isPro) redirect('/dashboard/bugs');

  const projectIds = (organization.projects ?? []).map((p) => p.id);

  const bug = await prisma.bugTicket.findFirst({
    where: { id, projectId: { in: projectIds } },
    include: {
      response: {
        select: {
          id: true,
          mode: true,
          content: true,
          rating: true,
          vote: true,
          endUserId: true,
          endUserMeta: true,
          url: true,
          userAgent: true,
          createdAt: true,
        },
      },
      project: { select: { name: true, slug: true } },
      notes: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!bug) notFound();

  const status = STATUS_CONFIG[bug.status] || STATUS_CONFIG.OPEN;
  const priority = PRIORITY_CONFIG[bug.priority] || PRIORITY_CONFIG.MEDIUM;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link
          href="/dashboard/bugs"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M8.5 3.5L5 7L8.5 10.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to Bugs
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-900">{bug.title}</h1>
          <DashboardFeedback
            elementId="bug-detail-page"
            mode="feedback"
            promptText="Rate this bug detail view"
            userEmail={dbUser?.email}
            userName={dbUser?.name ?? undefined}
            userProfile={{
              companySize: dbUser?.companySize ?? undefined,
              role: dbUser?.role ?? undefined,
              industry: dbUser?.industry ?? undefined,
              useCase: dbUser?.useCase ?? undefined,
              plan: 'PRO',
            }}
          />
        </div>
        <div className="flex items-center gap-2.5 mt-2.5">
          <Badge variant="outline" className={status.className}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot} mr-1.5`} />
            {status.label}
          </Badge>
          <Badge variant="outline" className={priority.className}>
            {priority.label}
          </Badge>
          <span className="text-gray-200">·</span>
          <span className="text-sm text-gray-400">{bug.project.name}</span>
          <span className="text-gray-200">·</span>
          <span className="text-sm tabular-nums text-gray-400">
            {formatDateLong(bug.createdAt)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card className="p-5">
            <h2 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3">
              Description
            </h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {bug.description}
            </p>
          </Card>

          {/* Original Response */}
          {bug.response && (
            <Card className="p-5">
              <h2 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3">
                Original Response
              </h2>
              <div className="space-y-3">
                {/* Rating stars */}
                {bug.response.rating != null && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-16">Rating</span>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }, (_, i) => (
                          <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path
                              d="M7 1.75L8.575 4.9L12.075 5.425L9.5375 7.875L10.15 11.375L7 9.7125L3.85 11.375L4.4625 7.875L1.925 5.425L5.425 4.9L7 1.75Z"
                              fill={i < bug.response!.rating! ? '#F59E0B' : 'none'}
                              stroke={i < bug.response!.rating! ? '#F59E0B' : '#E5E7EB'}
                              strokeWidth="0.75"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">{bug.response.rating} of 5</span>
                    </div>
                  </div>
                )}

                {/* Vote */}
                {bug.response.vote && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-16">Vote</span>
                    <div
                      className={`flex items-center gap-1.5 text-sm font-medium ${
                        bug.response.vote === 'UP' ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center w-5 h-5 rounded-full shrink-0 ${
                          bug.response.vote === 'UP' ? 'bg-emerald-50' : 'bg-red-50'
                        }`}
                      >
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                          {bug.response.vote === 'UP' ? (
                            <path
                              d="M7 3L7 11M7 3L4 6M7 3L10 6"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          ) : (
                            <path
                              d="M7 11L7 3M7 11L4 8M7 11L10 8"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          )}
                        </svg>
                      </div>
                      {bug.response.vote === 'UP' ? 'Upvote' : 'Downvote'}
                    </div>
                  </div>
                )}

                {/* Content */}
                {bug.response.content && (
                  <div>
                    <span className="text-xs text-gray-400 block mb-1.5">Content</span>
                    <div className="bg-gradient-to-b from-gray-50/80 to-white border border-gray-100 rounded-md p-3">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {bug.response.content}
                      </p>
                    </div>
                  </div>
                )}

                <Separator className="my-1" />

                {/* Metadata */}
                <div className="flex items-center gap-3 text-[11px] text-gray-400">
                  <span className="font-mono">{bug.response.mode}</span>
                  <span className="text-gray-200">·</span>
                  <span className="tabular-nums">{formatDateLong(bug.response.createdAt)}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Activity Feed */}
          {bug.notes.length > 0 && (
            <Card className="p-5">
              <h2 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-4">
                Activity
              </h2>
              <div className="space-y-4">
                {bug.notes.map((note) => {
                  const isSystemNote =
                    note.content.startsWith('Status changed from') ||
                    note.content.startsWith('Priority changed from');

                  if (isSystemNote) {
                    return (
                      <div key={note.id} className="flex items-center gap-2 px-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                        <span className="text-xs text-gray-400">
                          <span className="font-medium text-gray-500">
                            {note.authorName || note.authorEmail}
                          </span>{' '}
                          {note.content.toLowerCase()}
                        </span>
                        <span className="text-[11px] text-gray-300 tabular-nums ml-auto">
                          {formatDateLong(note.createdAt)}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={note.id}
                      className={`rounded-md border p-3 ${
                        note.isExternal
                          ? 'border-blue-200/60 bg-blue-50/30'
                          : 'border-gray-100 bg-gray-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm font-medium text-gray-700">
                          {note.authorName || note.authorEmail}
                        </span>
                        {note.isExternal ? (
                          <span className="text-[10px] font-medium uppercase tracking-wider text-blue-600 bg-blue-100/60 px-1.5 py-0.5 rounded">
                            Sent to reporter
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                            Internal
                          </span>
                        )}
                        <span className="text-[11px] text-gray-400 tabular-nums ml-auto">
                          {formatDateLong(note.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                        {note.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Resolution */}
          {bug.resolutionNote && (
            <Card className="p-5 border-emerald-200/60 bg-emerald-50/30">
              <h2 className="text-xs font-medium uppercase tracking-wider text-emerald-600 mb-3">
                Resolution
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed">{bug.resolutionNote}</p>
              {bug.resolvedAt && (
                <p className="text-xs text-gray-400 mt-3 tabular-nums">
                  Resolved {formatDateLong(bug.resolvedAt)}
                </p>
              )}
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <BugActions
            bugId={bug.id}
            currentStatus={bug.status}
            currentPriority={bug.priority}
            reporterEmail={bug.reporterEmail}
          />

          {/* Reporter */}
          {(bug.reporterEmail || bug.reporterName || bug.endUserId) && (
            <Card className="p-5">
              <h2 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-4">
                Reporter
              </h2>
              <div className="space-y-3.5">
                {bug.reporterName && (
                  <div>
                    <span className="text-[11px] text-gray-400 block mb-1">Name</span>
                    <span className="text-sm text-gray-700">{bug.reporterName}</span>
                  </div>
                )}
                {bug.reporterEmail && (
                  <div>
                    <span className="text-[11px] text-gray-400 block mb-1">Email</span>
                    <span className="text-sm text-gray-700">{bug.reporterEmail}</span>
                  </div>
                )}
                {bug.endUserId && (
                  <div>
                    <span className="text-[11px] text-gray-400 block mb-1">User ID</span>
                    <code className="text-xs text-gray-500 font-mono bg-gray-50 px-1.5 py-0.5 rounded">
                      {bug.endUserId}
                    </code>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Context */}
          <Card className="p-5">
            <h2 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-4">
              Context
            </h2>
            <div className="space-y-3.5">
              <div>
                <span className="text-[11px] text-gray-400 block mb-1">Element</span>
                <code className="text-xs text-gray-500 font-mono bg-gray-50 px-1.5 py-0.5 rounded">
                  {bug.elementId}
                </code>
              </div>
              {bug.pageUrl && (
                <div>
                  <span className="text-[11px] text-gray-400 block mb-1">Page URL</span>
                  <span className="text-xs text-gray-600 break-all">{bug.pageUrl}</span>
                </div>
              )}
              {bug.userAgent && (
                <div>
                  <span className="text-[11px] text-gray-400 block mb-1">Browser</span>
                  <span className="text-xs text-gray-600 break-all leading-relaxed">
                    {bug.userAgent}
                  </span>
                </div>
              )}
              <div>
                <span className="text-[11px] text-gray-400 block mb-1">Created</span>
                <span className="text-xs tabular-nums text-gray-600">
                  {formatDateLong(bug.createdAt)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatDateLong(date: Date): string {
  const day = DAYS[date.getDay()];
  const m = MONTHS[date.getMonth()];
  const d = date.getDate();
  const y = date.getFullYear();
  let h = date.getHours();
  const min = date.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${day}, ${m} ${d}, ${y}, ${h}:${min} ${ampm}`;
}
