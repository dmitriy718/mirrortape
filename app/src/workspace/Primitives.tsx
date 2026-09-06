import { Component, type ReactNode, useState, useId } from "react";
import { Link } from "react-router";
import ThemeControl from "./ThemeControl";
export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="product">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="product-nav">
        <Link to="/" className="wordmark" aria-label="MirrorTape home">
          <span className="brand-cursor" />
          MIRROR<span>TAPE</span>
        </Link>
        <nav aria-label="Main navigation">
          <Link to="/app">Workspace</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/support">Help</Link>
        </nav>
        <ThemeControl />
      </header>
      <main id="main">{children}</main>
      <footer className="product-footer">
        <span>© {new Date().getFullYear()} MirrorTape</span>
        <span>Stocks & options. Your decisions, clearly recorded.</span>
        <Link to="/support">Contact & support</Link>
      </footer>
    </div>
  );
}
export function Honeypot() {
  return (
    <div className="honeypot" aria-hidden="true">
      <label>
        Leave this field empty
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}
export function Progress({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className="progress-block" role="status" aria-live="polite">
      <div className="progress-track">
        <span
          style={{
            width: `${Math.max(0, Math.min(100, (current / steps.length) * 100))}%`,
          }}
        />
      </div>
      <ol className="progress-steps">
        {steps.map((step, i) => (
          <li
            key={step}
            className={
              i < current ? "complete" : i === current ? "current" : ""
            }
          >
            <span>{i < current ? "✓" : i + 1}</span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}
export function Skeleton() {
  return (
    <section
      className="workspace-skeleton"
      aria-busy="true"
      aria-label="Loading your workspace"
    >
      <div className="skeleton skeleton-title" />
      <div className="workspace-columns">
        {[0, 1, 2].map((n) => (
          <div className="panel" key={n}>
            {[0, 1, 2, 3].map((i) => (
              <div className="skeleton skeleton-line" key={i} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
export function Recovery({
  message,
  onRetry,
  label = "Try again",
}: {
  message: string;
  onRetry: () => void;
  label?: string;
}) {
  return (
    <div className="recovery" role="alert">
      <div>
        <strong>Let’s get you back on track.</strong>
        <p>{message}</p>
      </div>
      <button type="button" className="secondary-button" onClick={onRetry}>
        {label}
      </button>
    </div>
  );
}
export function Tip({
  title,
  children,
  onDismiss,
}: {
  title: string;
  children: ReactNode;
  onDismiss: () => void;
}) {
  const id = useId();
  return (
    <aside className="context-tip" aria-labelledby={id}>
      <div>
        <strong id={id}>{title}</strong>
        <p>{children}</p>
      </div>
      <button
        type="button"
        className="icon-button"
        onClick={onDismiss}
        aria-label="Dismiss guidance"
      >
        ×
      </button>
    </aside>
  );
}
export function Community({ count }: { count: number | null }) {
  const [dismissed, setDismissed] = useState(false);
  if (!count || dismissed) return null;
  return (
    <aside className="community-toast" aria-label="Recent community activity">
      <span className="live-indicator" />
      <p>
        <strong>{count}+ people</strong>
        <br />
        opted in to share that they explored in the last 15 minutes.
      </p>
      <button
        type="button"
        aria-label="Dismiss community activity"
        className="icon-button"
        onClick={() => setDismissed(true)}
      >
        ×
      </button>
    </aside>
  );
}
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <Shell>
        <section className="content-width section-pad">
          <Recovery
            message="This page could not finish loading. Reload to recover your last saved work."
            label="Reload page"
            onRetry={() => location.reload()}
          />
        </section>
      </Shell>
    ) : (
      this.props.children
    );
  }
}
