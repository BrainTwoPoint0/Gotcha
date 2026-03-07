import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://gotcha.cx';
  const cookieStore = await cookies();

  // Read token from cookie (preferred) or URL param (fallback for backward compat)
  const token = cookieStore.get('gotcha_invite')?.value || searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(`${origin}/login?error=invalid_invite`);
  }

  // Find the invitation
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { organization: true },
  });

  if (!invitation) {
    return NextResponse.redirect(`${origin}/login?error=invite_not_found`);
  }

  if (invitation.status !== 'PENDING') {
    return NextResponse.redirect(`${origin}/login?error=invite_${invitation.status.toLowerCase()}`);
  }

  if (invitation.expiresAt < new Date()) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'EXPIRED' },
    });
    return NextResponse.redirect(`${origin}/login?error=invite_expired`);
  }

  // Check if user is logged in
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    // Not logged in — store token in httpOnly cookie and redirect to login (no token in URL)
    const response = NextResponse.redirect(`${origin}/login`);
    response.cookies.set('gotcha_invite', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60, // 1 hour
    });
    response.cookies.set('gotcha_has_invite', '1', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60,
    });
    return response;
  }

  // Verify the email matches the invitation
  if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    return NextResponse.redirect(`${origin}/dashboard?error=invite_email_mismatch`);
  }

  // Ensure user exists in Prisma
  let dbUser = await prisma.user.findUnique({
    where: { email: user.email },
  });

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        avatarUrl: user.user_metadata?.avatar_url || null,
      },
    });
  }

  // Check if already a member
  const existingMembership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: invitation.organizationId,
        userId: dbUser.id,
      },
    },
  });

  if (existingMembership) {
    // Already a member — just mark invite as accepted
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED' },
    });
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  // Add user to organization and mark invite as accepted
  try {
    await prisma.$transaction([
      prisma.organizationMember.create({
        data: {
          organizationId: invitation.organizationId,
          userId: dbUser.id,
          role: invitation.role,
        },
      }),
      prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      }),
    ]);
  } catch (err: unknown) {
    // Handle race condition: membership already created by concurrent request
    const isUniqueViolation = err instanceof Error && err.message.includes('Unique constraint');
    if (isUniqueViolation) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      });
    } else {
      throw err;
    }
  }

  // Clear invite cookies
  const response = NextResponse.redirect(`${origin}/dashboard`);
  response.cookies.delete('gotcha_invite');
  response.cookies.delete('gotcha_has_invite');
  return response;
}
