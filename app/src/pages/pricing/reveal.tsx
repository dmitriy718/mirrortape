import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as [number, number, number, number];

/** H1/H2 word-by-word reveal (0.08s stagger, translateY 24px + opacity). */
export function WordReveal({
  text,
  className,
  as: Tag = 'h1',
  trigger = 'mount',
}: {
  text: string;
  className?: string;
  as?: 'h1' | 'h2';
  trigger?: 'mount' | 'inView';
}) {
  const reduced = useReducedMotion();
  const words = text.split(' ');
  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  };
  const word = {
    hidden: reduced ? { opacity: 0 } : { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: reduced ? { duration: 0.01 } : { duration: 0.6, ease: EASE_OUT_EXPO },
    },
  };
  const MotionTag = Tag === 'h1' ? motion.h1 : motion.h2;
  const revealProps =
    trigger === 'mount'
      ? { initial: 'hidden', animate: 'visible' }
      : { initial: 'hidden', whileInView: 'visible', viewport: { once: true, amount: 0.3 } };
  return (
    <MotionTag className={className} variants={container} {...revealProps} aria-label={text}>
      {words.map((w, i) => (
        <motion.span key={i} variants={word} className="inline-block" aria-hidden="true">
          {w}
          {i < words.length - 1 ? ' ' : ''}
        </motion.span>
      ))}
    </MotionTag>
  );
}

/** Bracketed cyan mono label with type-in effect (15ms/char). */
export function TypedLabel({ text, className }: { text: string; className?: string }) {
  return (
    <div
      className={cn(
        'font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan',
        className,
      )}
    >
      <TypedText text={`[ ${text} ]`} />
    </div>
  );
}

/** Character-by-character type-in; instant under reduced motion. */
export function TypedText({
  text,
  active = true,
  className,
}: {
  text: string;
  active?: boolean;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.span
      className={className}
      initial={{ clipPath: reduced || !active ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)' }}
      animate={active ? { clipPath: 'inset(0 0% 0 0)' } : undefined}
      transition={
        reduced
          ? { duration: 0.01 }
          : { duration: text.length * 0.015, ease: 'linear' }
      }
      style={{ display: 'inline-block', whiteSpace: 'pre' }}
      aria-label={text}
    >
      {text}
    </motion.span>
  );
}
