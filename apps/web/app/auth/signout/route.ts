import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Derive origin from the incoming request so signout lands on the same
  // host the user came in on — works on localhost, preview deploys, and
  // prod without depending on NEXT_PUBLIC_SITE_URL being set per env.
  // Next.js normalises request.url to the user-facing URL behind the
  // Netlify proxy, so this is safe in production too. Fallback to env /
  // canonical prod origin if request.url is somehow unparseable, so a
  // malformed URL can't 500 mid-signout.
  let origin: string;
  try {
    origin = new URL(request.url).origin;
  } catch {
    origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gotcha.cx';
  }

  // 303 See Other — tells the browser to follow the redirect with GET and
  // treat the resulting history entry as a GET response. Next.js's
  // NextResponse.redirect defaults to 307 Temporary Redirect, which
  // preserves the POST method semantically; Safari then marks the landing
  // page as "result of a form submission" and shows the "resend form?"
  // dialog on any reload or navigate-back. 303 is the spec-correct status
  // for POST-Redirect-GET (RFC 7231 §6.4.4).
  //
  // Cache-Control: no-store — this response carries Set-Cookie directives
  // that clear the Supabase session. 3xx responses are cacheable by default
  // under RFC 9111; a shared cache holding this response could deliver
  // someone's signout headers to a different user.
  const response = NextResponse.redirect(`${origin}/login`, 303);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
