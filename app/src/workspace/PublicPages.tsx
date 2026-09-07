import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  ArrowUpRight,
  ShieldCheck,
  ListChecks,
  SlidersHorizontal,
  ArrowRight,
} from "lucide-react";
import { Shell, Recovery } from "./Primitives";
import { api } from "./api";
export function Landing() {
  return (
    <Shell>
      <div className="content-width">
        <section className="landing-hero">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="live-indicator" /> A CLEARER START TO YOUR
              TRADING DAY
            </p>
            <h1>
              Less noise.
              <br />
              More <span>intention.</span>
            </h1>
            <p className="hero-description">
              Bring your watchlist, personal plan, and account view into one
              considered workspace. Start with what matters to you.
            </p>
            <div className="button-row">
              <Link className="primary-button large" to="/demo">
                Explore the demo <ArrowUpRight size={19} />
              </Link>
              <Link className="secondary-button large" to="/how-it-works">
                See how it works
              </Link>
            </div>
            <p className="hero-footnote">
              No payment or brokerage connection needed to explore.
            </p>
          </div>
          <div className="hero-art" aria-label="Workspace features">
            <div className="art-top">
              <span className="brand-cursor" /> MIRRORTAPE / WORKSPACE{" "}
              <span className="art-dot" />
            </div>
            <div className="art-body">
              <div className="art-orbit">
                <div className="orbit-ring" />
                <div className="orbit-ring orbit-two" />
                <SlidersHorizontal size={42} />
              </div>
              <p className="eyebrow">BUILT AROUND YOUR DECISIONS</p>
              <h2>
                Watch. Plan.
                <br />
                Keep perspective.
              </h2>
              <div className="art-features">
                <span>
                  <ListChecks size={16} />
                  Your research list
                </span>
                <span>
                  <ShieldCheck size={16} />
                  Your own ground rules
                </span>
              </div>
            </div>
            <div className="art-bottom">
              <span>Private workspace</span>
              <span>
                Saved as you go <span className="live-indicator" />
              </span>
            </div>
          </div>
        </section>
        <section className="value-grid" aria-label="Workspace capabilities">
          {[
            {
              icon: ListChecks,
              label: "01 / FIND YOUR FOCUS",
              title: "A watchlist with purpose.",
              text: "Keep up to 50 symbols in your research list. Add, remove, and undo without losing your place.",
            },
            {
              icon: SlidersHorizontal,
              label: "02 / DEFINE YOUR APPROACH",
              title: "A plan you can revisit.",
              text: "Record your experience, allocation preference, and research notes. Your draft saves as you work.",
            },
            {
              icon: ShieldCheck,
              label: "03 / STAY IN CONTROL",
              title: "Clarity at every step.",
              text: "See what is saved, what needs attention, and what is connected. No trading action happens in this workspace.",
            },
          ].map((card) => (
            <article className="panel value-card" key={card.title}>
              <card.icon size={24} />
              <p className="eyebrow">{card.label}</p>
              <h2>{card.title}</h2>
              <p>{card.text}</p>
            </article>
          ))}
        </section>
        <section className="landing-cta">
          <div>
            <p className="eyebrow">ONE SMALL STEP</p>
            <h2>Make room for a better process.</h2>
            <p className="muted">
              Your first watchlist starts with one symbol.
            </p>
          </div>
          <Link className="primary-button large" to="/demo">
            Get started <ArrowRight size={18} />
          </Link>
        </section>
      </div>
    </Shell>
  );
}
export function PricingPage() {
  const [price, setPrice] = useState<{
      available: boolean;
      amount?: number;
      currency?: string;
      interval?: string;
    } | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    const abort = new AbortController();
    void api("/api/session", { signal: abort.signal })
      .then(() =>
        api<{
          available: boolean;
          amount?: number;
          currency?: string;
          interval?: string;
        }>("/api/billing/price", { signal: abort.signal }),
      )
      .then(setPrice)
      .catch((e) => {
        if (!abort.signal.aborted) setError(e.message);
      });
    return () => abort.abort();
  }, []);
  return (
    <Shell>
      <section className="content-width section-pad">
        <p className="eyebrow">SIMPLE, TRANSPARENT ACCESS</p>
        <h1>Start with a free workspace.</h1>
        <p className="hero-description">
          Explore your watchlist and personal plan before making a commitment.
        </p>
        <div className="workspace-columns">
          <article className="panel">
            <p className="eyebrow">WORKSPACE</p>
            <h2 className="price">$0</h2>
            <ul className="feature-list">
              <li>Interactive demo without signup</li>
              <li>Up to 50 research symbols</li>
              <li>Automatically saved planning preferences</li>
              <li>Five-second undo for watchlist removal</li>
              <li>Dark, light, and system themes</li>
            </ul>
            <Link className="primary-button" to="/demo">
              Try the free demo
            </Link>
          </article>
          <article className="panel">
            <p className="eyebrow">STRIPE MEMBERSHIP</p>
            <h2>
              {price?.available && price.amount !== undefined
                ? `${new Intl.NumberFormat("en-US", { style: "currency", currency: price.currency }).format(price.amount / 100)} / ${price.interval}`
                : "Paid subscriptions are not open."}
            </h2>
            <p className="muted">
              {price?.available
                ? "Review the current subscription and terms in secure Stripe checkout."
                : "You can use the free workspace. We are not collecting payments for live copy trading."}
            </p>
            {price?.available && (
              <Link to="/demo" className="primary-button">
                Review membership
              </Link>
            )}
            {error && (
              <Recovery message={error} onRetry={() => location.reload()} />
            )}
          </article>
        </div>
      </section>
    </Shell>
  );
}
const articles: Record<
  string,
  { title: string; intro: string; sections: { title: string; text: string }[] }
> = {
  "/how-it-works": {
    title: "A clearer workflow.",
    intro: "Build a repeatable process in three small steps.",
    sections: [
      {
        title: "1. Choose what to research",
        text: "Add stock or ETF symbols to your watchlist. This is your research list, not a stream of live quotes or an instruction to buy.",
      },
      {
        title: "2. Write your personal plan",
        text: "Record your experience, allocation preference, and notes. Drafts save to the server and show a timestamp after confirmation.",
      },
      {
        title: "3. Connect when you are ready",
        text: "With an email-verified account and a configured Alpaca integration, connect a paper or eligible live account for a read-only view. No trades are placed by this workspace.",
      },
    ],
  },
  "/risk": {
    title: "Know what each control does.",
    intro: "Clear boundaries are part of a useful trading tool.",
    sections: [
      {
        title: "A planning preference is not a risk engine",
        text: "The allocation slider records your intention. It does not enforce brokerage limits, submit orders, liquidate positions, or guarantee a maximum loss.",
      },
      {
        title: "Brokerage access is read-only",
        text: "The current Alpaca connection requests account viewing access. Paper and live account views are separated. You can remove a stored connection and revoke the application in Alpaca.",
      },
      {
        title: "Understand investment risk",
        text: "Stocks and options can lose value. Options involve additional risks, including expiration and assignment. Review your broker’s disclosures and account permissions before trading directly through your broker.",
      },
    ],
  },
  "/faq": {
    title: "Straight answers.",
    intro: "What the current workspace does, without the fine print.",
    sections: [
      {
        title: "Do I need an account?",
        text: "The demo needs no account and keeps practice changes in your browser tab. Create an account to use your separate private dashboard.",
      },
      {
        title: "Where is my work saved?",
        text: "Your preferences and watchlist are stored in the application database. The save indicator confirms the server acknowledged the write. An offline or failed save is shown explicitly.",
      },
      {
        title: "Does the workspace execute trades?",
        text: "No. It stores a personal plan and research list and can show a connected Alpaca account. Live copy execution is not enabled.",
      },
      {
        title: "How does undo work?",
        text: "Removing a watchlist item schedules deletion on the server with a five-second undo window. Undo restores it before that deadline. Afterwards, you can add the symbol again.",
      },
    ],
  },
  "/traders": {
    title: "Verified history comes first.",
    intro: "There are no published traders available to copy in this release.",
    sections: [
      {
        title: "No invented performance",
        text: "Trader listings require participating traders, permission to access their history, and a documented verification process. This release does not present hypothetical traders as real people or simulated returns as actual performance.",
      },
      {
        title: "Keep building your process",
        text: "Use your workspace to maintain your research list and personal plan while the trading service is being developed and verified.",
      },
    ],
  },
  "/support": {
    title: "Get back to what matters.",
    intro: "Help with your workspace, account, or connection.",
    sections: [
      {
        title: "Unsaved changes",
        text: "Keep the page open and use Retry save. If another tab changed the same draft, load the saved version before continuing. Do not reload an unsaved draft unless you intend to discard those changes.",
      },
      {
        title: "Account or provider trouble",
        text: "Use password recovery when email delivery is available, or contact us if you cannot sign in. If Alpaca authorization expires, connect again. Manage any actual trades directly with your broker; this workspace does not execute them.",
      },
      {
        title: "Send a support request",
        text: "Use Contact & support from the footer without signing in, or choose Get help inside your workspace. You will receive a reference after the message is stored. Do not include secrets or payment-card details.",
      },
    ],
  },
};
export function InformationPage() {
  const { pathname } = useLocation();
  const article = articles[pathname];
  return (
    <Shell>
      <section className="content-width article-page">
        <p className="eyebrow">MIRRORTAPE / CLEAR BY DESIGN</p>
        <h1>{article?.title ?? "This page is off the tape."}</h1>
        <p className="hero-description">
          {article?.intro ??
            "The page may have moved, or the link may be incorrect."}
        </p>
        {article?.sections.map((section) => (
          <article key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.text}</p>
          </article>
        ))}
        <Link className="primary-button" to="/demo">
          Explore the demo dashboard <ArrowRight size={18} />
        </Link>
      </section>
    </Shell>
  );
}
