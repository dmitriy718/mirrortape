import Hero from '@/pages/home/Hero';
import StatsStrip from '@/pages/home/StatsStrip';
import HowItWorks from '@/pages/home/HowItWorks';
import LeaderboardPreview from '@/pages/home/LeaderboardPreview';
import OptionsFlow from '@/pages/home/OptionsFlow';
import RiskGrid from '@/pages/home/RiskGrid';
import Comparison from '@/pages/home/Comparison';
import PricingTeaser from '@/pages/home/PricingTeaser';
import FaqSection from '@/pages/home/FaqSection';
import FinalCta from '@/pages/home/FinalCta';

/**
 * MirrorTape landing page (`/`). Ticker tape is rendered by Layout above the
 * navbar on this route. Sections follow home.md 0–11.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <StatsStrip />
      <HowItWorks />
      <LeaderboardPreview />
      <OptionsFlow />
      <RiskGrid />
      <Comparison />
      <PricingTeaser />
      <FaqSection />
      <FinalCta />
    </>
  );
}
