import PageHeader from '@/pages/risk/PageHeader';
import RiskEngine from '@/pages/risk/RiskEngine';
import KillSwitchDemo from '@/pages/risk/KillSwitchDemo';
import SecurityGrid from '@/pages/risk/SecurityGrid';
import VerificationStandards from '@/pages/risk/VerificationStandards';
import DisclosureWall from '@/pages/risk/DisclosureWall';
import CtaBand from '@/pages/risk/CtaBand';

/**
 * MirrorTape `/risk` — risk engine, security model, and verification standards
 * per design/risk.md. No GSAP on this page; all motion is CSS/IO-driven and
 * degrades to final states under prefers-reduced-motion.
 */
export default function Risk() {
  return (
    <>
      <PageHeader />
      <RiskEngine />
      <KillSwitchDemo />
      <SecurityGrid />
      <VerificationStandards />
      <DisclosureWall />
      <CtaBand />
    </>
  );
}
