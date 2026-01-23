import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createFieldSchema = z.object({
  fieldKey: z.string().min(1).max(100),
  displayName: z.string().max(200).optional(),
  fieldType: z.enum(['string', 'number', 'boolean']).default('string'),
  isActive: z.boolean().default(true),
});

const updateFieldSchema = z.object({
  displayName: z.string().max(200).optional(),
  fieldType: z.enum(['string', 'number', 'boolean']).optional(),
  isActive: z.boolean().optional(),
});

async function getProjectFromSlug(slug: string, organizationId: string) {
  return prisma.project.findFirst({
    where: {
      slug,
      organizationId,
    },
  });
}

async function getUserOrganization(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    include: {
      memberships: {
        include: {
          organization: true,
        },
      },
    },
  });

  return dbUser?.memberships[0]?.organization || null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const organization = await getUserOrganization(request);

    if (!organization) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const project = await getProjectFromSlug(slug, organization.id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const fields = await prisma.metadataField.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ fields });
  } catch (error) {
    console.error('GET /api/projects/[slug]/metadata-fields error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const organization = await getUserOrganization(request);

    if (!organization) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const project = await getProjectFromSlug(slug, organization.id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    const validation = createFieldSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Invalid request' },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Upsert the field
    const field = await prisma.metadataField.upsert({
      where: {
        projectId_fieldKey: {
          projectId: project.id,
          fieldKey: data.fieldKey,
        },
      },
      update: {
        displayName: data.displayName,
        fieldType: data.fieldType,
        isActive: data.isActive,
      },
      create: {
        projectId: project.id,
        fieldKey: data.fieldKey,
        displayName: data.displayName,
        fieldType: data.fieldType,
        isActive: data.isActive,
      },
    });

    return NextResponse.json({ field }, { status: 201 });
  } catch (error) {
    console.error('POST /api/projects/[slug]/metadata-fields error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const organization = await getUserOrganization(request);

    if (!organization) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const project = await getProjectFromSlug(slug, organization.id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    const fieldId = body.id;

    if (!fieldId) {
      return NextResponse.json({ error: 'Field ID is required' }, { status: 400 });
    }

    const validation = updateFieldSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message || 'Invalid request' },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verify field belongs to this project
    const existingField = await prisma.metadataField.findFirst({
      where: { id: fieldId, projectId: project.id },
    });

    if (!existingField) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    const field = await prisma.metadataField.update({
      where: { id: fieldId },
      data: {
        ...(data.displayName !== undefined && { displayName: data.displayName }),
        ...(data.fieldType !== undefined && { fieldType: data.fieldType }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return NextResponse.json({ field });
  } catch (error) {
    console.error('PATCH /api/projects/[slug]/metadata-fields error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const organization = await getUserOrganization(request);

    if (!organization) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const project = await getProjectFromSlug(slug, organization.id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const fieldId = searchParams.get('id');

    if (!fieldId) {
      return NextResponse.json({ error: 'Field ID is required' }, { status: 400 });
    }

    // Verify field belongs to this project
    const existingField = await prisma.metadataField.findFirst({
      where: { id: fieldId, projectId: project.id },
    });

    if (!existingField) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    await prisma.metadataField.delete({
      where: { id: fieldId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/projects/[slug]/metadata-fields error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
