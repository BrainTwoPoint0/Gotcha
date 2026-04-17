import type { Metadata } from 'next';
import {
  LegalSection,
  LegalP,
  LegalBullets,
  LegalDefList,
  LegalCode,
  LegalEmailLink,
  LegalTOC,
} from '../legal/_components';

export const metadata: Metadata = {
  title: 'Terms of Service - Gotcha',
  description: 'Gotcha Terms of Service — rules and guidelines for using our platform.',
};

const sections = [
  { number: '01', title: 'Acceptance of terms' },
  { number: '02', title: 'Description of service' },
  { number: '03', title: 'Accounts' },
  { number: '04', title: 'Plans and billing' },
  { number: '05', title: 'Acceptable use' },
  { number: '06', title: 'Data ownership' },
  { number: '07', title: 'API keys' },
  { number: '08', title: 'Teams & organisations' },
  { number: '09', title: 'Webhooks' },
  { number: '10', title: 'Notify-back emails' },
  { number: '11', title: 'Data export & deletion' },
  { number: '12', title: 'Availability and support' },
  { number: '13', title: 'Limitation of liability' },
  { number: '14', title: 'Indemnification' },
  { number: '15', title: 'Termination' },
  { number: '16', title: 'Changes to terms' },
  { number: '17', title: 'Contact us' },
];

export default function TermsPage() {
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
                Terms of service
              </span>
            </div>
            <h1 className="font-display text-[2rem] font-normal leading-[1.1] tracking-[-0.02em] text-editorial-ink sm:text-4xl">
              Rules and guidelines for using Gotcha
              <span className="text-editorial-accent">.</span>
            </h1>
            <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-editorial-neutral-3">
              Last updated · April 17, 2026
            </p>
          </header>

          {/* Sections */}
          <div className="space-y-12">
            <LegalSection number="01" title="Acceptance of terms">
              <LegalP>
                By accessing or using Gotcha (&ldquo;the Service&rdquo;), operated by Gotcha
                (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;), you agree to be bound by
                these Terms of Service. If you do not agree to these terms, do not use the Service.
              </LegalP>
            </LegalSection>

            <LegalSection number="02" title="Description of service">
              <LegalP>
                Gotcha provides a contextual feedback SDK for React applications and an associated
                dashboard for viewing and analysing feedback responses, NPS scores, and bug reports.
                The Service includes the <LegalCode>gotcha-feedback</LegalCode> npm package, the{' '}
                <LegalCode>gotcha.cx</LegalCode> web application, team collaboration features,
                webhook integrations, and data export / deletion APIs.
              </LegalP>
            </LegalSection>

            <LegalSection number="03" title="Accounts">
              <LegalP>
                You must provide accurate information when creating an account. You are responsible
                for maintaining the security of your account credentials and API keys. You must
                notify us immediately if you suspect unauthorised access.
              </LegalP>
            </LegalSection>

            <LegalSection number="04" title="Plans and billing">
              <LegalDefList
                items={[
                  { term: 'Free', def: '500 responses per month · 1 project.' },
                  {
                    term: 'Pro',
                    def: 'Unlimited responses, unlimited projects, advanced analytics · $29/month or $288/year ($24/month billed annually).',
                  },
                ]}
              />
              <LegalP>
                Pro subscriptions are billed in advance on a monthly or annual basis. You can cancel
                at any time; cancellation takes effect at the end of the current billing period. We
                do not offer refunds for partial billing periods.
              </LegalP>
            </LegalSection>

            <LegalSection number="05" title="Acceptable use">
              <LegalP>You agree not to:</LegalP>
              <LegalBullets
                items={[
                  'Use the Service for any unlawful purpose.',
                  'Submit or collect feedback data that violates any laws or regulations.',
                  'Attempt to bypass plan limits, rate limits, or security controls.',
                  'Reverse engineer, decompile, or disassemble any part of the Service.',
                  'Use the Service to collect sensitive personal information (health, financial, etc.) without appropriate consent.',
                  'Resell or redistribute the Service without our written consent.',
                  'Promote responses to the public roadmap that contain personal information, secrets, or confidential content from your end users. You are responsible for the curated title before it becomes public.',
                ]}
              />
            </LegalSection>

            <LegalSection number="06" title="Data ownership">
              <LegalP>
                You retain ownership of all feedback data collected through your use of the SDK. We
                do not claim any intellectual property rights over your data. We process your data
                solely to provide the Service as described in our{' '}
                <a
                  href="/privacy"
                  className="text-editorial-ink underline decoration-editorial-neutral-2 decoration-1 underline-offset-4 transition-colors hover:decoration-editorial-accent"
                >
                  Privacy Policy
                </a>
                .
              </LegalP>
            </LegalSection>

            <LegalSection number="07" title="API keys">
              <LegalP>
                API keys are confidential. You are responsible for keeping your API keys secure and
                for all activity that occurs under your keys. Revoke and rotate keys if you suspect
                they have been compromised.
              </LegalP>
            </LegalSection>

            <LegalSection number="08" title="Teams & organisations">
              <LegalP>
                Organisation owners are responsible for the actions of all members they invite. You
                may assign roles (Owner, Admin, Member, Viewer) to control access levels. Owners are
                responsible for managing team membership and revoking access when appropriate.
              </LegalP>
            </LegalSection>

            <LegalSection number="09" title="Webhooks">
              <LegalP>
                You may configure webhooks to deliver feedback data to external endpoints. You are
                solely responsible for the security, availability, and compliance of those
                endpoints. We are not liable for data delivered to webhook URLs you configure. We
                reserve the right to block webhook delivery to URLs that pose a security risk.
              </LegalP>
            </LegalSection>

            <LegalSection number="10" title="Notify-back emails">
              <LegalP>
                When you mark a feedback item as &ldquo;Shipped&rdquo; in the dashboard, Gotcha may
                send a notification to the end user who submitted it (if they provided an email
                address via the SDK&rsquo;s <LegalCode>userEmail</LegalCode> prop). You are
                responsible for ensuring any content included in these notifications, including the
                optional admin note, complies with applicable anti-spam laws (CAN-SPAM, CASL, PECR,
                etc.). Notifications include a one-click unsubscribe link that is honoured
                per-project, per-submitter.
              </LegalP>
            </LegalSection>

            <LegalSection number="11" title="Data export & deletion">
              <LegalP>
                We provide API endpoints for exporting and deleting end-user feedback data scoped to
                individual projects. You are responsible for using these APIs to fulfill data
                subject requests from your own end users in compliance with applicable data
                protection laws.
              </LegalP>
            </LegalSection>

            <LegalSection number="12" title="Availability and support">
              <LegalP>
                We strive to maintain high availability but do not guarantee uninterrupted access.
                We may perform maintenance that temporarily affects the Service. We provide support
                via email on a best-effort basis. Formal SLAs are not offered on FREE or PRO plans;
                contact us for custom commitments.
              </LegalP>
            </LegalSection>

            <LegalSection number="13" title="Limitation of liability">
              <LegalP>
                To the maximum extent permitted by law, Gotcha shall not be liable for any indirect,
                incidental, special, consequential, or punitive damages, or any loss of profits or
                revenues, whether incurred directly or indirectly. Our total liability for any claim
                arising from these Terms shall not exceed the amount you paid us in the 12 months
                preceding the claim.
              </LegalP>
            </LegalSection>

            <LegalSection number="14" title="Indemnification">
              <LegalP>
                You agree to indemnify and hold harmless Gotcha from any claims, damages, or
                expenses arising from your use of the Service or your violation of these Terms.
              </LegalP>
            </LegalSection>

            <LegalSection number="15" title="Termination">
              <LegalP>
                We may suspend or terminate your access to the Service at any time for violations of
                these Terms. Upon termination, your right to use the Service ceases immediately. We
                will make your data available for export for 30 days after termination.
              </LegalP>
            </LegalSection>

            <LegalSection number="16" title="Changes to terms">
              <LegalP>
                We may update these Terms from time to time. We will notify you of material changes
                by posting the updated terms on this page. Continued use of the Service after
                changes constitutes acceptance of the new terms.
              </LegalP>
            </LegalSection>

            <LegalSection number="17" title="Contact us">
              <LegalP>
                If you have questions about these Terms, contact us at <LegalEmailLink />.
              </LegalP>
            </LegalSection>
          </div>
        </article>
      </div>
    </main>
  );
}
