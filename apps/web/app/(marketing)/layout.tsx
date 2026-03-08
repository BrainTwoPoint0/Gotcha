import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'Gotcha',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web',
      description:
        'A developer-first contextual feedback SDK for React. Add feedback buttons to any UI component with a single line of code.',
      url: 'https://gotcha.cx',
      downloadUrl: 'https://www.npmjs.com/package/gotcha-feedback',
      softwareVersion: '1.1.0',
      author: {
        '@type': 'Organization',
        name: 'Gotcha',
        url: 'https://gotcha.cx',
      },
      offers: [
        {
          '@type': 'Offer',
          name: 'Free',
          price: '0',
          priceCurrency: 'USD',
          description: '500 responses/month, 1 project',
        },
        {
          '@type': 'Offer',
          name: 'Pro',
          price: '29',
          priceCurrency: 'USD',
          description: 'Unlimited responses, unlimited projects, advanced analytics',
        },
      ],
      featureList: [
        'Contextual feedback tied to UI elements',
        'Star ratings and text feedback',
        'Thumbs up/down voting',
        'NPS surveys (0-10 scale)',
        'Custom polls with single or multi-select',
        'Bug flagging and tracking',
        'Team workspaces with roles',
        'Webhooks (Slack, Discord, custom)',
        'Export to CSV and JSON',
        'Real-time analytics dashboard',
        'User segmentation',
        'TypeScript support',
        'GDPR compliant with data export and deletion API',
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is Gotcha?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Gotcha is a React SDK that lets developers add contextual feedback to any UI component. Collect star ratings, votes, NPS scores, poll responses, and bug reports directly on the elements users interact with.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do I install Gotcha?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Install via npm: npm install gotcha-feedback. Then wrap your app with GotchaProvider and add Gotcha components around elements you want feedback on.',
          },
        },
        {
          '@type': 'Question',
          name: 'What feedback modes does Gotcha support?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Gotcha supports four feedback modes: feedback (star ratings with optional text), vote (thumbs up/down), poll (custom multiple-choice), and NPS (0-10 scale with follow-up). Bug flagging can be enabled on any mode.',
          },
        },
        {
          '@type': 'Question',
          name: 'How much does Gotcha cost?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Gotcha has a free tier with 500 responses/month and 1 project. The Pro plan is $29/month for unlimited responses, unlimited projects, and advanced analytics.',
          },
        },
      ],
    },
    {
      '@type': 'Organization',
      name: 'Gotcha',
      url: 'https://gotcha.cx',
      logo: 'https://gotcha.cx/logo.png',
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'info@braintwopoint0.com',
        contactType: 'customer service',
      },
      sameAs: ['https://www.npmjs.com/package/gotcha-feedback'],
    },
  ],
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
