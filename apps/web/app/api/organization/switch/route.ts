import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId } = await request.json();

    if (!organizationId || typeof organizationId !== 'string') {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    // Verify user is a member of this org
    const membership = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        user: { email: user.email! },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this workspace' }, { status: 403 });
    }

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('gotcha_org', organizationId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error switching workspace:', error);
    return NextResponse.json({ error: 'Failed to switch workspace' }, { status: 500 });
  }
}
