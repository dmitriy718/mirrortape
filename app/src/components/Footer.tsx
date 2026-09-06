import { Link } from 'react-router';
import { Wordmark, MarketStatusPill } from '@/components/Navbar';

export const COMPLIANCE_COPY =
  'Options involve risk and are not suitable for all investors. Past performance does not guarantee future results. MirrorTape is a technology platform, not a broker-dealer or investment advisor. All trading is executed in your own brokerage account. Simulated performance shown in demos is hypothetical.';

const COLUMNS: Array<{ title: string; links: Array<{ label: string; to: string }> }> = [
  {
    title: 'Product',
    links: [
      { label: 'Live Demo', to: '/demo' },
      { label: 'Traders', to: '/traders' },
      { label: 'How It Works', to: '/how-it-works' },
      { label: 'Pricing', to: '/pricing' },
      { label: 'Risk Controls', to: '/risk' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '/how-it-works' },
      { label: 'Careers', to: '/how-it-works' },
      { label: 'Press Kit', to: '/how-it-works' },
      { label: 'Contact', to: '/faq' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms', to: '/risk' },
      { label: 'Privacy', to: '/risk' },
      { label: 'Options Disclosure', to: '/risk' },
      { label: 'PDS', to: '/risk' },
    ],
  },
];

/** Full-bleed footer: 4 columns + mandatory compliance block + bottom bar. */
export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface-1">
      <div className="mx-auto max-w-[1280px] px-6 py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Wordmark />
            <p className="mt-3 max-w-[260px] font-sans text-sm leading-relaxed text-text-2">
              Copy trading for the US stock market. Stocks &amp; options — mirrored in milliseconds.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-text-3">
                {col.title}
              </div>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="font-mono text-xs text-text-2 transition-colors duration-150 hover:text-cyan"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-md border border-border p-4">
          <p className="font-mono text-[10px] leading-relaxed tracking-[0.02em] text-text-3">
            {COMPLIANCE_COPY}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
          <span className="font-mono text-[11px] text-text-3">
            © 2025 MirrorTape Technologies, Inc.
          </span>
          <MarketStatusPill className="lg:inline-flex" />
        </div>
      </div>
    </footer>
  );
}
