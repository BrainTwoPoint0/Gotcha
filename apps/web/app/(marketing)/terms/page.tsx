import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - Gotcha',
  description: 'Gotcha Terms of Service — rules and guidelines for using our platform.',
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: February 21, 2026</p>

      <div className="prose prose-gray max-w-none">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using Gotcha (&quot;the Service&quot;), operated by Gotcha
          (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;), you agree to be bound by these Terms of
          Service. If you do not agree to these terms, do not use the Service.
        </p>

        <h2>2. Description of Service</h2>
        <p>
          Gotcha provides a contextual feedback SDK for React applications and an associated
          dashboard for viewing and analyzing feedback responses. The Service includes the
          gotcha-feedback npm package and the gotcha.cx web application.
        </p>

        <h2>3. Accounts</h2>
        <p>
          You must provide accurate information when creating an account. You are responsible for
          maintaining the security of your account credentials and API keys. You must notify us
          immediately if you suspect unauthorized access.
        </p>

        <h2>4. Plans and Billing</h2>
        <ul>
          <li>
            <strong>Free plan:</strong> 500 responses per month, 1 project
          </li>
          <li>
            <strong>Pro plan:</strong> Unlimited responses, unlimited projects, advanced analytics —
            $29/month or $290/year
          </li>
        </ul>
        <p>
          Pro subscriptions are billed in advance on a monthly or annual basis. You can cancel at
          any time; cancellation takes effect at the end of the current billing period. We do not
          offer refunds for partial billing periods.
        </p>

        <h2>5. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for any unlawful purpose</li>
          <li>Submit or collect feedback data that violates any laws or regulations</li>
          <li>Attempt to bypass plan limits, rate limits, or security controls</li>
          <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
          <li>
            Use the Service to collect sensitive personal information (health, financial, etc.)
            without appropriate consent
          </li>
          <li>Resell or redistribute the Service without our written consent</li>
        </ul>

        <h2>6. Data Ownership</h2>
        <p>
          You retain ownership of all feedback data collected through your use of the SDK. We do not
          claim any intellectual property rights over your data. We process your data solely to
          provide the Service as described in our <a href="/privacy">Privacy Policy</a>.
        </p>

        <h2>7. API Keys</h2>
        <p>
          API keys are confidential. You are responsible for keeping your API keys secure and for
          all activity that occurs under your keys. Revoke and rotate keys if you suspect they have
          been compromised.
        </p>

        <h2>8. Availability and Support</h2>
        <p>
          We strive to maintain high availability but do not guarantee uninterrupted access. We may
          perform maintenance that temporarily affects the Service. We provide support via email on
          a best-effort basis.
        </p>

        <h2>9. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, Gotcha shall not be liable for any indirect,
          incidental, special, consequential, or punitive damages, or any loss of profits or
          revenues, whether incurred directly or indirectly. Our total liability for any claim
          arising from these Terms shall not exceed the amount you paid us in the 12 months
          preceding the claim.
        </p>

        <h2>10. Indemnification</h2>
        <p>
          You agree to indemnify and hold harmless Gotcha from any claims, damages, or expenses
          arising from your use of the Service or your violation of these Terms.
        </p>

        <h2>11. Termination</h2>
        <p>
          We may suspend or terminate your access to the Service at any time for violations of these
          Terms. Upon termination, your right to use the Service ceases immediately. We will make
          your data available for export for 30 days after termination.
        </p>

        <h2>12. Changes to Terms</h2>
        <p>
          We may update these Terms from time to time. We will notify you of material changes by
          posting the updated terms on this page. Continued use of the Service after changes
          constitutes acceptance of the new terms.
        </p>

        <h2>13. Contact Us</h2>
        <p>
          If you have questions about these Terms, contact us at{' '}
          <a href="mailto:info@braintwopoint0.com">info@braintwopoint0.com</a>.
        </p>
      </div>
    </div>
  );
}
