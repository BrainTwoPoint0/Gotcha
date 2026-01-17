import { NextRequest, NextResponse } from 'next/server';

/**
 * Demo endpoint - accepts any submission and returns success
 * Used for the SDK variants showcase page
 */
export async function POST(request: NextRequest) {
  // Simulate a small delay like a real API
  await new Promise((resolve) => setTimeout(resolve, 300));

  const body = await request.json();

  return NextResponse.json({
    id: `demo_${Date.now()}`,
    elementId: body.elementId || 'demo',
    mode: body.mode || 'feedback',
    status: 'received',
    createdAt: new Date().toISOString(),
  });
}
