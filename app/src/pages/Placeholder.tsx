import LiveDot from '@/components/LiveDot';

/** Accessible fallback retained for legacy route consumers. */
export default function Placeholder({ title, label }: { title: string; label: string }) {
  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-[1280px] flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <div className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan">
        <LiveDot variant="cyan" />[ {label} ]
      </div>
      <h1 className="font-sans text-4xl font-bold tracking-[-0.02em] text-text-1">{title}</h1>
      <p className="font-mono text-xs text-text-3">This page could not be found. Return to the home page to continue.</p>
    </div>
  );
}
