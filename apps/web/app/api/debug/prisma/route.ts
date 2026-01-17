import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Try to dynamically import Prisma to catch initialization errors
    const { prisma } = await import('@/lib/prisma');

    // Try a simple query
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'ok',
      message: 'Prisma connection successful',
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : undefined,
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined,
    }, { status: 500 });
  }
}
