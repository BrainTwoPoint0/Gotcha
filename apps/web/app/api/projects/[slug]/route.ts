import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { getActiveOrganization } from '@/lib/auth';
import { orgManagementLimiter } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
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

    // RBAC: require OWNER role for project deletion
    if (activeOrg?.membership.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only owners can delete projects' }, { status: 403 });
    }

    // Rate limit by user ID
    const { success: withinLimit } = await orgManagementLimiter.limit(user.id);
    if (!withinLimit) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { confirmName } = await request.json();

    const project = await prisma.project.findUnique({
      where: {
        organizationId_slug: {
          organizationId: organization.id,
          slug,
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (confirmName !== project.name) {
      return NextResponse.json({ error: 'Project name does not match' }, { status: 400 });
    }

    await prisma.project.delete({
      where: { id: project.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      'DELETE /api/projects/[slug] error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
