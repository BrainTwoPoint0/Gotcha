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

interface BugUpdateEmailProps {
  reporterName: string | null;
  projectName: string;
  bugTitle: string;
  note: string;
  authorName: string;
}

interface ShippedNotificationEmailProps {
  projectName: string;
  excerpt: string | null;
  elementLabel: string;
  adminNote: string | null;
  unsubscribeUrl: string | null;
}

// ── Editorial palette ─────────────────────────────────────────
// Mirrors app/globals.css. Kept as literal hex strings since email
// clients don't honour CSS custom properties reliably.
const INK = '#1A1714';
const PAPER = '#FAF8F4';
const ACCENT = '#D4532A'; // burnt sienna
const RULE = '#E8E3DA';
const MUTED = '#6B655D';
const SUCCESS = '#4A6B3E'; // sage
const ALERT = '#9B3A2E'; // clay

// ── Shared style fragments ────────────────────────────────────
// Email clients don't support flexbox or custom fonts reliably.
// Fraunces falls back to Georgia (ships in every default mail UA).
// System sans stack for body. All styles inlined so Gmail's CSS
// stripper can't eat them.

const containerStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  max-width: 560px;
  margin: 0 auto;
  padding: 40px 28px;
  color: ${INK};
  line-height: 1.6;
  background: ${PAPER};
`;

const eyebrowStyle = `
  font-family: Menlo, Monaco, 'Courier New', monospace;
  font-size: 11px;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: ${MUTED};
  margin: 0 0 16px 0;
`;

const h1Style = `
  font-family: Georgia, 'Iowan Old Style', 'Times New Roman', serif;
  font-size: 28px;
  font-weight: 400;
  line-height: 1.2;
  letter-spacing: -0.01em;
  color: ${INK};
  margin: 0 0 24px 0;
`;

const bodyStyle = `
  font-size: 15px;
  line-height: 1.6;
  color: ${INK};
  margin: 0 0 16px 0;
`;

// Same as bodyStyle but without the trailing margin — used when the
// caller needs to override margin (e.g. list items where the list's
// own spacing applies). Outlook's CSS stripper occasionally chokes on
// duplicate margin declarations when we concatenated on top of
// bodyStyle, so we split cleanly here.
const bodyStyleNoMargin = `
  font-size: 15px;
  line-height: 1.6;
  color: ${INK};
`;

const mutedStyle = `
  font-size: 13px;
  line-height: 1.55;
  color: ${MUTED};
  margin: 0 0 16px 0;
`;

// Primary action — ink on paper. Used where the email is operational
// (welcome, bug report). Sienna reserved for product-loop moments.
const buttonInk = `
  display: inline-block;
  background: ${INK};
  color: ${PAPER};
  padding: 12px 24px;
  text-decoration: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
`;

const buttonAccent = `
  display: inline-block;
  background: ${ACCENT};
  color: ${PAPER};
  padding: 12px 24px;
  text-decoration: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
`;

const calloutStyle = (accentColor: string) => `
  border-left: 2px solid ${accentColor};
  padding: 6px 0 6px 18px;
  margin: 24px 0;
  color: ${INK};
`;

const footerStyle = `
  margin: 40px 0 0 0;
  padding-top: 20px;
  border-top: 1px solid ${RULE};
  font-size: 12px;
  line-height: 1.5;
  color: ${MUTED};
`;

const codeStyle = `
  background: rgba(26,23,20,0.04);
  padding: 1px 6px;
  border-radius: 3px;
  font-family: Menlo, Monaco, 'Courier New', monospace;
  font-size: 13px;
  color: ${INK};
`;

const signoffStyle = `
  font-size: 14px;
  line-height: 1.6;
  color: ${INK};
  margin: 24px 0 0 0;
`;

const footer = (eyebrow = 'Gotcha') => `
  <p style="${footerStyle}">
    <span style="font-family: Menlo, Monaco, 'Courier New', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.18em; color: ${MUTED};">${escapeHtml(eyebrow)}</span>
    &middot;
    <a href="https://gotcha.cx" style="color: ${MUTED}; text-decoration: underline;">gotcha.cx</a>
  </p>
`;

// ── Templates ─────────────────────────────────────────────────

export function welcomeEmail({ name }: WelcomeEmailProps): { subject: string; html: string } {
  const displayName = name ? escapeHtml(name) : 'there';

  return {
    subject: 'Welcome to Gotcha',
    html: `
      <div style="${containerStyle}">
        <p style="${eyebrowStyle}">&mdash; Welcome</p>

        <h1 style="${h1Style}">Your feedback loop starts here<span style="color: ${ACCENT};">.</span></h1>

        <p style="${bodyStyle}">Hey ${displayName},</p>

        <p style="${bodyStyle}">Thanks for signing up. Three steps to your first response:</p>

        <ol style="padding-left: 18px; margin: 0 0 24px 0;">
          <li style="${bodyStyleNoMargin} margin: 0 0 8px 0;">Create a project and grab your API key.</li>
          <li style="${bodyStyleNoMargin} margin: 0 0 8px 0;">Install the SDK &mdash; <code style="${codeStyle}">npm install gotcha-feedback</code>.</li>
          <li style="${bodyStyleNoMargin} margin: 0 0 8px 0;">Drop a &lt;Gotcha /&gt; component anywhere you want feedback.</li>
        </ol>

        <div style="margin: 32px 0;">
          <a href="https://gotcha.cx/dashboard" style="${buttonInk}">Go to dashboard</a>
        </div>

        <p style="${mutedStyle}">Questions? Reply to this email &mdash; it reaches a human.</p>

        <p style="${signoffStyle}">Cheers,<br/>The Gotcha team</p>

        ${footer()}
      </div>
    `,
  };
}

export function proActivatedEmail({ name, orgName }: ProActivatedEmailProps): {
  subject: string;
  html: string;
} {
  const displayName = name ? escapeHtml(name) : 'there';
  const safeOrg = escapeHtml(orgName);

  return {
    subject: "You're on Gotcha Pro",
    html: `
      <div style="${containerStyle}">
        <p style="${eyebrowStyle}">&mdash; Pro activated</p>

        <h1 style="${h1Style}">Welcome to Pro<span style="color: ${ACCENT};">.</span></h1>

        <p style="${bodyStyle}">Hey ${displayName},</p>

        <p style="${bodyStyle}"><strong>${safeOrg}</strong> is now on Pro. You have:</p>

        <ul style="padding-left: 18px; margin: 0 0 24px 0;">
          <li style="${bodyStyleNoMargin} margin: 0 0 6px 0;">Unlimited responses &mdash; no monthly cap.</li>
          <li style="${bodyStyleNoMargin} margin: 0 0 6px 0;">Full analytics dashboard &mdash; trends, segments, NPS, elements.</li>
          <li style="${bodyStyleNoMargin} margin: 0 0 6px 0;">CSV / JSON export &mdash; yours whenever you need it.</li>
          <li style="${bodyStyleNoMargin} margin: 0 0 6px 0;">Priority support &mdash; reply here, we'll see it.</li>
        </ul>

        <div style="margin: 32px 0;">
          <a href="https://gotcha.cx/dashboard/analytics" style="${buttonInk}">View analytics</a>
        </div>

        <p style="${mutedStyle}">
          Your subscription renews monthly. Manage billing from Settings at any time.
        </p>

        <p style="${signoffStyle}">Thanks for the support,<br/>The Gotcha team</p>

        ${footer()}
      </div>
    `,
  };
}

export function usageWarningEmail({ name, current, limit, percentage }: UsageWarningEmailProps): {
  subject: string;
  html: string;
} {
  const displayName = name ? escapeHtml(name) : 'there';

  return {
    subject: `You've used ${percentage}% of your monthly responses`,
    html: `
      <div style="${containerStyle}">
        <p style="${eyebrowStyle}">&mdash; Approaching limit</p>

        <h1 style="${h1Style}">You&rsquo;re at ${percentage}% of your monthly cap.</h1>

        <p style="${bodyStyle}">Hey ${displayName},</p>

        <p style="${bodyStyle}">
          You&rsquo;ve collected <strong>${current} of ${limit}</strong> responses this month.
        </p>

        <div style="${calloutStyle(ACCENT)}">
          <p style="margin: 0; font-size: 14px; line-height: 1.55; color: ${INK};">
            Once you hit the cap, new responses aren&rsquo;t recorded until next month
            &mdash; or until you upgrade.
          </p>
        </div>

        <div style="margin: 32px 0;">
          <a href="https://gotcha.cx/dashboard/settings" style="${buttonAccent}">Upgrade to Pro</a>
        </div>

        <p style="${mutedStyle}">Pro is $29/month for unlimited responses.</p>

        <p style="${signoffStyle}">Cheers,<br/>The Gotcha team</p>

        ${footer()}
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
  const displayName = name ? escapeHtml(name) : 'there';
  const safeProject = escapeHtml(projectName);
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const safeElement = escapeHtml(elementId);
  const safeBugId = escapeHtml(bugId);

  return {
    subject: `New issue on ${projectName}`,
    html: `
      <div style="${containerStyle}">
        <p style="${eyebrowStyle}">&mdash; New issue</p>

        <h1 style="${h1Style}">A user flagged something on ${safeProject}.</h1>

        <p style="${bodyStyle}">Hey ${displayName},</p>

        <div style="${calloutStyle(ALERT)}">
          <p style="margin: 0 0 6px 0; font-size: 15px; font-weight: 600; color: ${INK};">${safeTitle}</p>
          <p style="margin: 0; font-size: 14px; line-height: 1.55; color: ${INK}; white-space: pre-wrap;">${safeDesc}</p>
        </div>

        <table style="font-size: 13px; color: ${MUTED}; margin: 16px 0 24px 0; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 16px 4px 0; font-family: Menlo, Monaco, 'Courier New', monospace; text-transform: uppercase; letter-spacing: 0.14em; font-size: 10px;">Element</td>
            <td style="padding: 4px 0;"><code style="${codeStyle}">${safeElement}</code></td>
          </tr>
          ${
            pageUrl
              ? `
          <tr>
            <td style="padding: 4px 16px 4px 0; font-family: Menlo, Monaco, 'Courier New', monospace; text-transform: uppercase; letter-spacing: 0.14em; font-size: 10px;">Page</td>
            <td style="padding: 4px 0; color: ${INK};">${escapeHtml(pageUrl)}</td>
          </tr>
          `
              : ''
          }
        </table>

        <div style="margin: 24px 0;">
          <a href="https://gotcha.cx/dashboard/bugs/${safeBugId}" style="${buttonInk}">View issue</a>
        </div>

        <p style="${signoffStyle}">Cheers,<br/>The Gotcha team</p>

        ${footer()}
      </div>
    `,
  };
}

export function inviteEmail({ inviterName, orgName, role, acceptUrl }: InviteEmailProps): {
  subject: string;
  html: string;
} {
  const roleLabel = role.charAt(0) + role.slice(1).toLowerCase();
  const safeInviter = escapeHtml(inviterName);
  const safeOrg = escapeHtml(orgName);
  const safeRole = escapeHtml(roleLabel);
  const safeUrl = escapeHtml(acceptUrl);

  return {
    subject: `${inviterName} invited you to ${orgName} on Gotcha`,
    html: `
      <div style="${containerStyle}">
        <p style="${eyebrowStyle}">&mdash; Invitation</p>

        <h1 style="${h1Style}">You&rsquo;re invited<span style="color: ${ACCENT};">.</span></h1>

        <p style="${bodyStyle}">Hey there,</p>

        <p style="${bodyStyle}">
          <strong>${safeInviter}</strong> invited you to join <strong>${safeOrg}</strong> on Gotcha as <strong>${safeRole}</strong>.
        </p>

        <div style="margin: 32px 0;">
          <a href="${safeUrl}" style="${buttonInk}">Accept invitation</a>
        </div>

        <p style="${mutedStyle}">
          This invitation expires in 7 days. No account yet? The link will prompt you to
          create one and you&rsquo;ll be added automatically.
        </p>

        <p style="${signoffStyle}">Cheers,<br/>The Gotcha team</p>

        ${footer()}
      </div>
    `,
  };
}

export function bugUpdateEmail({
  projectName,
  reporterName,
  bugTitle,
  note,
  authorName,
}: BugUpdateEmailProps): { subject: string; html: string } {
  const displayName = reporterName ? escapeHtml(reporterName) : 'there';
  const safeProject = escapeHtml(projectName);
  const safeTitle = escapeHtml(bugTitle);
  const safeNote = escapeHtml(note);
  const safeAuthor = escapeHtml(authorName);

  return {
    subject: `Update: ${bugTitle}`,
    html: `
      <div style="${containerStyle}">
        <p style="${eyebrowStyle}">&mdash; Update on ${safeProject}</p>

        <h1 style="${h1Style}">${safeAuthor} left you a note.</h1>

        <p style="${bodyStyle}">Hey ${displayName},</p>

        <p style="${bodyStyle}">There&rsquo;s an update on the issue you reported:</p>

        <div style="${calloutStyle(ACCENT)}">
          <p style="margin: 0 0 6px 0; font-size: 15px; font-weight: 600; color: ${INK};">${safeTitle}</p>
          <p style="margin: 0; font-size: 14px; line-height: 1.55; color: ${INK}; white-space: pre-wrap;">${safeNote}</p>
        </div>

        ${footer('Powered by Gotcha')}
      </div>
    `,
  };
}

export function shippedNotificationEmail({
  projectName,
  excerpt,
  elementLabel,
  adminNote,
  unsubscribeUrl,
}: ShippedNotificationEmailProps): { subject: string; html: string } {
  // Notify-back for end users whose feedback was just shipped. Quiet,
  // editorial, no marketing chrome — this is the "we listened" moment.
  const safeProject = escapeHtml(projectName);
  const safeElement = escapeHtml(elementLabel);
  const safeExcerpt = excerpt ? escapeHtml(excerpt) : null;
  const safeNote = adminNote ? escapeHtml(adminNote) : null;

  return {
    subject: 'You asked — we shipped.',
    html: `
      <div style="${containerStyle}">
        <p style="${eyebrowStyle}">&mdash; ${safeProject}</p>

        <h1 style="${h1Style}">You asked &mdash; we shipped<span style="color: ${ACCENT};">.</span></h1>

        <p style="${bodyStyle}">
          A while back you submitted feedback on <strong>${safeProject}</strong>${safeExcerpt ? '' : ` (<code style="${codeStyle}">${safeElement}</code>)`}.
        </p>

        ${
          safeExcerpt
            ? `
        <blockquote style="${calloutStyle(RULE)} font-style: italic; font-size: 15px; color: ${MUTED};">
          &ldquo;${safeExcerpt}&rdquo;
        </blockquote>
        `
            : ''
        }

        <p style="${bodyStyle}">It&rsquo;s live now.</p>

        ${
          safeNote
            ? `
        <div style="margin: 24px 0; padding: 16px 20px; background: rgba(26,23,20,0.04); border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; line-height: 1.55; color: ${INK}; white-space: pre-wrap;">${safeNote}</p>
        </div>
        `
            : ''
        }

        <p style="${mutedStyle} margin-top: 32px;">
          You&rsquo;re receiving this because you left feedback with an email address.
          ${
            unsubscribeUrl
              ? `<a href="${escapeHtml(unsubscribeUrl)}" style="color: ${MUTED}; text-decoration: underline;">Don&rsquo;t notify me again</a>.`
              : ''
          }
        </p>

        ${footer('Feedback that closes the loop')}
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
  const safeProject = escapeHtml(projectName);
  const safeTitle = escapeHtml(bugTitle);
  const safeMessage = escapeHtml(message);

  return {
    subject: `Resolved: ${bugTitle}`,
    html: `
      <div style="${containerStyle}">
        <p style="${eyebrowStyle}">&mdash; ${safeProject}</p>

        <h1 style="${h1Style}">Issue resolved<span style="color: ${ACCENT};">.</span></h1>

        <p style="${bodyStyle}">Hey ${displayName},</p>

        <p style="${bodyStyle}">An issue you reported has been resolved:</p>

        <div style="${calloutStyle(SUCCESS)}">
          <p style="margin: 0 0 6px 0; font-size: 15px; font-weight: 600; color: ${INK};">${safeTitle}</p>
          <p style="margin: 0; font-size: 14px; line-height: 1.55; color: ${INK}; white-space: pre-wrap;">${safeMessage}</p>
        </div>

        ${footer('Powered by Gotcha')}
      </div>
    `,
  };
}
