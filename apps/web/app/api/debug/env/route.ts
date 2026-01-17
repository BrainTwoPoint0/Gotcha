import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasDbUrl: !!process.env.DATABASE_URL,
    dbUrlStart: process.env.DATABASE_URL?.substring(0, 50) + '...',
    dbUrlLength: process.env.DATABASE_URL?.length,
    nodeEnv: process.env.NODE_ENV,
  });
}
