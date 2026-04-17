import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { getActiveOrganization } from '@/lib/auth';
import { generateApiKey, invalidateApiKeyCache } from '@/lib/api-auth';
import { orgManagementLimiter } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // CSRF protection — custom header cannot be sent cross-origin by form POSTs
    if (!request.headers.get('x-requested-with')) {
      return NextResponse.json({ error: 'Missing required header' }, { status: 403 });
    }

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

    // RBAC: block VIEWER role
    if (activeOrg?.membership.role === 'VIEWER') {
      return NextResponse.json({ error: 'Viewers cannot regenerate API keys' }, { status: 403 });
    }

    // Rate limit by user ID
    const { success: withinLimit } = await orgManagementLimiter.limit(user.id);
    if (!withinLimit) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
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

    // Revoke all existing keys. Capture the hashes first so we can evict
    // them from the in-process auth cache — without this, revoked keys
    // continue to authenticate on warm Lambdas for up to one cache TTL.
    const revokedHashes = project.apiKeys.map((k) => k.keyHash);
    await prisma.apiKey.updateMany({
      where: { projectId: project.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    for (const hash of revokedHashes) {
      invalidateApiKeyCache(hash);
    }

    // Generate new key
    const { key, hash } = generateApiKey('live');
    const keyPrefix = key.substring(0, 10) + '...';

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
    console.error(
      'POST /api/projects/[slug]/regenerate-key error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json({ error: 'Failed to regenerate key' }, { status: 500 });
  }
}
