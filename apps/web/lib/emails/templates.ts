function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface WelcomeEmailProps {
  name: string;
}

interface ProActivatedEmailProps {
  name: string;
  orgName: string;
}

interface UsageWarningEmailProps {
  name: string;
  current: number;
  limit: number;
  percentage: number;
}

interface ResponseAlertEmailProps {
  name: string;
  projectName: string;
  responseType: string;
  content: string | null;
}

interface BugReportEmailProps {
  name: string;
  projectName: string;
  title: string;
  description: string;
  elementId: string;
  pageUrl: string | null;
  bugId: string;
}

interface InviteEmailProps {
  inviterName: string;
  orgName: string;
  role: string;
  acceptUrl: string;
}

interface BugResolutionEmailProps {
  reporterName: string | null;
  projectName: string;
  bugTitle: string;
  message: string;
}

const baseStyles = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #1f2937;
`;

const buttonStyles = `
  display: inline-block;
  background-color: #334155;
  color: white;
  padding: 12px 24px;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
`;

export function welcomeEmail({ name }: WelcomeEmailProps): { subject: string; html: string } {
  const displayName = name || 'there';

  return {
    subject: 'Welcome to Gotcha!',
    html: `
      <div style="${baseStyles}">
        <h1 style="color: #0f172a; margin-bottom: 24px;">Welcome to Gotcha!</h1>

        <p>Hey ${escapeHtml(displayName)},</p>

        <p>Thanks for signing up for Gotcha! We're excited to help you collect better feedback from your users.</p>

        <h2 style="color: #334155; margin-top: 32px;">Getting Started</h2>

        <ol style="padding-left: 20px;">
          <li style="margin-bottom: 12px;"><strong>Create a project</strong> in your dashboard to get an API key</li>
          <li style="margin-bottom: 12px;"><strong>Install the SDK:</strong> <code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">npm install gotcha-feedback</code></li>
          <li style="margin-bottom: 12px;"><strong>Add the G button</strong> to your app and start collecting feedback</li>
        </ol>

        <div style="margin-top: 32px;">
          <a href="https://gotcha.cx/dashboard" style="${buttonStyles}">Go to Dashboard</a>
        </div>

        <p style="margin-top: 32px; color: #6b7280; font-size: 14px;">
          If you have any questions, just reply to this email. We're here to help!
        </p>

        <p style="margin-top: 24px;">
          Cheers,<br/>
          The Gotcha Team
        </p>
      </div>
    `,
  };
}

export function proActivatedEmail({ name, orgName }: ProActivatedEmailProps): {
  subject: string;
  html: string;
} {
  const displayName = name || 'there';

  return {
    subject: "You're now on Gotcha Pro!",
    html: `
      <div style="${baseStyles}">
        <h1 style="color: #0f172a; margin-bottom: 24px;">Welcome to Gotcha Pro!</h1>

        <p>Hey ${escapeHtml(displayName)},</p>

        <p>Thanks for upgrading <strong>${escapeHtml(orgName)}</strong> to Gotcha Pro! You now have access to:</p>

        <ul style="padding-left: 20px;">
          <li style="margin-bottom: 8px;"><strong>Unlimited responses</strong> - No more monthly limits</li>
          <li style="margin-bottom: 8px;"><strong>Advanced analytics</strong> - Deep insights into your feedback</li>
          <li style="margin-bottom: 8px;"><strong>CSV/JSON export</strong> - Download your data anytime</li>
          <li style="margin-bottom: 8px;"><strong>Priority support</strong> - We're here when you need us</li>
        </ul>

        <div style="margin-top: 32px;">
          <a href="https://gotcha.cx/dashboard/analytics" style="${buttonStyles}">View Analytics</a>
        </div>

        <p style="margin-top: 32px; color: #6b7280; font-size: 14px;">
          Your subscription renews monthly. You can manage your subscription anytime from the Settings page.
        </p>

        <p style="margin-top: 24px;">
          Thanks for your support!<br/>
          The Gotcha Team
        </p>
      </div>
    `,
  };
}

export function usageWarningEmail({ name, current, limit, percentage }: UsageWarningEmailProps): {
  subject: string;
  html: string;
} {
  const displayName = name || 'there';

  return {
    subject: `You've used ${percentage}% of your monthly responses`,
    html: `
      <div style="${baseStyles}">
        <h1 style="color: #b45309; margin-bottom: 24px;">Approaching Your Response Limit</h1>

        <p>Hey ${escapeHtml(displayName)},</p>

        <p>You've used <strong>${current} of ${limit}</strong> responses this month (${percentage}%).</p>

        <p>Once you hit the limit, new responses won't be recorded until next month or until you upgrade.</p>

        <div style="margin-top: 32px;">
          <a href="https://gotcha.cx/dashboard/settings" style="${buttonStyles}">Upgrade to Pro</a>
        </div>

        <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
          Pro gives you unlimited responses for just $29/month.
        </p>

        <p style="margin-top: 24px;">
          Cheers,<br/>
          The Gotcha Team
        </p>
      </div>
    `,
  };
}

export function responseAlertEmail({
  name,
  projectName,
  responseType,
  content,
}: ResponseAlertEmailProps): { subject: string; html: string } {
  const displayName = name || 'there';
  const typeLabel = responseType.toLowerCase().replace('_', ' ');

  return {
    subject: `New ${typeLabel} on ${projectName}`,
    html: `
      <div style="${baseStyles}">
        <h1 style="color: #0f172a; margin-bottom: 24px;">New Feedback Received</h1>

        <p>Hey ${escapeHtml(displayName)},</p>

        <p>You received a new <strong>${escapeHtml(typeLabel)}</strong> on <strong>${escapeHtml(projectName)}</strong>:</p>

        ${
          content
            ? `
          <div style="background: #f8fafc; border-left: 4px solid #334155; padding: 16px; margin: 24px 0;">
            <p style="margin: 0; color: #334155;">"${escapeHtml(content)}"</p>
          </div>
        `
            : `
          <p style="color: #6b7280; font-style: italic;">No text content provided</p>
        `
        }

        <div style="margin-top: 32px;">
          <a href="https://gotcha.cx/dashboard/responses" style="${buttonStyles}">View All Responses</a>
        </div>

        <p style="margin-top: 24px;">
          Cheers,<br/>
          The Gotcha Team
        </p>
      </div>
    `,
  };
}

export function bugReportEmail({
  name,
  projectName,
  title,
  description,
  elementId,
  pageUrl,
  bugId,
}: BugReportEmailProps): { subject: string; html: string } {
  const displayName = name || 'there';

  return {
    subject: `New issue reported on ${projectName}`,
    html: `
      <div style="${baseStyles}">
        <h1 style="color: #b45309; margin-bottom: 24px;">New Issue Reported</h1>

        <p>Hey ${escapeHtml(displayName)},</p>

        <p>A user flagged an issue on <strong>${escapeHtml(projectName)}</strong>:</p>

        <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0;">
          <p style="margin: 0 0 8px 0; font-weight: 600; color: #92400e;">${escapeHtml(title)}</p>
          <p style="margin: 0; color: #78350f; font-size: 14px;">${escapeHtml(description)}</p>
        </div>

        <table style="font-size: 14px; color: #4b5563; margin: 16px 0;">
          <tr>
            <td style="padding: 4px 16px 4px 0; font-weight: 500;">Element</td>
            <td><code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${escapeHtml(elementId)}</code></td>
          </tr>
          ${pageUrl ? `
          <tr>
            <td style="padding: 4px 16px 4px 0; font-weight: 500;">Page</td>
            <td>${escapeHtml(pageUrl)}</td>
          </tr>
          ` : ''}
        </table>

        <div style="margin-top: 32px;">
          <a href="https://gotcha.cx/dashboard/bugs/${escapeHtml(bugId)}" style="${buttonStyles}">View Issue</a>
        </div>

        <p style="margin-top: 24px;">
          Cheers,<br/>
          The Gotcha Team
        </p>
      </div>
    `,
  };
}

export function inviteEmail({ inviterName, orgName, role, acceptUrl }: InviteEmailProps): {
  subject: string;
  html: string;
} {
  const roleLabel = role.charAt(0) + role.slice(1).toLowerCase();

  return {
    subject: `${inviterName} invited you to join ${orgName} on Gotcha`,
    html: `
      <div style="${baseStyles}">
        <h1 style="color: #0f172a; margin-bottom: 24px;">You're Invited!</h1>

        <p>Hey there,</p>

        <p><strong>${escapeHtml(inviterName)}</strong> has invited you to join <strong>${escapeHtml(orgName)}</strong> on Gotcha as a <strong>${escapeHtml(roleLabel)}</strong>.</p>

        <div style="margin-top: 32px;">
          <a href="${escapeHtml(acceptUrl)}" style="${buttonStyles}">Accept Invitation</a>
        </div>

        <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
          This invitation will expire in 7 days. Don't have an account yet? No problem — click the link above and you'll be prompted to create one. You'll be automatically added to the team once you sign up.
        </p>

        <p style="margin-top: 24px;">
          Cheers,<br/>
          The Gotcha Team
        </p>
      </div>
    `,
  };
}

export function bugResolutionEmail({
  reporterName,
  projectName,
  bugTitle,
  message,
}: BugResolutionEmailProps): { subject: string; html: string } {
  const displayName = reporterName ? escapeHtml(reporterName) : 'there';

  return {
    subject: `Your reported issue has been resolved - ${projectName}`,
    html: `
      <div style="${baseStyles}">
        <h1 style="color: #059669; margin-bottom: 24px;">Issue Resolved</h1>

        <p>Hey ${displayName},</p>

        <p>An issue you reported on <strong>${escapeHtml(projectName)}</strong> has been resolved:</p>

        <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0;">
          <p style="margin: 0 0 8px 0; font-weight: 600; color: #065f46;">${escapeHtml(bugTitle)}</p>
          <p style="margin: 0; color: #047857; font-size: 14px;">${escapeHtml(message)}</p>
        </div>

        <p style="color: #6b7280; font-size: 14px;">
          Thank you for taking the time to report this. Your feedback helps make the product better.
        </p>

        <p style="margin-top: 24px;">
          Cheers,<br/>
          The ${escapeHtml(projectName)} Team
        </p>
      </div>
    `,
  };
}
