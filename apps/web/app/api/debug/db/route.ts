import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'ok',
      message: 'Database connection successful',
      env: {
        hasDbUrl: !!process.env.DATABASE_URL,
        dbUrlStart: process.env.DATABASE_URL?.substring(0, 30) + '...',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        env: {
          hasDbUrl: !!process.env.DATABASE_URL,
          dbUrlStart: process.env.DATABASE_URL?.substring(0, 30) + '...',
        },
      },
      { status: 500 }
    );
  }
}
