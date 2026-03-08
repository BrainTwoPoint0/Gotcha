import { prisma } from '@/lib/prisma';
import { resend, FROM_EMAIL } from '@/lib/resend';
import {
  welcomeEmail,
  proActivatedEmail,
  usageWarningEmail,
  bugReportEmail,
  bugResolutionEmail,
  bugUpdateEmail,
  inviteEmail,
} from './templates';

interface User {
  email: string;
  name: string | null;
}

interface BugData {
  id: string;
  title: string;
  description: string;
  elementId: string;
  pageUrl: string | null;
  projectId: string;
}

async function getOrganizationOwner(
  organizationId: string
): Promise<{ email: string; name: string | null; orgName: string } | null> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      members: {
        where: { role: 'OWNER' },
        include: { user: true },
        take: 1,
      },
    },
  });

  if (!org || !org.members[0]) return null;

  return {
    email: org.members[0].user.email,
    name: org.members[0].user.name,
    orgName: org.name,
  };
}

export async function sendWelcomeEmail(user: User): Promise<void> {
  try {
    const { subject, html } = welcomeEmail({ name: user.name || '' });

    await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject,
      html,
    });

    console.log(`Welcome email sent to ${user.email}`);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
}

export async function sendProActivatedEmail(organizationId: string): Promise<void> {
  try {
    const owner = await getOrganizationOwner(organizationId);
    if (!owner) {
      console.error('No owner found for organization:', organizationId);
      return;
    }

    const { subject, html } = proActivatedEmail({
      name: owner.name || '',
      orgName: owner.orgName,
    });

    await resend.emails.send({
      from: FROM_EMAIL,
      to: owner.email,
      subject,
      html,
    });

    console.log(`Pro activated email sent to ${owner.email}`);
  } catch (error) {
    console.error('Failed to send pro activated email:', error);
  }
}

export async function sendUsageWarningEmail(
  organizationId: string,
  current: number,
  limit: number
): Promise<void> {
  try {
    const owner = await getOrganizationOwner(organizationId);
    if (!owner) {
      console.error('No owner found for organization:', organizationId);
      return;
    }

    const percentage = Math.round((current / limit) * 100);

    const { subject, html } = usageWarningEmail({
      name: owner.name || '',
      current,
      limit,
      percentage,
    });

    await resend.emails.send({
      from: FROM_EMAIL,
      to: owner.email,
      subject,
      html,
    });

    console.log(`Usage warning email sent to ${owner.email}`);
  } catch (error) {
    console.error('Failed to send usage warning email:', error);
  }
}

export async function sendBugReportEmail(organizationId: string, bug: BugData): Promise<void> {
  try {
    const owner = await getOrganizationOwner(organizationId);
    if (!owner) {
      console.error('No owner found for organization:', organizationId);
      return;
    }

    const project = await prisma.project.findUnique({
      where: { id: bug.projectId },
      select: { name: true },
    });

    const { subject, html } = bugReportEmail({
      name: owner.name || '',
      projectName: project?.name || 'Unknown Project',
      title: bug.title,
      description: bug.description,
      elementId: bug.elementId,
      pageUrl: bug.pageUrl,
      bugId: bug.id,
    });

    await resend.emails.send({
      from: FROM_EMAIL,
      to: owner.email,
      subject,
      html,
    });

    console.log(`Bug report email sent to ${owner.email}`);
  } catch (error) {
    console.error('Failed to send bug report email:', error);
  }
}

export async function sendInviteEmail({
  email,
  inviterName,
  orgName,
  role,
  token,
}: {
  email: string;
  inviterName: string;
  orgName: string;
  role: string;
  token: string;
}): Promise<void> {
  try {
    const acceptUrl = `https://gotcha.cx/api/invitations/accept?token=${token}`;
    const { subject, html } = inviteEmail({ inviterName, orgName, role, acceptUrl });

    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html,
    });

    console.log(`Invite email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send invite email:', error);
  }
}

export async function sendBugUpdateEmail({
  reporterEmail,
  reporterName,
  projectId,
  bugTitle,
  note,
  authorName,
}: {
  reporterEmail: string;
  reporterName: string | null;
  projectId: string;
  bugTitle: string;
  note: string;
  authorName: string;
}): Promise<void> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true },
    });

    const { subject, html } = bugUpdateEmail({
      reporterName,
      projectName: project?.name || 'Unknown Project',
      bugTitle,
      note,
      authorName,
    });

    await resend.emails.send({
      from: FROM_EMAIL,
      to: reporterEmail,
      subject,
      html,
    });

    console.log(`Bug update email sent to ${reporterEmail}`);
  } catch (error) {
    console.error('Failed to send bug update email:', error);
  }
}

export async function sendBugResolutionEmail({
  reporterEmail,
  reporterName,
  projectId,
  bugTitle,
  message,
}: {
  reporterEmail: string;
  reporterName: string | null;
  projectId: string;
  bugTitle: string;
  message: string;
}): Promise<void> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true },
    });

    const { subject, html } = bugResolutionEmail({
      reporterName,
      projectName: project?.name || 'Unknown Project',
      bugTitle,
      message,
    });

    await resend.emails.send({
      from: FROM_EMAIL,
      to: reporterEmail,
      subject,
      html,
    });

    console.log(`Bug resolution email sent to ${reporterEmail}`);
  } catch (error) {
    console.error('Failed to send bug resolution email:', error);
  }
}
