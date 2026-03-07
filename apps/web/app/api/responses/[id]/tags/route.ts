import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrganization } from '@/lib/auth';

const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 30;

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

    const { organization, isPro, membership } = activeOrg;

    if (membership.role === 'VIEWER') {
      return NextResponse.json({ error: 'Viewers cannot modify tags' }, { status: 403 });
    }

    // PRO only
    if (!isPro) {
      return NextResponse.json({ error: 'Tags are a Pro feature' }, { status: 403 });
    }

    // Validate body
    const body = await request.json();
    const { tags } = body;

    if (!Array.isArray(tags)) {
      return NextResponse.json({ error: 'tags must be an array of strings' }, { status: 400 });
    }

    if (tags.length > MAX_TAGS) {
      return NextResponse.json({ error: `Maximum ${MAX_TAGS} tags allowed` }, { status: 400 });
    }

    // Sanitize tags: lowercase, trim, dedupe, validate length
    const filtered = tags
      .filter((t): t is string => typeof t === 'string')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0 && t.length <= MAX_TAG_LENGTH);
    const cleanTags = filtered.filter((t, i) => filtered.indexOf(t) === i);

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

    // Update tags
    const updated = await prisma.response.update({
      where: { id },
      data: { tags: cleanTags },
      select: { id: true, tags: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH /api/responses/[id]/tags error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
