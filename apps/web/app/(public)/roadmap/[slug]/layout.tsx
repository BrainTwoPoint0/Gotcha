import { Navbar } from '../../../components/Navbar';
import { Footer } from '../../../components/Footer';

/**
 * Conditional chrome for the public roadmap. Customer roadmaps stay
 * chrome-free (their users should see the customer's brand, not ours).
 * Gotcha's own dogfood roadmap gets the full marketing Navbar + Footer
 * so visitors arriving from the landing page can navigate back.
 *
 * Detection is a simple slug match. If we later want multi-org
 * dogfood support, swap to an org-ID check against the project's
 * owning organization.
 */
const GOTCHA_SLUG = 'gotcha';

interface Props {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function RoadmapSlugLayout({ children, params }: Props) {
  const { slug } = await params;
  const isOurs = slug === GOTCHA_SLUG;

  if (isOurs) {
    return (
      <>
        <Navbar />
        {children}
        <Footer />
      </>
    );
  }

  return <>{children}</>;
}
