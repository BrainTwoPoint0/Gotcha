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
      softwareVersion: '1.0.18',
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
        'Real-time dashboard',
        'Domain allowlisting for API security',
        'TypeScript support',
        'GDPR compliant',
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
            text: 'Gotcha is a React SDK that lets developers add contextual feedback buttons to any UI component. Users can provide star ratings and text feedback directly on the elements they are interacting with.',
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
            text: 'Gotcha supports two modes: feedback mode (1-5 star rating with optional text) and vote mode (thumbs up/down with optional comment).',
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
