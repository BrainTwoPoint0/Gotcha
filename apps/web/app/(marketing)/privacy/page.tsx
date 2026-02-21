import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Gotcha',
  description: 'Gotcha Privacy Policy — how we collect, use, and protect your data.',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: February 21, 2026</p>

      <div className="prose prose-gray max-w-none">
        <h2>1. Introduction</h2>
        <p>
          Gotcha (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates the gotcha.cx website
          and the gotcha-feedback SDK. This Privacy Policy explains how we collect, use, and protect
          your information when you use our services.
        </p>

        <h2>2. Information We Collect</h2>
        <h3>Account Information</h3>
        <p>
          When you create an account, we collect your email address, name, and profile information
          from your authentication provider (e.g., GitHub).
        </p>
        <h3>Feedback Data</h3>
        <p>
          When end users submit feedback through the Gotcha SDK embedded on your website, we
          collect: the feedback content (text, ratings, votes, poll responses), the element
          identifier, page URL, user agent, and any user metadata you choose to pass.
        </p>
        <h3>Usage Data</h3>
        <p>We track response counts per organization for plan limit enforcement.</p>

        <h2>3. How We Use Your Information</h2>
        <ul>
          <li>To provide, maintain, and improve our services</li>
          <li>To process payments and manage subscriptions</li>
          <li>To send transactional emails (welcome, usage warnings)</li>
          <li>To enforce plan limits and prevent abuse</li>
        </ul>

        <h2>4. Third-Party Services</h2>
        <p>We use the following third-party services to operate Gotcha:</p>
        <ul>
          <li>
            <strong>Supabase</strong> — Authentication and database hosting
          </li>
          <li>
            <strong>Stripe</strong> — Payment processing
          </li>
          <li>
            <strong>Resend</strong> — Transactional email delivery
          </li>
          <li>
            <strong>Netlify</strong> — Website hosting
          </li>
          <li>
            <strong>Upstash</strong> — Rate limiting (Redis)
          </li>
        </ul>
        <p>
          Each of these services has its own privacy policy. We do not sell your data to any third
          party.
        </p>

        <h2>5. Cookies</h2>
        <p>
          We use essential cookies for authentication session management. We do not use tracking or
          advertising cookies. The Gotcha SDK does not set any cookies on your end users&apos;
          browsers.
        </p>

        <h2>6. Data Retention</h2>
        <p>
          We retain your account data and feedback responses for as long as your account is active.
          You can request deletion of your account and all associated data at any time by contacting
          us.
        </p>

        <h2>7. Data Security</h2>
        <p>
          We protect your data using industry-standard measures including encrypted connections
          (TLS), hashed API keys, and access controls. However, no method of transmission over the
          Internet is 100% secure.
        </p>

        <h2>8. Your Rights (GDPR)</h2>
        <p>If you are in the European Economic Area, you have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Object to or restrict processing of your data</li>
          <li>Data portability</li>
        </ul>
        <p>
          To exercise these rights, contact us at{' '}
          <a href="mailto:info@braintwopoint0.com">info@braintwopoint0.com</a>.
        </p>

        <h2>9. Children&apos;s Privacy</h2>
        <p>
          Our services are not directed to children under 13. We do not knowingly collect personal
          information from children.
        </p>

        <h2>10. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of material
          changes by posting the updated policy on this page with a new &quot;Last updated&quot;
          date.
        </p>

        <h2>11. Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy, contact us at{' '}
          <a href="mailto:info@braintwopoint0.com">info@braintwopoint0.com</a>.
        </p>
      </div>
    </div>
  );
}
