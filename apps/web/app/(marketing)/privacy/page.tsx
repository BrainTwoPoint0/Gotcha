import type { Metadata } from 'next';
import {
  LegalSection,
  LegalSubhead,
  LegalP,
  LegalBullets,
  LegalDefList,
  LegalCode,
  LegalEmailLink,
  LegalTOC,
} from '../legal/_components';

export const metadata: Metadata = {
  title: 'Privacy Policy - Gotcha',
  description: 'Gotcha Privacy Policy — how we collect, use, and protect your data.',
};

const sections = [
  { number: '01', title: 'Introduction' },
  { number: '02', title: 'Information we collect' },
  { number: '03', title: 'How we use your information' },
  { number: '04', title: 'Third-party services' },
  { number: '05', title: 'Public roadmap' },
  { number: '06', title: 'Webhooks & third-party data delivery' },
  { number: '07', title: 'Cookies' },
  { number: '08', title: 'Data retention' },
  { number: '09', title: 'Data security' },
  { number: '10', title: 'Your rights (GDPR)' },
  { number: '11', title: 'Children’s privacy' },
  { number: '12', title: 'Changes to this policy' },
  { number: '13', title: 'Contact us' },
];

export default function PrivacyPage() {
  return (
    <main className="editorial min-h-screen bg-editorial-paper text-editorial-ink">
      <div className="absolute inset-x-0 top-0 h-px bg-editorial-neutral-2" aria-hidden="true" />

      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:grid lg:grid-cols-[220px_1fr] lg:gap-12 lg:px-8">
        <LegalTOC sections={sections} />

        <article>
          {/* Page header */}
          <header className="mb-14 border-b border-editorial-neutral-2 pb-8">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-editorial-accent" aria-hidden="true" />
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-neutral-3">
                Privacy policy
              </span>
            </div>
            <h1 className="font-display text-[2rem] font-normal leading-[1.1] tracking-[-0.02em] text-editorial-ink sm:text-4xl">
              How we collect, use, and protect your data
              <span className="text-editorial-accent">.</span>
            </h1>
            <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-neutral-3">
              Last updated · April 17, 2026
            </p>
          </header>

          {/* Sections */}
          <div className="space-y-12">
            <LegalSection number="01" title="Introduction">
              <LegalP>
                Gotcha (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates the{' '}
                <em>gotcha.cx</em> website and the <em>gotcha-feedback</em> SDK. This Privacy Policy
                explains how we collect, use, and protect your information when you use our
                services.
              </LegalP>
            </LegalSection>

            <LegalSection number="02" title="Information we collect">
              <LegalSubhead>Account information</LegalSubhead>
              <LegalP>
                When you create an account, we collect your email address, name, and profile
                information from your authentication provider (e.g., GitHub).
              </LegalP>

              <LegalSubhead>Profile & segmentation data</LegalSubhead>
              <LegalP>
                During onboarding or profile updates, we may collect additional information such as
                company size, job role, industry, and use case. This data is used to improve the
                product experience and may be attached to feedback responses for segmentation
                purposes.
              </LegalP>

              <LegalSubhead>Feedback data</LegalSubhead>
              <LegalP>
                When end users submit feedback through the Gotcha SDK embedded on your website, we
                collect: the feedback content (text, ratings, votes, poll responses, NPS scores),
                bug reports, the element identifier, page URL, user agent, and any user metadata you
                choose to pass.
              </LegalP>

              <LegalSubhead>Screenshots</LegalSubhead>
              <LegalP>
                When the customer enables screenshot capture on a bug-report widget and the end user
                toggles the bug flag on submission, the SDK captures a screenshot of the current
                viewport and sends it to us. Screenshots are stored in a private Supabase Storage
                bucket scoped to the submitting project and are only viewable through short-lived
                signed URLs generated for authenticated members of the owning organization. The SDK
                captures only the visible viewport (not the full page) and does not capture any
                pixels outside the browser window.
              </LegalP>

              <LegalSubhead>Submitter email & notify-back</LegalSubhead>
              <LegalP>
                When the SDK is configured with the optional <LegalCode>userEmail</LegalCode> prop,
                we store the submitter&rsquo;s email address alongside their response so that, when
                the customer marks the feedback as &ldquo;Shipped&rdquo; in the dashboard, we can
                send a one-off notification to the submitter. Notifications are HMAC-signed and
                include a one-click unsubscribe link that suppresses future notifications for that
                project/submitter pair.
              </LegalP>

              <LegalSubhead>Team & invitation data</LegalSubhead>
              <LegalP>
                When you invite team members to your organization, we collect and store the
                invitee&rsquo;s email address, the role assigned, and the invitation status.
              </LegalP>

              <LegalSubhead>Usage data</LegalSubhead>
              <LegalP>We track response counts per organization for plan-limit enforcement.</LegalP>
            </LegalSection>

            <LegalSection number="03" title="How we use your information">
              <LegalBullets
                items={[
                  'To provide, maintain, and improve our services.',
                  'To process payments and manage subscriptions.',
                  'To send transactional emails (welcome, usage warnings, notify-back).',
                  'To enforce plan limits and prevent abuse.',
                ]}
              />
            </LegalSection>

            <LegalSection number="04" title="Third-party services">
              <LegalP>We use the following third-party services to operate Gotcha:</LegalP>
              <LegalDefList
                items={[
                  { term: 'Supabase', def: 'Authentication, database, and storage hosting.' },
                  { term: 'Stripe', def: 'Payment processing.' },
                  { term: 'Resend', def: 'Transactional email delivery.' },
                  { term: 'Netlify', def: 'Website hosting.' },
                  { term: 'Upstash', def: 'Rate limiting (Redis).' },
                ]}
              />
              <LegalP>
                Each of these services has its own privacy policy. We do not sell your data to any
                third party.
              </LegalP>
            </LegalSection>

            <LegalSection number="05" title="Public roadmap">
              <LegalP>
                When the customer promotes a response to a public-facing lifecycle state
                (&ldquo;Planned&rdquo;, &ldquo;In progress&rdquo;, &ldquo;Shipped&rdquo;), the
                curated <em>title</em> of that response becomes publicly visible on the
                customer&rsquo;s roadmap page (e.g.{' '}
                <LegalCode>gotcha.cx/roadmap/&lt;slug&gt;</LegalCode>). Only the title is surfaced
                &mdash; the full response content, submitter email, metadata, user agent, URL, and
                any screenshots remain private to the customer&rsquo;s dashboard. Anonymous visitors
                can cast upvotes on roadmap items; upvotes are deduplicated using a hashed visitor
                fingerprint that is not linkable to any personal data.
              </LegalP>
            </LegalSection>

            <LegalSection number="06" title="Webhooks & third-party data delivery">
              <LegalP>
                You may configure webhooks to send feedback data to external URLs (e.g., Slack,
                Discord, or custom endpoints). When webhooks are enabled, feedback data is delivered
                to the URLs you specify. You are responsible for the security and privacy practices
                of those endpoints. We validate webhook URLs to prevent delivery to private
                networks.
              </LegalP>
            </LegalSection>

            <LegalSection number="07" title="Cookies">
              <LegalP>
                We use essential cookies for authentication session management. We also use
                short-lived <LegalCode>httpOnly</LegalCode> cookies to securely process team
                invitation links. We do not use tracking or advertising cookies. The Gotcha SDK does
                not set any cookies on your end users&rsquo; browsers.
              </LegalP>
            </LegalSection>

            <LegalSection number="08" title="Data retention">
              <LegalP>
                We retain your account data and feedback responses for as long as your account is
                active. You can request deletion of your account and all associated data at any time
                by contacting us.
              </LegalP>
            </LegalSection>

            <LegalSection number="09" title="Data security">
              <LegalP>
                We protect your data using industry-standard measures including encrypted
                connections (TLS), hashed API keys, and access controls. However, no method of
                transmission over the Internet is 100% secure.
              </LegalP>
            </LegalSection>

            <LegalSection number="10" title="Your rights (GDPR)">
              <LegalP>If you are in the European Economic Area, you have the right to:</LegalP>
              <LegalBullets
                items={[
                  'Access the personal data we hold about you.',
                  'Request correction of inaccurate data.',
                  'Request deletion of your data.',
                  'Object to or restrict processing of your data.',
                  'Data portability.',
                ]}
              />
              <LegalP>
                Gotcha provides API endpoints for programmatic data export and deletion of end-user
                data scoped to individual projects. Account holders can use these APIs to fulfill
                data subject requests from their own users.
              </LegalP>
              <LegalP>
                To exercise your own rights, or for requests not covered by the API, contact us at{' '}
                <LegalEmailLink />.
              </LegalP>
            </LegalSection>

            <LegalSection number="11" title="Children’s privacy">
              <LegalP>
                Our services are not directed to children under 13. We do not knowingly collect
                personal information from children.
              </LegalP>
            </LegalSection>

            <LegalSection number="12" title="Changes to this policy">
              <LegalP>
                We may update this Privacy Policy from time to time. We will notify you of material
                changes by posting the updated policy on this page with a new &ldquo;Last
                updated&rdquo; date.
              </LegalP>
            </LegalSection>

            <LegalSection number="13" title="Contact us">
              <LegalP>
                If you have questions about this Privacy Policy, contact us at <LegalEmailLink />.
              </LegalP>
            </LegalSection>
          </div>
        </article>
      </div>
    </main>
  );
}
