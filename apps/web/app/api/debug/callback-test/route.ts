import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test Supabase
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Test Prisma
    const userCount = await prisma.user.count();

    return NextResponse.json({
      supabaseUser: user?.email || 'not logged in',
      prismaUserCount: userCount,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined,
      },
      { status: 500 }
    );
  }
}
