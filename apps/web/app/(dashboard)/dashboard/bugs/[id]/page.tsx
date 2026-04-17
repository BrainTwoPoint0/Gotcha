import { prisma } from '@/lib/prisma';
import { getAuthUser, getActiveOrganization } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { canAccessBugFeatures } from '@/lib/plan-limits';
import { BugActions } from './bug-actions';
import { DashboardFeedback } from '@/app/components/DashboardFeedback';
import { ScreenshotViewer } from '../../responses/screenshot-viewer';
import {
  EditorialCard,
  EditorialCardBody,
  EditorialCardHeader,
} from '../../../components/editorial/card';

export const dynamic = 'force-dynamic';

const STATUS_CONFIG: Record<string, { label: string; tone: string }> = {
  OPEN: { label: 'Open', tone: 'text-editorial-accent' },
  INVESTIGATING: { label: 'Investigating', tone: 'text-editorial-neutral-3' },
  FIXING: { label: 'Fixing', tone: 'text-editorial-ink' },
  RESOLVED: { label: 'Resolved', tone: 'text-editorial-success' },
  CLOSED: { label: 'Closed', tone: 'text-editorial-neutral-3/70' },
  WONT_FIX: { label: "Won't fix", tone: 'text-editorial-neutral-3/70' },
};

const PRIORITY_CONFIG: Record<string, { label: string; tone: string }> = {
  LOW: { label: 'Low', tone: 'text-editorial-neutral-3/80' },
  MEDIUM: { label: 'Medium', tone: 'text-editorial-neutral-3' },
  HIGH: { label: 'High', tone: 'text-editorial-accent' },
  CRITICAL: { label: 'Critical', tone: 'text-editorial-alert' },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BugDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getAuthUser();

  const dbUser = user
    ? await prisma.user.findUnique({
        where: { email: user.email! },
      })
    : null;

  const activeOrg = user?.email ? await getActiveOrganization(user.email) : null;
  const organization = activeOrg?.organization;
  if (!organization) notFound();

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
          screenshotPath: true,
          screenshotCapturedAt: true,
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
      <Link
        href="/dashboard/bugs"
        className="mb-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-neutral-3 transition-colors hover:text-editorial-ink"
      >
        <span aria-hidden="true">←</span>
        Back to bugs
      </Link>

      <header className="mb-10">
        <div className="mb-3 flex items-center gap-3">
          <span className="h-px w-6 bg-editorial-accent" aria-hidden="true" />
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-neutral-3">
            Bug · {bug.project.name}
          </span>
        </div>
        <h1 className="max-w-3xl font-display text-3xl font-normal leading-[1.15] tracking-[-0.01em] text-editorial-ink sm:text-4xl">
          {bug.title}
        </h1>
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
          <span
            className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] ${status.tone}`}
          >
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
            {status.label}
          </span>
          <span className={`font-mono text-[10px] uppercase tracking-[0.14em] ${priority.tone}`}>
            {priority.label}
          </span>
          <span aria-hidden="true" className="text-editorial-neutral-2">
            ·
          </span>
          <span className="font-mono text-[12px] tabular-nums text-editorial-neutral-3">
            {formatDateLong(bug.createdAt)}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <EditorialCard>
            <EditorialCardHeader>
              <SectionLabel>Description</SectionLabel>
            </EditorialCardHeader>
            <EditorialCardBody>
              <p className="whitespace-pre-wrap text-[14px] leading-[1.65] text-editorial-ink">
                {bug.description}
              </p>
            </EditorialCardBody>
          </EditorialCard>

          {bug.response && (
            <EditorialCard>
              <EditorialCardHeader>
                <SectionLabel>Original response</SectionLabel>
              </EditorialCardHeader>
              <EditorialCardBody className="space-y-4">
                {bug.response.rating != null && (
                  <DetailRow label="Rating">
                    <span className="font-display text-[18px] text-editorial-accent">
                      {'★'.repeat(bug.response.rating)}
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-editorial-neutral-3">
                      {bug.response.rating} of 5
                    </span>
                  </DetailRow>
                )}
                {bug.response.vote && (
                  <DetailRow label="Vote">
                    <span
                      className={`text-[14px] ${bug.response.vote === 'UP' ? 'text-editorial-success' : 'text-editorial-alert'}`}
                    >
                      {bug.response.vote === 'UP' ? 'Upvote' : 'Downvote'}
                    </span>
                  </DetailRow>
                )}
                {bug.response.content && (
                  <DetailRow label="Content">
                    <p className="whitespace-pre-wrap text-[14px] leading-[1.6] text-editorial-ink">
                      {bug.response.content}
                    </p>
                  </DetailRow>
                )}
                {bug.response.screenshotPath && (
                  <DetailRow label="Screenshot">
                    <ScreenshotViewer
                      responseId={bug.response.id}
                      capturedAt={bug.response.screenshotCapturedAt?.toISOString() ?? null}
                    />
                  </DetailRow>
                )}
                <div className="flex items-center gap-3 border-t border-editorial-neutral-2 pt-3 font-mono text-[11px] text-editorial-neutral-3">
                  <span className="uppercase tracking-[0.14em]">{bug.response.mode}</span>
                  <span aria-hidden="true" className="text-editorial-neutral-2">
                    ·
                  </span>
                  <span className="tabular-nums">{formatDateLong(bug.response.createdAt)}</span>
                </div>
              </EditorialCardBody>
            </EditorialCard>
          )}

          {bug.notes.length > 0 && (
            <EditorialCard>
              <EditorialCardHeader>
                <SectionLabel>Activity</SectionLabel>
              </EditorialCardHeader>
              <EditorialCardBody className="space-y-4">
                {bug.notes.map((note) => {
                  const isSystemNote =
                    note.content.startsWith('Status changed from') ||
                    note.content.startsWith('Priority changed from');

                  if (isSystemNote) {
                    return (
                      <div key={note.id} className="flex items-center gap-2.5">
                        <span
                          aria-hidden="true"
                          className="h-1 w-1 shrink-0 rounded-full bg-editorial-neutral-2"
                        />
                        <span className="text-[13px] text-editorial-neutral-3">
                          <span className="text-editorial-ink">
                            {note.authorName || note.authorEmail}
                          </span>{' '}
                          {note.content.toLowerCase()}
                        </span>
                        <span className="ml-auto font-mono text-[11px] tabular-nums text-editorial-neutral-3">
                          {formatDateLong(note.createdAt)}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={note.id}
                      className={`rounded-md border p-4 ${note.isExternal ? 'border-editorial-accent/30 bg-editorial-accent/[0.03]' : 'border-editorial-neutral-2 bg-editorial-ink/[0.02]'}`}
                    >
                      <div className="mb-2 flex items-center gap-3">
                        <span className="text-[13px] text-editorial-ink">
                          {note.authorName || note.authorEmail}
                        </span>
                        <span
                          className={`font-mono text-[9px] uppercase tracking-[0.18em] ${note.isExternal ? 'text-editorial-accent' : 'text-editorial-neutral-3'}`}
                        >
                          {note.isExternal ? 'Sent to reporter' : 'Internal'}
                        </span>
                        <span className="ml-auto font-mono text-[11px] tabular-nums text-editorial-neutral-3">
                          {formatDateLong(note.createdAt)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-[14px] leading-[1.6] text-editorial-ink">
                        {note.content}
                      </p>
                    </div>
                  );
                })}
              </EditorialCardBody>
            </EditorialCard>
          )}

          {bug.resolutionNote && (
            <EditorialCard className="border-editorial-success/30 bg-editorial-success/[0.03]">
              <EditorialCardHeader className="border-editorial-success/20">
                <SectionLabel className="text-editorial-success">Resolution</SectionLabel>
              </EditorialCardHeader>
              <EditorialCardBody>
                <p className="whitespace-pre-wrap text-[14px] leading-[1.65] text-editorial-ink">
                  {bug.resolutionNote}
                </p>
                {bug.resolvedAt && (
                  <p className="mt-3 font-mono text-[11px] tabular-nums text-editorial-neutral-3">
                    Resolved {formatDateLong(bug.resolvedAt)}
                  </p>
                )}
              </EditorialCardBody>
            </EditorialCard>
          )}
        </div>

        <div className="space-y-6">
          <BugActions
            bugId={bug.id}
            currentStatus={bug.status}
            currentPriority={bug.priority}
            reporterEmail={bug.reporterEmail}
          />

          {(bug.reporterEmail || bug.reporterName || bug.endUserId) && (
            <EditorialCard>
              <EditorialCardHeader>
                <SectionLabel>Reporter</SectionLabel>
              </EditorialCardHeader>
              <EditorialCardBody className="space-y-4">
                {bug.reporterName && <MetaRow label="Name">{bug.reporterName}</MetaRow>}
                {bug.reporterEmail && <MetaRow label="Email">{bug.reporterEmail}</MetaRow>}
                {bug.endUserId && (
                  <MetaRow label="User ID">
                    <code className="font-mono text-[12px]">{bug.endUserId}</code>
                  </MetaRow>
                )}
              </EditorialCardBody>
            </EditorialCard>
          )}

          <EditorialCard>
            <EditorialCardHeader>
              <SectionLabel>Context</SectionLabel>
            </EditorialCardHeader>
            <EditorialCardBody className="space-y-4">
              <MetaRow label="Element">
                <code className="font-mono text-[12px] text-editorial-neutral-3">
                  {bug.elementId}
                </code>
              </MetaRow>
              {bug.pageUrl && (
                <MetaRow label="Page URL">
                  <span className="break-all font-mono text-[12px] text-editorial-neutral-3">
                    {bug.pageUrl}
                  </span>
                </MetaRow>
              )}
              {bug.userAgent && (
                <MetaRow label="Browser">
                  <span className="break-all font-mono text-[11px] leading-[1.55] text-editorial-neutral-3">
                    {bug.userAgent}
                  </span>
                </MetaRow>
              )}
              <MetaRow label="Created">
                <span className="font-mono text-[12px] tabular-nums text-editorial-neutral-3">
                  {formatDateLong(bug.createdAt)}
                </span>
              </MetaRow>
            </EditorialCardBody>
          </EditorialCard>
        </div>
      </div>

      {/* Per-page feedback widget — quiet hint, not a chrome element */}
      <div className="mt-12 flex items-center justify-center gap-3 text-[13px] text-editorial-neutral-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em]">Improve this page</span>
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
    </div>
  );
}

function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      className={`font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3 ${className ?? ''}`}
    >
      {children}
    </h2>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-5">
      <span className="w-20 shrink-0 pt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
        {label}
      </span>
      <div className="flex flex-1 items-center gap-2">{children}</div>
    </div>
  );
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.18em] text-editorial-neutral-3">
        {label}
      </span>
      <div className="text-[13px] text-editorial-ink">{children}</div>
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
