import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { getActiveOrganization } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { orgManagementLimiter } from '@/lib/rate-limit';

// Update member role
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!request.headers.get('x-requested-with')) {
    return NextResponse.json({ error: 'Missing required header' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activeOrg = await getActiveOrganization(user.email);
    if (!activeOrg) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { organization, membership } = activeOrg;

    // Only OWNER can change roles
    if (membership.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only the owner can change roles' }, { status: 403 });
    }

    const { success: rateLimitOk } = await orgManagementLimiter.limit(`member:${user.email}`);
    if (!rateLimitOk) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const { role } = body;

    const allowedRoles = ['ADMIN', 'MEMBER', 'VIEWER'] as const;
    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Find the target member
    const targetMember = await prisma.organizationMember.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Can't change own role
    if (targetMember.id === membership.id) {
      return NextResponse.json({ error: 'You cannot change your own role' }, { status: 400 });
    }

    await prisma.organizationMember.update({
      where: { id },
      data: { role },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating member role:', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

// Remove member
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!request.headers.get('x-requested-with')) {
    return NextResponse.json({ error: 'Missing required header' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activeOrg = await getActiveOrganization(user.email);
    if (!activeOrg) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { organization, membership } = activeOrg;

    // Only OWNER can remove members
    if (membership.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only the owner can remove members' }, { status: 403 });
    }

    const { success: rateLimitOk } = await orgManagementLimiter.limit(`member:${user.email}`);
    if (!rateLimitOk) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
    }

    const targetMember = await prisma.organizationMember.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Can't remove yourself
    if (targetMember.id === membership.id) {
      return NextResponse.json({ error: 'You cannot remove yourself' }, { status: 400 });
    }

    await prisma.organizationMember.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
