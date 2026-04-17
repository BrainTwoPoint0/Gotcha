import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrganization } from '@/lib/auth';

// Kept in lockstep with the public roadmap's TITLE_MAX_LEN (apps/web/app/(public)/roadmap/[slug]/page.tsx).
// Headlines beyond this start to wrap the roadmap card and undermine the scan-at-a-glance promise.
const TITLE_MAX_LEN = 80;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { organization, membership } = activeOrg;

    if (membership.role === 'VIEWER') {
      return NextResponse.json({ error: 'Viewers cannot edit titles' }, { status: 403 });
    }

    const body = await request.json();
    const { title } = body as { title?: unknown };

    // Strip control chars, bidi overrides, zero-width chars, and collapse
    // internal whitespace. React escapes HTML, but a public roadmap card can
    // still be visually corrupted by U+202E (RLO) or zero-width joiners in a
    // user-supplied title. Runs after trim + before the length check.
    const sanitize = (s: string) =>
      s
        .trim()
        .replace(/[\u0000-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, '')
        .replace(/\s+/g, ' ');

    // Accept string or null. An empty / whitespace-only string collapses to null
    // so the public roadmap treats the row the same as "no title yet".
    let normalized: string | null;
    if (title === null || title === undefined) {
      normalized = null;
    } else if (typeof title === 'string') {
      const cleaned = sanitize(title);
      if (cleaned.length === 0) {
        normalized = null;
      } else if (cleaned.length > TITLE_MAX_LEN) {
        return NextResponse.json(
          { error: `Title too long (max ${TITLE_MAX_LEN} characters)` },
          { status: 400 }
        );
      } else {
        normalized = cleaned;
      }
    } else {
      return NextResponse.json({ error: 'title must be a string or null' }, { status: 400 });
    }

    // Ownership check — same scoping pattern as the status and tags endpoints.
    // The subsequent update() relies on this findFirst having proven the row
    // belongs to this org; don't swap the order.
    const response = await prisma.response.findFirst({
      where: {
        id,
        project: { organizationId: organization.id },
      },
      select: {
        id: true,
        title: true,
        project: { select: { slug: true } },
      },
    });

    if (!response) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 });
    }

    // No-op short-circuit — skip the write and the ISR invalidation when the
    // value hasn't actually changed. Protects the cache from being thrashed
    // by repeat saves / debounced blur events.
    if (response.title === normalized) {
      return NextResponse.json({ id: response.id, title: response.title });
    }

    const updated = await prisma.response.update({
      where: { id },
      data: { title: normalized },
      select: { id: true, title: true },
    });

    // Public roadmap is ISR-cached (revalidate: 3600). A title edit should show
    // up immediately for the admin previewing the page, so we bust the cache
    // for the slug the edit touched rather than waiting an hour.
    revalidatePath(`/roadmap/${response.project.slug}`);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH /api/responses/[id]/title', {
      code: (error as { code?: string })?.code,
      message: error instanceof Error ? error.message : 'unknown',
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
