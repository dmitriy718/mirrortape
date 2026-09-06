import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/** COPY pill: mint wash → solid on hover; click morphs to "✓ COPIED" for 1.6s. */
export default function CopyButton({
  onCopy,
  className,
}: {
  onCopy?: () => void;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        onCopy?.();
        setCopied(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 1600);
      }}
      className={cn(
        'inline-flex cursor-pointer items-center gap-1 rounded border px-2.5 py-1',
        'font-mono text-[11px] font-bold uppercase tracking-[0.06em]',
        'transition-colors duration-150',
        copied
          ? 'border-mint bg-mint text-bg'
          : 'border-mint/60 bg-[rgba(52,211,153,0.1)] text-mint hover:bg-mint hover:text-bg',
        className,
      )}
    >
      {copied ? (
        <>
          <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
            <path
              d="M2 6.5 L4.8 9 L10 3"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={14}
              strokeDashoffset={0}
              style={{ animation: 'copy-check 0.35s ease-out' }}
            />
            <style>{`@keyframes copy-check { from { stroke-dashoffset: 14; } to { stroke-dashoffset: 0; } }`}</style>
          </svg>
          Copied
        </>
      ) : (
        'Copy'
      )}
    </button>
  );
}
