import { HeroSection } from './hero-section';
import { LoopSection } from './loop-section';
import { PrivacySection } from './privacy-section';
import { CtaSection } from './cta-section';
import { InstallSection } from './install-section';

export default function HomePage() {
  return (
    <main className="editorial min-h-screen bg-editorial-paper text-editorial-ink">
      <HeroSection />
      <InstallSection />
      <LoopSection />
      <PrivacySection />
      <CtaSection />
    </main>
  );
}
