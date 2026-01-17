import { NextResponse } from 'next/server';

export async function GET() {
  const results: Record<string, string> = {};

  // Test Prisma import
  try {
    const { prisma } = await import('@/lib/prisma');
    await prisma.$queryRaw`SELECT 1`;
    results.prisma = 'ok';
  } catch (e) {
    results.prisma = e instanceof Error ? e.message : 'failed';
  }

  // Test Supabase server import
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    results.supabase = 'ok';
  } catch (e) {
    results.supabase = e instanceof Error ? e.message : 'failed';
  }

  return NextResponse.json(results);
}
