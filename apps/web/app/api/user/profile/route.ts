import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { updateProfileSchema } from '@/lib/validations';

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateProfileSchema.parse(body);

    const data: Record<string, unknown> = {};

    if (parsed.name !== undefined) {
      data.name = parsed.name.trim() || null;
    }
    if (parsed.companySize !== undefined) {
      data.companySize = parsed.companySize;
    }
    if (parsed.role !== undefined) {
      data.role = parsed.role;
    }
    if (parsed.industry !== undefined) {
      data.industry = parsed.industry;
    }
    if (parsed.useCase !== undefined) {
      data.useCase = parsed.useCase;
    }
    if (parsed.onboardedAt) {
      data.onboardedAt = new Date();
    }

    const updatedUser = await prisma.user.update({
      where: { email: user.email! },
      data,
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
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

    const fields = ['companySize', 'role', 'industry', 'useCase'] as const;

    const [totalUsers, ...groupResults] = await Promise.all([
      prisma.user.count(),
      ...fields.map((field) =>
        prisma.user.groupBy({
          by: [field],
          _count: { [field]: true },
          where: { [field]: { not: null } },
        })
      ),
    ]);

    const aggregates: Record<string, { value: string; count: number }[]> = {};
    fields.forEach((field, i) => {
      aggregates[field] = (groupResults[i] as Record<string, unknown>[]).map((row) => ({
        value: row[field] as string,
        count: (row._count as Record<string, number>)[field],
      }));
    });

    return NextResponse.json({ totalUsers, aggregates });
  } catch (error) {
    console.error('Error fetching insights:', error);
    return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 });
  }
}
