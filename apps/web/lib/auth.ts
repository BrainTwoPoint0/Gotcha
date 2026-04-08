import { cache } from 'react';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

const ORG_COOKIE = 'gotcha_org';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface ActiveOrg {
  organization: {
    id: string;
    name: string;
    slug: string;
    archivedElementIds: string[];
    subscription?: {
      plan: string;
      status: string;
      responsesThisMonth: number;
      stripeCustomerId?: string | null;
      stripeSubId?: string | null;
    } | null;
    projects?: { id: string }[];
  };
  membership: {
    id: string;
    role: string;
  };
  isPro: boolean;
  workspaces: Workspace[];
}

/**
 * Cached auth user lookup. Deduplicates supabase.auth.getUser()
 * across layout and page within a single request.
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * Uncached implementation — use getActiveOrganization for normal reads.
 * Only call this directly when you need a fresh DB read (e.g. after creating a new user/org).
 */
export async function fetchActiveOrganization(userEmail: string): Promise<ActiveOrg | null> {
  const dbUser = await prisma.user.findUnique({
    where: { email: userEmail },
    include: {
      memberships: {
        include: {
          organization: {
            include: {
              subscription: {
                select: {
                  plan: true,
                  status: true,
                  responsesThisMonth: true,
                  stripeCustomerId: true,
                  stripeSubId: true,
                },
              },
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
    sub?.plan === 'PRO' &&
    (sub?.status === 'ACTIVE' || sub?.status === 'TRIALING' || sub?.status === 'PAST_DUE');

  // Derive workspaces from the memberships we already fetched
  const workspaces: Workspace[] = dbUser.memberships.map((m) => ({
    id: m.organization.id,
    name: m.organization.name,
    slug: m.organization.slug,
    role: m.role,
  }));

  return {
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      archivedElementIds: organization.archivedElementIds,
      subscription: organization.subscription,
      projects: organization.projects,
    },
    membership: {
      id: membership.id,
      role: membership.role,
    },
    isPro,
    workspaces,
  };
}

/**
 * Cached version — deduplicates across layout + page within a single request.
 */
export const getActiveOrganization = cache(fetchActiveOrganization);

