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
