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

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      select: {
        id: true,
        email: true,
        name: true,
        companySize: true,
        role: true,
        industry: true,
        useCase: true,
        onboardedAt: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: dbUser });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
