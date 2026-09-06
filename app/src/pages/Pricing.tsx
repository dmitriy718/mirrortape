import { useState } from 'react';
import PricingHeader from '@/pages/pricing/PricingHeader';
import TierCards from '@/pages/pricing/TierCards';
import FeatureMatrix from '@/pages/pricing/FeatureMatrix';
import HonestyBlock from '@/pages/pricing/HonestyBlock';
import PricingFaq from '@/pages/pricing/PricingFaq';
import PricingCta from '@/pages/pricing/PricingCta';

/**
 * MirrorTape pricing page (`/pricing`). Sections per design/pricing.md:
 * header + billing toggle, tier cards, feature matrix, cost honesty block,
 * mini-FAQ, final CTA. Global Navbar/Footer come from Layout.
 */
export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  return (
    <>
      <PricingHeader annual={annual} onChange={setAnnual} />
      <TierCards annual={annual} />
      <FeatureMatrix />
      <HonestyBlock />
      <PricingFaq />
      <PricingCta />
    </>
  );
}
