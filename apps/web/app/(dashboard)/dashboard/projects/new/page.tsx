import { getAuthUser, getActiveOrganization } from '@/lib/auth';
import { isOverProjectLimit, getProjectLimitDisplay } from '@/lib/plan-limits';
import Link from 'next/link';
import { NewProjectForm } from './new-project-form';
import { EditorialPageHeader } from '../../../components/editorial/page-header';
import { EditorialCard } from '../../../components/editorial/card';
import { EditorialEmptyState } from '../../../components/editorial/empty-state';
import { EditorialLinkButton } from '../../../components/editorial/button';

export const dynamic = 'force-dynamic';

function BackLink() {
  return (
    <Link
      href="/dashboard/projects"
      className="mb-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-neutral-3 transition-colors hover:text-editorial-ink"
    >
      <span aria-hidden="true">←</span>
      Back to projects
    </Link>
  );
}

export default async function NewProjectPage() {
  const user = await getAuthUser();

  const activeOrg = user?.email ? await getActiveOrganization(user.email) : null;
  const organization = activeOrg?.organization;
  const plan = organization?.subscription?.plan || 'FREE';
  const projectCount = organization?.projects?.length || 0;
  const isAtLimit = isOverProjectLimit(plan, projectCount);

  if (isAtLimit) {
    return (
      <div className="max-w-2xl">
        <BackLink />
        <EditorialPageHeader
          eyebrow="Project limit reached"
          title="You've hit the Free plan cap"
          subtitle={`The Free plan includes ${getProjectLimitDisplay('FREE')} project. Pro is unlimited.`}
        />
        <EditorialCard>
          <EditorialEmptyState
            title="Upgrade to add more projects"
            body="Pro lifts every project and response limit and unlocks analytics, segments, and bug intake."
            action={
              <div className="flex flex-wrap items-center gap-3">
                <EditorialLinkButton href="/dashboard/settings" variant="ink">
                  Upgrade to Pro →
                </EditorialLinkButton>
                <EditorialLinkButton href="/dashboard/projects" variant="ghost">
                  Back to projects
                </EditorialLinkButton>
              </div>
            }
          />
        </EditorialCard>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <BackLink />
      <EditorialPageHeader
        eyebrow="New project"
        title="Create a project"
        subtitle="A project groups the feedback from one app or surface. Most teams start with one."
      />
      <EditorialCard>
        <div className="px-6 py-6 sm:px-8 sm:py-8">
          <NewProjectForm />
        </div>
      </EditorialCard>
    </div>
  );
}
