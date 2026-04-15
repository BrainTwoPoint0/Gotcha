import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrganization } from '@/lib/auth';

/**
 * Lightweight dashboard-only endpoint for the first-run "Listening" tile.
 * Returns whether the active org has any responses yet — flips the static
 * pulsing dot into a "First response received →" CTA the moment the first
 * submission lands.
 *
 * Returns { hasAny: boolean }. No PII, no payloads — just an existence
 * signal. Auth-gated (no API key surface) so it can't be polled anonymously.
 *
 * Cheap: an indexed `findFirst` with `select: {id: true}` against a
 * pre-existing index on (projectId). No new DB load worth worrying about.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
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
      return NextResponse.json({ hasAny: false });
    }

    const found = await prisma.response.findFirst({
      where: { project: { organizationId: activeOrg.organization.id } },
      select: { id: true },
    });

    return NextResponse.json({ hasAny: !!found });
  } catch (error) {
    console.error('GET /api/responses/has-any error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
