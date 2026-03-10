import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { getActiveOrganization } from '@/lib/auth';
import { generateApiKey } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activeOrg = user.email ? await getActiveOrganization(user.email) : null;
    const organization = activeOrg?.organization;

    if (!organization) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
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
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Revoke all existing keys
    await prisma.apiKey.updateMany({
      where: { projectId: project.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    // Generate new key
    const { key, hash } = generateApiKey('live');
    const keyPrefix = key.substring(0, 15) + '...';

    await prisma.apiKey.create({
      data: {
        projectId: project.id,
        name: 'Production',
        key: keyPrefix,
        keyHash: hash,
        allowedDomains: [],
      },
    });

    return NextResponse.json({ apiKey: key });
  } catch (error) {
    console.error('POST /api/projects/[slug]/regenerate-key error:', error);
    return NextResponse.json({ error: 'Failed to regenerate key' }, { status: 500 });
  }
}
