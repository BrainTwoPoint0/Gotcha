import { prisma } from '@/lib/prisma';
import { getAuthUser, getActiveOrganization } from '@/lib/auth';
import { ProjectCard } from './project-card';
import { EditorialPageHeader } from '../../components/editorial/page-header';
import { EditorialLinkButton } from '../../components/editorial/button';
import { EditorialCard } from '../../components/editorial/card';
import { EditorialEmptyState } from '../../components/editorial/empty-state';

interface ProjectItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date;
  _count: { responses: number; apiKeys: number };
}

export default async function ProjectsPage() {
  const user = await getAuthUser();

  const activeOrg = user?.email ? await getActiveOrganization(user.email) : null;
  const organization = activeOrg?.organization;

  const projects: ProjectItem[] = organization
    ? await prisma.project.findMany({
        where: { organizationId: organization.id },
        include: { _count: { select: { responses: true, apiKeys: true } } },
        orderBy: { createdAt: 'desc' },
      })
    : [];

  return (
    <div>
      <EditorialPageHeader
        eyebrow={`${projects.length} total`}
        title="Projects"
        subtitle="Each project groups feedback from one surface. Most teams start with a single project."
        action={
          <EditorialLinkButton href="/dashboard/projects/new" variant="ink">
            <span aria-hidden="true">+</span>
            New project
          </EditorialLinkButton>
        }
      />

      {projects.length === 0 ? (
        <EditorialCard>
          <EditorialEmptyState
            title="No projects yet"
            body="A project groups feedback from one app, one site, or one surface. Create your first to get an API key and install the SDK."
            action={
              <EditorialLinkButton href="/dashboard/projects/new" variant="ink">
                Create your first project →
              </EditorialLinkButton>
            }
          />
        </EditorialCard>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              slug={project.slug}
              name={project.name}
              description={project.description}
              responseCount={project._count.responses}
              apiKeyCount={project._count.apiKeys}
              createdAt={new Date(project.createdAt).toISOString()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
