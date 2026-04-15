import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySuppressionToken } from '@/lib/notify-token';

/**
 * Public unsubscribe endpoint for shipped-notification emails.
 *
 * GET — renders a confirmation page with a POST form. We deliberately do NOT
 * auto-suppress on GET because mail scanners (Outlook ATP, Proofpoint, Mimecast)
 * eagerly fetch unsubscribe URLs at delivery time and would silently
 * suppress every recipient. Two-click for humans, uncallable by scanners.
 *
 * POST — performs the suppression. Used by:
 *   - the confirm form on the GET page (browser submit)
 *   - RFC 8058 one-click via `List-Unsubscribe-Post: List-Unsubscribe=One-Click`
 *
 * No auth — the signed token is the auth.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('t');
  if (!token) {
    return invalidLinkPage();
  }
  const verified = verifySuppressionToken(token);
  if (!verified) {
    return invalidLinkPage();
  }

  const safeEmail = escapeHtml(verified.email);
  const safeToken = escapeHtml(token);
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Unsubscribe</title></head>
    <body style="font-family:Georgia,serif;max-width:560px;margin:64px auto;padding:0 24px;color:#1A1714;">
      <h1 style="font-weight:400;font-size:28px;margin:0 0 16px 0;">
        Stop notify-back emails for <em>${safeEmail}</em>?
      </h1>
      <p style="line-height:1.6;color:#4b5563;">
        We'll stop emailing this address when feedback ships on this project.
        Your past feedback is not affected.
      </p>
      <form method="POST" action="/api/notify/unsubscribe" style="margin-top:24px;">
        <input type="hidden" name="t" value="${safeToken}" />
        <button type="submit" style="font-family:inherit;font-size:14px;padding:10px 18px;background:#1A1714;color:#FAF8F4;border:none;border-radius:4px;cursor:pointer;">
          Confirm unsubscribe
        </button>
      </form>
    </body></html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export async function POST(request: NextRequest) {
  // RFC 8058 one-click — token can come in querystring or form body.
  const url = new URL(request.url);
  let token = url.searchParams.get('t');
  if (!token) {
    try {
      const form = await request.formData();
      const v = form.get('t');
      if (typeof v === 'string') token = v;
    } catch {
      /* not form-encoded — fall through */
    }
  }

  const verified = token ? verifySuppressionToken(token) : null;
  if (!verified) {
    // Distinguish the JSON one-click path from the human form submission by
    // sniffing the Accept header — both should land on a sensible response.
    const wantsHtml = (request.headers.get('accept') || '').includes('text/html');
    return wantsHtml ? invalidLinkPage(400) : NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    await prisma.submitterSuppression.upsert({
      where: {
        projectId_email: {
          projectId: verified.projectId,
          email: verified.email,
        },
      },
      update: {},
      create: {
        projectId: verified.projectId,
        email: verified.email,
      },
    });
  } catch (err) {
    console.error('Failed to write SubmitterSuppression:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const wantsHtml = (request.headers.get('accept') || '').includes('text/html');
  if (wantsHtml) {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Unsubscribed</title></head>
      <body style="font-family:Georgia,serif;max-width:560px;margin:64px auto;padding:0 24px;color:#1A1714;">
        <h1 style="font-weight:400;font-size:28px;margin:0 0 16px 0;">You're unsubscribed.</h1>
        <p style="line-height:1.6;color:#4b5563;">
          We won't email <em>${escapeHtml(verified.email)}</em> when feedback ships
          on this project.
        </p>
      </body></html>`;
    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
  return NextResponse.json({ ok: true });
}

function invalidLinkPage(status: number = 400): NextResponse {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Invalid link</title></head>
    <body style="font-family:Georgia,serif;max-width:560px;margin:64px auto;padding:0 24px;color:#1A1714;">
      <h1 style="font-weight:400;font-size:28px;margin:0 0 16px 0;">This link is no longer valid.</h1>
      <p style="line-height:1.6;color:#4b5563;">
        If you keep getting unwanted email, reply to one and ask the sender to remove you.
      </p>
    </body></html>`;
  return new NextResponse(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
