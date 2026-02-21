import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      include: {
        memberships: {
          include: { organization: true },
        },
      },
    });

    if (!dbUser || !dbUser.memberships[0]) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const membership = dbUser.memberships[0];

    // Only admins and owners can update organization
    if (membership.role !== 'ADMIN' && membership.role !== 'OWNER') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const { name, slug } = body;

    // Validate inputs
    if (typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
    }

    if (name.length > 200) {
      return NextResponse.json({ error: 'Organization name too long (max 200 chars)' }, { status: 400 });
    }

    if (typeof slug !== 'string' || slug.trim().length === 0) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    if (slug.length > 100) {
      return NextResponse.json({ error: 'Slug too long (max 100 chars)' }, { status: 400 });
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'Slug can only contain lowercase letters, numbers, and hyphens' },
        { status: 400 }
      );
    }

    // Check if slug is already taken by another organization
    const existingOrg = await prisma.organization.findUnique({
      where: { slug },
    });

    if (existingOrg && existingOrg.id !== membership.organizationId) {
      return NextResponse.json({ error: 'This slug is already taken' }, { status: 400 });
    }

    const updatedOrg = await prisma.organization.update({
      where: { id: membership.organizationId },
      data: {
        name: name.trim(),
        slug: slug.trim(),
      },
    });

    return NextResponse.json({ success: true, organization: updatedOrg });
  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 });
  }
}
