import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { getActiveOrganization } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { sendInviteEmail } from '@/lib/emails/send';

// List pending invitations
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activeOrg = await getActiveOrganization(user.email!);
    if (!activeOrg) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { organization } = activeOrg;

    const invitations = await prisma.invitation.findMany({
      where: {
        organizationId: organization.id,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      include: {
        invitedBy: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('Error listing invitations:', error);
    return NextResponse.json({ error: 'Failed to list invitations' }, { status: 500 });
  }
}

// Send a new invitation
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activeOrg = await getActiveOrganization(user.email!);
    if (!activeOrg) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { organization, membership } = activeOrg;

    // Only OWNER and ADMIN can invite
    if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
    });

    const body = await request.json();
    const { email, role } = body;

    // Validate email
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Validate role
    const allowedRoles = ['ADMIN', 'MEMBER', 'VIEWER'] as const;
    if (role && !allowedRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Can't invite yourself
    if (normalizedEmail === user.email) {
      return NextResponse.json({ error: 'You cannot invite yourself' }, { status: 400 });
    }

    // Check if already a member
    const existingMember = await prisma.organizationMember.findFirst({
      where: {
        organizationId: organization.id,
        user: { email: normalizedEmail },
      },
    });

    if (existingMember) {
      return NextResponse.json({ error: 'This person is already a member' }, { status: 400 });
    }

    // Check for existing pending invite
    const existingInvite = await prisma.invitation.findFirst({
      where: {
        organizationId: organization.id,
        email: normalizedEmail,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      return NextResponse.json({ error: 'An invitation has already been sent to this email' }, { status: 400 });
    }

    // Create invitation (expires in 7 days)
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await prisma.invitation.create({
      data: {
        organizationId: organization.id,
        email: normalizedEmail,
        role: role || 'MEMBER',
        token,
        invitedById: dbUser!.id,
        expiresAt,
      },
    });

    // Send invite email
    sendInviteEmail({
      email: normalizedEmail,
      inviterName: dbUser!.name || user.email!,
      orgName: organization.name,
      role: role || 'MEMBER',
      token,
    }).catch(console.error);

    return NextResponse.json({ invitation: { id: invitation.id, email: invitation.email, role: invitation.role } });
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
  }
}
