import { prisma } from '@/lib/prisma';
import { resend, FROM_EMAIL } from '@/lib/resend';
import {
  welcomeEmail,
  proActivatedEmail,
  usageWarningEmail,
  responseAlertEmail,
} from './templates';

interface User {
  email: string;
  name: string | null;
}

interface ResponseData {
  mode: string;
  content: string | null;
  title: string | null;
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

export async function sendResponseAlertEmail(
  organizationId: string,
  response: ResponseData
): Promise<void> {
  try {
    const owner = await getOrganizationOwner(organizationId);
    if (!owner) {
      console.error('No owner found for organization:', organizationId);
      return;
    }

    // Get project name
    const project = await prisma.project.findUnique({
      where: { id: response.projectId },
      select: { name: true },
    });

    const { subject, html } = responseAlertEmail({
      name: owner.name || '',
      projectName: project?.name || 'Unknown Project',
      responseType: response.mode,
      content: response.content || response.title,
    });

    await resend.emails.send({
      from: FROM_EMAIL,
      to: owner.email,
      subject,
      html,
    });

    console.log(`Response alert email sent to ${owner.email}`);
  } catch (error) {
    console.error('Failed to send response alert email:', error);
  }
}
