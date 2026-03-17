import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrganization } from '@/lib/auth';
import { orgManagementLimiter } from '@/lib/rate-limit';

const ELEMENT_ID_REGEX = /^[\w\-.]+$/;
const MAX_ELEMENT_ID_LENGTH = 200;
const MAX_ARCHIVED_ELEMENTS = 500;

function validateElementId(elementId: unknown): string | null {
  if (!elementId || typeof elementId !== 'string') return 'elementId is required';
  if (elementId.length > MAX_ELEMENT_ID_LENGTH) return 'elementId is too long';
  if (!ELEMENT_ID_REGEX.test(elementId)) return 'elementId contains invalid characters';
  return null;
}

export async function POST(request: NextRequest) {
  try {
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

    const { organization, membership } = activeOrg;

    if (membership.role === 'VIEWER') {
      return NextResponse.json({ error: 'Viewers cannot archive elements' }, { status: 403 });
    }

    // Rate limit: 20 archive actions per hour
    const { success: rateLimitOk } = await orgManagementLimiter.limit(`archive:${user.email}`);
    if (!rateLimitOk) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const { elementId } = body;

    const validationError = validateElementId(elementId);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Atomic: append only if not already present AND under cap
    const rowsUpdated = await prisma.$executeRaw`
      UPDATE "Organization"
      SET "archivedElementIds" = array_append("archivedElementIds", ${elementId})
      WHERE id = ${organization.id}
        AND NOT (${elementId} = ANY("archivedElementIds"))
        AND COALESCE(array_length("archivedElementIds", 1), 0) < ${MAX_ARCHIVED_ELEMENTS}
    `;

    if (rowsUpdated === 0) {
      // Check why: already archived or cap reached
      const org = await prisma.organization.findUnique({
        where: { id: organization.id },
        select: { archivedElementIds: true },
      });
      if (org?.archivedElementIds.includes(elementId)) {
        return NextResponse.json({ ok: true }); // idempotent
      }
      return NextResponse.json(
        { error: `Cannot archive more than ${MAX_ARCHIVED_ELEMENTS} elements` },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('POST /api/elements/archive error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
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

    const { organization, membership } = activeOrg;

    if (membership.role === 'VIEWER') {
      return NextResponse.json({ error: 'Viewers cannot unarchive elements' }, { status: 403 });
    }

    // Rate limit: 20 archive actions per hour
    const { success: rateLimitOk } = await orgManagementLimiter.limit(`archive:${user.email}`);
    if (!rateLimitOk) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const { elementId } = body;

    const validationError = validateElementId(elementId);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Atomic: remove element from array
    await prisma.$executeRaw`
      UPDATE "Organization"
      SET "archivedElementIds" = array_remove("archivedElementIds", ${elementId})
      WHERE id = ${organization.id}
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('DELETE /api/elements/archive error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
