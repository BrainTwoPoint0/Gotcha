import { NextRequest, NextResponse } from 'next/server';

/**
 * Demo endpoint - accepts any submission and returns success
 * Used for the SDK variants showcase page
 */
export async function POST(request: NextRequest) {
  try {
    // Simulate a small delay like a real API
    await new Promise((resolve) => setTimeout(resolve, 300));

    const body = await request.json();
    const elementId = typeof body.elementId === 'string' ? body.elementId.slice(0, 200) : 'demo';
    const mode = typeof body.mode === 'string' ? body.mode.slice(0, 50) : 'feedback';

    return NextResponse.json({
      id: `demo_${Date.now()}`,
      elementId,
      mode,
      status: 'received',
      createdAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_REQUEST', message: 'Invalid request body' } },
      { status: 400 }
    );
  }
}
