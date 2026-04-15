import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrganization } from '@/lib/auth';

const INTRO_MAX_LEN = 280;

interface ProjectSettings {
  roadmapEnabled?: boolean;
  roadmapIntro?: string;
  [key: string]: unknown;
}

/**
 * PATCH /api/projects/[slug]/roadmap
 *
 * Toggles the public roadmap surface for a project, plus an optional intro
 * blurb rendered above the kanban. Writes to `project.settings` JSON to
 * avoid schema churn for what is fundamentally a UI flag.
 *
 * Public-slug collision: Project.slug is unique only per org. The public
 * route uses slug-only lookup, so two orgs cannot both enable on the same
 * slug. A partial unique DB index enforces this; this handler pre-checks
 * for friendlier 409 error UX.
 *
 * RBAC: any non-VIEWER member can toggle. CSRF guarded via X-Requested-With.
 *
 * On any state change, revalidates `/roadmap/[slug]` so the ISR cache
 * picks up the toggle within the same request instead of after 1h.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!request.headers.get('x-requested-with')) {
    return NextResponse.json({ error: 'Missing required header' }, { status: 403 });
  }

  try {
    const { slug } = await params;

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
    if (activeOrg.membership.role === 'VIEWER') {
      return NextResponse.json({ error: 'Viewers cannot edit project settings' }, { status: 403 });
    }

    const body = (await request.json()) as { enabled?: unknown; intro?: unknown };

    // Reject empty body — avoids confusing 200-with-no-changes responses.
    if (body.enabled === undefined && body.intro === undefined) {
      return NextResponse.json(
        { error: 'Provide at least one of `enabled` or `intro`' },
        { status: 400 }
      );
    }

    if (body.enabled !== undefined && typeof body.enabled !== 'boolean') {
      return NextResponse.json({ error: '`enabled` must be a boolean' }, { status: 400 });
    }
    let cleanedIntro: string | null | undefined;
    if (body.intro !== undefined) {
      if (body.intro === null) {
        cleanedIntro = null;
      } else if (typeof body.intro !== 'string') {
        return NextResponse.json({ error: '`intro` must be a string or null' }, { status: 400 });
      } else {
        const t = body.intro.trim();
        if (t.length > INTRO_MAX_LEN) {
          return NextResponse.json(
            { error: `Intro too long (max ${INTRO_MAX_LEN} characters)` },
            { status: 400 }
          );
        }
        cleanedIntro = t.length === 0 ? null : t;
      }
    }

    const project = await prisma.project.findUnique({
      where: {
        organizationId_slug: {
          organizationId: activeOrg.organization.id,
          slug,
        },
      },
      select: { id: true, settings: true },
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const current = (project.settings as ProjectSettings | null) ?? {};

    // Pre-check public-slug collision when the caller is enabling the
    // roadmap. The DB partial unique index also enforces this — this
    // pre-check just gives a friendlier error than a Prisma constraint
    // violation. Race-wise: if two enables land concurrently, one will
    // bypass this check but the unique index will reject the second
    // update; we surface that as a 409 below via the catch.
    if (body.enabled === true && current.roadmapEnabled !== true) {
      const collision = await prisma.project.findFirst({
        where: {
          slug,
          id: { not: project.id },
        },
        select: {
          id: true,
          settings: true,
        },
      });
      if (collision && (collision.settings as ProjectSettings | null)?.roadmapEnabled === true) {
        return NextResponse.json(
          {
            error: `Slug "${slug}" is already in use as a public roadmap by another team. Rename your project to publish.`,
          },
          { status: 409 }
        );
      }
    }

    const next: ProjectSettings = {
      ...current,
      ...(body.enabled !== undefined && { roadmapEnabled: body.enabled }),
      ...(cleanedIntro !== undefined && { roadmapIntro: cleanedIntro ?? undefined }),
    };
    if (cleanedIntro === null) {
      delete next.roadmapIntro;
    }

    let updated;
    try {
      updated = await prisma.project.update({
        where: { id: project.id },
        data: { settings: next as object },
        select: { settings: true },
      });
    } catch (err) {
      // Unique-constraint violation from Project_public_slug_unique — caller
      // raced another team enabling the same slug. Map to 409.
      if (err instanceof Error && /Project_public_slug_unique/.test(err.message)) {
        return NextResponse.json(
          { error: 'Another team just claimed this slug as a public roadmap.' },
          { status: 409 }
        );
      }
      throw err;
    }

    // Bust the ISR cache so the toggle / intro change is visible immediately
    // on the public surface instead of waiting up to an hour.
    try {
      revalidatePath(`/roadmap/${slug}`);
    } catch {
      /* no-op outside Next request context (tests) */
    }

    const finalSettings = (updated.settings as ProjectSettings | null) ?? {};
    return NextResponse.json({
      enabled: !!finalSettings.roadmapEnabled,
      intro: finalSettings.roadmapIntro ?? null,
    });
  } catch (error) {
    console.error('PATCH /api/projects/[slug]/roadmap error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
