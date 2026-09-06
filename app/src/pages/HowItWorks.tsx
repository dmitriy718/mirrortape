import PageHeader from '@/pages/how-it-works/PageHeader';
import PipelineDiagram from '@/pages/how-it-works/PipelineDiagram';
import Phases from '@/pages/how-it-works/Phases';
import BrokerChips from '@/pages/how-it-works/BrokerChips';
import ExecutionSpecs from '@/pages/how-it-works/ExecutionSpecs';
import MirroredTimeline from '@/pages/how-it-works/MirroredTimeline';
import CtaBand from '@/pages/how-it-works/CtaBand';

/**
 * MirrorTape `/how-it-works` — mechanics deep dive per design/how-it-works.md.
 * Global Navbar/Footer + Lenis come from Layout. GSAP is isolated to this page:
 * one pinned sequence (PipelineDiagram) + one unpinned scrub (MirroredTimeline),
 * both degrading to static layouts under prefers-reduced-motion.
 */
export default function HowItWorks() {
  return (
    <>
      <PageHeader />
      <PipelineDiagram />
      <Phases />
      <BrokerChips />
      <ExecutionSpecs />
      <MirroredTimeline />
      <CtaBand />
    </>
  );
}
