import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

const ORG_COOKIE = 'gotcha_org';

interface ActiveOrg {
  organization: {
    id: string;
    name: string;
    slug: string;
    subscription?: {
      plan: string;
      status: string;
      responsesThisMonth: number;
      stripeCustomerId?: string | null;
      [key: string]: unknown;
    } | null;
    projects?: { id: string }[];
  };
  membership: {
    id: string;
    role: string;
  };
  isPro: boolean;
}

/**
 * Get the active organization for the current user.
 * Reads the `gotcha_org` cookie for the selected workspace.
 * Falls back to the first membership if no cookie or invalid.
 */
export async function getActiveOrganization(userEmail: string): Promise<ActiveOrg | null> {
  const dbUser = await prisma.user.findUnique({
    where: { email: userEmail },
    include: {
      memberships: {
        include: {
          organization: {
            include: {
              subscription: true,
              projects: { select: { id: true } },
            },
          },
        },
      },
    },
  });

  if (!dbUser || dbUser.memberships.length === 0) {
    return null;
  }

  // Check cookie for selected org
  const cookieStore = await cookies();
  const selectedOrgId = cookieStore.get(ORG_COOKIE)?.value;

  let membership = dbUser.memberships[0];

  if (selectedOrgId) {
    const found = dbUser.memberships.find((m) => m.organizationId === selectedOrgId);
    if (found) {
      membership = found;
    }
  }

  const organization = membership.organization;
  const sub = organization.subscription;
  const isPro =
    sub?.plan === 'PRO' && (sub?.status === 'ACTIVE' || sub?.status === 'TRIALING');

  return {
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      subscription: organization.subscription,
      projects: organization.projects,
    },
    membership: {
      id: membership.id,
      role: membership.role,
    },
    isPro,
  };
}

/**
 * Get all workspaces for a user (for the switcher dropdown).
 */
export async function getUserWorkspaces(userEmail: string) {
  const dbUser = await prisma.user.findUnique({
    where: { email: userEmail },
    include: {
      memberships: {
        include: {
          organization: {
            select: { id: true, name: true, slug: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!dbUser) return [];

  return dbUser.memberships.map((m) => ({
    id: m.organization.id,
    name: m.organization.name,
    slug: m.organization.slug,
    role: m.role,
  }));
}
