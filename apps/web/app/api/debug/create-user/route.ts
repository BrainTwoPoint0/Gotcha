import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email },
      include: {
        memberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (existingUser) {
      return NextResponse.json({
        status: 'exists',
        user: existingUser,
      });
    }

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        avatarUrl: user.user_metadata?.avatar_url || null,
      },
    });

    // Create organization
    const orgSlug = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
    const organization = await prisma.organization.create({
      data: {
        name: `${newUser.name || 'My'}'s Organization`,
        slug: `${orgSlug}-${Date.now()}`,
        members: {
          create: {
            userId: newUser.id,
            role: 'OWNER',
          },
        },
        subscription: {
          create: {
            plan: 'FREE',
            status: 'ACTIVE',
          },
        },
      },
    });

    return NextResponse.json({
      status: 'created',
      user: newUser,
      organization,
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined,
    }, { status: 500 });
  }
}
