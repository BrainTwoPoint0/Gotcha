import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { getActiveOrganization } from '@/lib/auth';
import { generateApiKey } from '@/lib/api-auth';
import { isOverProjectLimit } from '@/lib/plan-limits';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }
    if (name.length > 200) {
      return NextResponse.json({ error: 'Project name too long (max 200 chars)' }, { status: 400 });
    }
    if (description && typeof description === 'string' && description.length > 2000) {
      return NextResponse.json({ error: 'Description too long (max 2000 chars)' }, { status: 400 });
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Get or create user and organization
    let activeOrg = await getActiveOrganization(user.email!);

    // If no org exists, create user + organization
    if (!activeOrg) {
      const newOrg = await prisma.organization.create({
        data: {
          name: `${user.email?.split('@')[0]}'s Organization`,
          slug: `org-${Date.now()}`,
        },
      });

      await prisma.user.upsert({
        where: { email: user.email! },
        update: {
          memberships: {
            create: {
              organizationId: newOrg.id,
              role: 'OWNER',
            },
          },
        },
        create: {
          email: user.email!,
          name: user.user_metadata?.full_name || user.email?.split('@')[0],
          memberships: {
            create: {
              organizationId: newOrg.id,
              role: 'OWNER',
            },
          },
        },
      });

      await prisma.subscription.create({
        data: {
          organizationId: newOrg.id,
          plan: 'FREE',
          status: 'ACTIVE',
          responsesResetAt: new Date(),
        },
      });

      activeOrg = await getActiveOrganization(user.email!);
    }

    if (!activeOrg) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 500 });
    }

    const organization = activeOrg.organization;

    // Check project limit
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId: organization.id },
    });

    const projectCount = await prisma.project.count({
      where: { organizationId: organization.id },
    });

    const plan = subscription?.plan || 'FREE';
    if (isOverProjectLimit(plan, projectCount)) {
      return NextResponse.json(
        {
          error: 'Project limit reached. Upgrade to Pro for unlimited projects.',
          code: 'PROJECT_LIMIT_REACHED',
        },
        { status: 403 }
      );
    }

    // Check if project slug already exists
    const existingProject = await prisma.project.findUnique({
      where: {
        organizationId_slug: {
          organizationId: organization.id,
          slug,
        },
      },
    });

    if (existingProject) {
      return NextResponse.json(
        { error: 'A project with this name already exists' },
        { status: 400 }
      );
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        organizationId: organization.id,
        name: name.trim(),
        slug,
        description: description?.trim() || null,
      },
    });

    // Generate initial API key
    const { key, hash } = generateApiKey('live');

    // Store only hash + truncated prefix (never the full plaintext key)
    const keyPrefix = key.substring(0, 15) + '...';
    await prisma.apiKey.create({
      data: {
        projectId: project.id,
        name: 'Production',
        key: keyPrefix,
        keyHash: hash,
        allowedDomains: [],
      },
    });

    return NextResponse.json({
      id: project.id,
      name: project.name,
      slug: project.slug,
      apiKey: key, // Return the key only on creation
    });
  } catch (error) {
    console.error('POST /api/projects error:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activeOrg = await getActiveOrganization(user.email!);
    if (!activeOrg) {
      return NextResponse.json([]);
    }

    const projects = await prisma.project.findMany({
      where: { organizationId: activeOrg.organization.id },
      include: {
        _count: {
          select: { responses: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('GET /api/projects error:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}
