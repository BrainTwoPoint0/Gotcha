import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrganization } from '@/lib/auth';

const VALID_STATUSES = ['NEW', 'REVIEWED', 'ADDRESSED', 'ARCHIVED'] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Auth
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activeOrg = await getActiveOrganization(user.email);
    if (!activeOrg) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organization } = activeOrg;

    // Validate body
    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { id: true },
    });

    // Verify response belongs to this organization
    const response = await prisma.response.findFirst({
      where: {
        id,
        project: { organizationId: organization.id },
      },
    });

    if (!response) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 });
    }

    // Update status
    const updated = await prisma.response.update({
      where: { id },
      data: {
        status,
        ...(status !== 'NEW' && {
          reviewedAt: new Date(),
          reviewedBy: dbUser!.id,
        }),
        ...(status === 'NEW' && {
          reviewedAt: null,
          reviewedBy: null,
        }),
      },
      select: {
        id: true,
        status: true,
        reviewedAt: true,
        reviewedBy: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH /api/responses/[id]/status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
