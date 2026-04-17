import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrganization } from '@/lib/auth';
import { createScreenshotSignedUrl } from '@/lib/screenshots';

/**
 * Exchange a response id for a short-lived signed URL to its stored
 * screenshot. Follows the same auth + org-scope pattern as the sibling
 * status and title routes so the bucket itself stays locked down by RLS.
 *
 * The dashboard calls this lazily when a bug detail / response row is
 * expanded — we never embed the signed URL in server-rendered HTML so
 * refreshes don't require regenerating every link upfront.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organization } = activeOrg;

    // Ownership check — same pattern as the status/title/tags siblings. Must
    // run BEFORE we generate a signed URL so a non-member can't exchange a
    // known response id for access to the bucket object.
    const response = await prisma.response.findFirst({
      where: {
        id,
        project: { organizationId: organization.id },
      },
      select: {
        id: true,
        screenshotPath: true,
        screenshotCapturedAt: true,
      },
    });

    if (!response) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 });
    }

    if (!response.screenshotPath) {
      return NextResponse.json({ error: 'No screenshot attached' }, { status: 404 });
    }

    const signed = await createScreenshotSignedUrl(response.screenshotPath);
    if (!signed) {
      return NextResponse.json({ error: 'Unable to generate signed URL' }, { status: 500 });
    }

    return NextResponse.json(
      {
        url: signed.url,
        expiresAt: signed.expiresAt,
        capturedAt: response.screenshotCapturedAt?.toISOString() ?? null,
      },
      {
        headers: {
          // Signed URL is a capability token — don't let intermediate
          // proxies or the browser history cache it.
          'Cache-Control': 'private, no-store',
        },
      }
    );
  } catch (error) {
    console.error('GET /api/responses/[id]/screenshot', {
      code: (error as { code?: string })?.code,
      message: error instanceof Error ? error.message : 'unknown',
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
