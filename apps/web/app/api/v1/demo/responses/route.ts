import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * Demo endpoint - accepts any submission and returns success
 * Used for the SDK variants showcase page
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const rateLimit = await checkRateLimit(`demo:${ip}`, 'free');
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
        { status: 429 }
      );
    }

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
