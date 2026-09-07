import DraftRecovery from "./DraftRecovery";
import { useEffect, useState, useRef, type FormEvent } from "react";
import { Link } from "react-router";
import {
  api,
  ApiError,
  type Session,
  type SavedDraft,
  type Watchlist,
  type WatchItem,
} from "./api";
import { useDraft } from "./useDraft";
import {
  Shell,
  Skeleton,
  Progress,
  Recovery,
  Tip,
  Honeypot,
  Community,
} from "./Primitives";
import SocialButtons from "./SocialButtons";
import AddressField from "./AddressField";
type Snapshot = { session: Session; draft: SavedDraft; watchlist: Watchlist };
export default function Workspace() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null),
    [step, setStep] = useState(0),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    async function load() {
      try {
        setStep(0);
        const session = await api<Session>("/api/session", {
          signal: abort.signal,
        });
        setStep(1);
        const draft = await api<SavedDraft>("/api/draft", {
          signal: abort.signal,
        });
        setStep(2);
        const watchlist = await api<Watchlist>("/api/watchlist", {
          signal: abort.signal,
        });
        setStep(3);
        setSnapshot({ session, draft, watchlist });
      } catch (e) {
        if (!abort.signal.aborted)
          setError(
            e instanceof Error
              ? e.message
              : "We could not load your workspace.",
          );
      }
    }
    void load();
    return () => abort.abort();
  }, [retry]);
  return (
    <Shell>
      {snapshot ? (
        <WorkspaceContent initial={snapshot} />
      ) : (
        <section className="content-width section-pad">
          <p className="eyebrow">YOUR WORKSPACE</p>
          <h1>Getting everything ready.</h1>
          <Progress
            steps={[
              "Opening your secure session",
              "Finding your saved preferences",
              "Loading your watchlist",
            ]}
            current={step}
          />
          {error ? (
            <Recovery
              message={error}
              onRetry={() => {
                setError("");
                setRetry((n) => n + 1);
              }}
            />
          ) : (
            <Skeleton />
          )}
        </section>
      )}
    </Shell>
  );
}
function WorkspaceContent({ initial }: { initial: Snapshot }) {
  const { session } = initial;
  const draft = useDraft(initial.draft, session);
  const [items, setItems] = useState(initial.watchlist.items),
    [error, setError] = useState(""),
    [pending, setPending] = useState("");
  const clockOffset = useRef(
    Date.parse(initial.watchlist.serverTime) - Date.now(),
  );
  const [time, setTime] = useState(() =>
      Date.parse(initial.watchlist.serverTime),
    ),
    [count, setCount] = useState<number | null>(null),
    [availability, setAvailability] = useState<{
      available: boolean;
      remaining: number | null;
      endsAt: string | null;
    } | null>(null),
    [notice, setNotice] = useState("");
  const [pane, setPane] = useState<"plan" | "account" | "support">("plan");
  const symbol = draft.data.symbolInput;
  const setSymbol = (value: string) => draft.update({ symbolInput: value });
  const deleting = items.filter((i) => i.deleteAt);
  async function refresh() {
    const r = await api<Watchlist>("/api/watchlist");
    clockOffset.current = Date.parse(r.serverTime) - Date.now();
    setTime(Date.parse(r.serverTime));
    setItems(r.items);
  }
  useEffect(() => {
    if (!items.some((i) => i.deleteAt)) return;
    let refreshing = false;
    let nextRefresh = 0;
    const timer = setInterval(() => {
      setTime(Date.now() + clockOffset.current);
      if (
        !refreshing &&
        Date.now() >= nextRefresh &&
        items.some(
          (i) =>
            i.deleteAt &&
            Date.parse(i.deleteAt) <= Date.now() + clockOffset.current,
        )
      ) {
        refreshing = true;
        nextRefresh = Date.now() + 5000;
        void api<Watchlist>("/api/watchlist")
          .then((r) => setItems(r.items))
          .catch(() =>
            setError(
              "Your watchlist could not be refreshed. Refresh the workspace to see the latest saved state.",
            ),
          )
          .finally(() => {
            refreshing = false;
          });
      }
    }, 250);
    return () => clearInterval(timer);
  }, [items]);
  useEffect(() => {
    const abort = new AbortController();
    void Promise.all([
      api<{ active: number | null }>("/api/community", {
        signal: abort.signal,
      }),
      api<{
        available: boolean;
        remaining: number | null;
        endsAt: string | null;
      }>("/api/availability", { signal: abort.signal }),
    ])
      .then(([community, capacity]) => {
        setCount(community.active);
        setAvailability(capacity);
      })
      .catch(() => {});
    return () => abort.abort();
  }, []);
  useEffect(() => {
    if (!draft.data.shareActivity || draft.dirty) return;
    const send = () => {
      void api("/api/activity", {
        method: "POST",
        csrf: session.csrf,
        body: { website: "" },
      }).catch(() => {});
    };
    send();
    const timer = setInterval(send, 60000);
    return () => clearInterval(timer);
  }, [draft.data.shareActivity, draft.dirty, session.csrf]);
  async function action(name: string, work: () => Promise<void>) {
    setPending(name);
    setError("");
    try {
      await work();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "We could not complete this change. Try again.",
      );
    } finally {
      setPending("");
    }
  }
  async function addSymbol(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await action("Adding symbol", async () => {
      await api("/api/watchlist", {
        method: "POST",
        csrf: session.csrf,
        body: { symbol, website: String(form.get("website") ?? "") },
      });
      setSymbol("");
      await refresh();
    });
  }
  async function remove(item: WatchItem) {
    await action("Scheduling removal", async () => {
      await api(`/api/watchlist/${item.id}`, {
        method: "DELETE",
        csrf: session.csrf,
        body: {},
      });
      await refresh();
    });
  }
  async function undo(item: WatchItem) {
    await action("Restoring symbol", async () => {
      await api(`/api/watchlist/${item.id}/undo`, {
        method: "POST",
        csrf: session.csrf,
        body: { undoToken: item.undoToken },
      });
      await refresh();
    });
  }
  const emailInvalid =
    draft.data.email.length > 0 &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.data.email);
  return (
    <div className="content-width workspace-main">
      <div className="page-top">
        <div>
          <p className="eyebrow">YOUR EDGE STARTS WITH A PLAN</p>
          <h1>
            {draft.data.name
              ? `${draft.data.name.split(" ")[0]}’s workspace`
              : "Make your next move deliberate."}
          </h1>
          <p className="muted">
            {session.user.verified
              ? "Your verified account"
              : "Your private workspace"}{" "}
            · Your preferences and watchlist, together.
          </p>
        </div>
        <div className="session-actions">
          {session.user.authenticated ? (
            <>
              <span className="status-pill">
                {session.user.verified
                  ? "Email verified"
                  : "Verification pending"}
              </span>
              <button
                className="text-button"
                onClick={() =>
                  void action("Signing out", async () => {
                    await draft.flush();
                    await api("/api/auth/logout", {
                      method: "POST",
                      csrf: session.csrf,
                      body: {},
                    });
                    location.assign("/");
                  })
                }
              >
                Sign out
              </button>
            </>
          ) : (
            <Link className="secondary-button" to="/app/register">
              Keep my workspace
            </Link>
          )}
        </div>
      </div>
      <details className="panel onboarding-checklist">
        <summary>Your getting-started checklist</summary>
        <ul>
          <li>
            {items.some((item) => !item.deleteAt) ? "✓" : "○"} Add your first
            research symbol
          </li>
          <li>{draft.data.note ? "✓" : "○"} Write your personal plan</li>
          <li>
            {session.user.verified ? "✓" : "○"} Verify your email before
            connecting a brokerage
          </li>
        </ul>
        <p className="muted small">
          Advanced account connections are optional. Start with the research you
          need today.
        </p>
      </details>
      {!draft.data.helpDismissed && (
        <Tip
          title="A workspace built around your decisions"
          onDismiss={() => draft.update({ helpDismissed: true })}
        >
          Start with a watchlist and a personal plan. Your entries save
          automatically. Removing a symbol gives you five seconds to undo. No
          action here places a trade.
        </Tip>
      )}
      <div className="workspace-toolbar">
        <div className="tabs" role="tablist" aria-label="Workspace sections">
          {(["plan", "account", "support"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={pane === tab}
              onClick={() => setPane(tab)}
            >
              {tab === "plan"
                ? "My plan"
                : tab === "account"
                  ? "Account & billing"
                  : "Get help"}
            </button>
          ))}
        </div>
        <div className="save-status" role="status">
          {draft.error
            ? "Changes not saved"
            : draft.saving
              ? "Saving your changes…"
              : draft.dirty
                ? "Changes waiting to save…"
                : draft.savedAt
                  ? `Saved to ${session.storage} · ${new Date(draft.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
                  : "Ready when you are"}
        </div>
      </div>
      <DraftRecovery draft={draft} />
      {error && (
        <Recovery
          message={error}
          label="Refresh workspace"
          onRetry={() => void action("Refreshing workspace", refresh)}
        />
      )}
      {notice && (
        <div className="success-notice" role="status">
          {notice}
          <button
            className="icon-button"
            aria-label="Dismiss notice"
            onClick={() => setNotice("")}
          >
            ×
          </button>
        </div>
      )}
      {pending && (
        <Progress
          steps={[pending, "Confirming the saved result"]}
          current={0}
        />
      )}
      {pane === "plan" && (
        <div className="workspace-columns">
          <section className="panel watch-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">01 / WATCHLIST</p>
                <h2>Your focus, narrowed.</h2>
              </div>
              <span className="count-badge">
                {items.filter((i) => !i.deleteAt).length}/50
              </span>
            </div>
            <p className="muted small">
              Track symbols you want to research. This list does not show live
              prices.
            </p>
            <form onSubmit={addSymbol} className="inline-form">
              <label className="sr-only" htmlFor="symbol">
                Stock symbol
              </label>
              <input
                id="symbol"
                name="symbol"
                placeholder="e.g. AAPL"
                autoComplete="off"
                maxLength={10}
                pattern="[A-Za-z][A-Za-z0-9.\-]{0,9}"
                required
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              />
              <Honeypot />
              <button className="primary-button" disabled={Boolean(pending)}>
                Add symbol
              </button>
            </form>
            <ul className="watch-items">
              {items
                .filter((i) => !i.deleteAt)
                .map((item) => (
                  <li key={item.id}>
                    <span className="symbol-icon">
                      {item.symbol.slice(0, 1)}
                    </span>
                    <div>
                      <strong>{item.symbol}</strong>
                      <small>On your research list</small>
                    </div>
                    <button
                      className="icon-button remove-button"
                      type="button"
                      onClick={() => void remove(item)}
                      aria-label={`Remove ${item.symbol}`}
                      disabled={Boolean(pending)}
                    >
                      ×
                    </button>
                  </li>
                ))}
            </ul>
            {items.filter((i) => !i.deleteAt).length === 0 && (
              <div className="empty-state">
                <span className="empty-orbit">＋</span>
                <h3>A little focus goes a long way.</h3>
                <p>Add your first symbol to start a research list.</p>
              </div>
            )}
            <div className="panel-footnote">
              Entries are saved privately to your workspace.
            </div>
          </section>
          <section className="panel plan-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">02 / PERSONAL PLAN</p>
                <h2>Set your own ground rules.</h2>
              </div>
              <span className="status-pill">
                Step {draft.data.step + 1} of 3
              </span>
            </div>
            <Progress
              steps={[
                "Introduce yourself",
                "Define your approach",
                "Review your plan",
              ]}
              current={draft.data.step}
            />
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!emailInvalid)
                  draft.update({ step: Math.min(2, draft.data.step + 1) });
              }}
            >
              <Honeypot />
              {draft.data.step === 0 && (
                <div className="form-stack">
                  <div className="field">
                    <label htmlFor="onboarding-email">
                      Start with your email
                    </label>
                    <input
                      id="onboarding-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      maxLength={254}
                      value={draft.data.email}
                      onChange={(e) => draft.update({ email: e.target.value })}
                      aria-invalid={emailInvalid}
                      aria-describedby="email-help"
                    />
                    <small
                      id="email-help"
                      className={emailInvalid ? "field-error" : ""}
                    >
                      {emailInvalid
                        ? "Enter an email such as name@example.com."
                        : "Optional while exploring. This does not create an account or subscribe you to email."}
                    </small>
                  </div>
                  <button className="primary-button" disabled={emailInvalid}>
                    Continue
                  </button>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => draft.update({ step: 1 })}
                  >
                    Explore without an email
                  </button>
                </div>
              )}
              {draft.data.step === 1 && (
                <div className="form-stack">
                  <div className="field">
                    <label htmlFor="display-name">
                      What should we call you?
                    </label>
                    <input
                      id="display-name"
                      name="name"
                      autoComplete="name"
                      maxLength={100}
                      value={draft.data.name}
                      onChange={(e) => draft.update({ name: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="experience">Your experience</label>
                    <select
                      id="experience"
                      value={draft.data.experience}
                      onChange={(e) =>
                        draft.update({
                          experience: e.target.value as
                            "new" | "some" | "experienced",
                        })
                      }
                    >
                      <option value="new">I’m getting started</option>
                      <option value="some">I have some experience</option>
                      <option value="experienced">I trade regularly</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="allocation">
                      Planning allocation{" "}
                      <strong>{draft.data.allocation}%</strong>
                    </label>
                    <input
                      id="allocation"
                      type="range"
                      min="1"
                      max="25"
                      value={draft.data.allocation}
                      onChange={(e) =>
                        draft.update({ allocation: Number(e.target.value) })
                      }
                    />
                    <small>
                      A personal planning preference. This does not enforce a
                      trading limit or move funds.
                    </small>
                  </div>
                  <button className="primary-button">Review my plan</button>
                </div>
              )}
              {draft.data.step === 2 && (
                <div className="form-stack">
                  <div className="plan-summary">
                    <span className="eyebrow">YOUR APPROACH</span>
                    <h3>{draft.data.allocation}% planning allocation</h3>
                    <p>
                      {draft.data.experience === "new"
                        ? "Learning the fundamentals"
                        : draft.data.experience === "some"
                          ? "Building on experience"
                          : "An experienced perspective"}
                    </p>
                  </div>
                  <div className="field">
                    <label htmlFor="plan-note">Notes to your future self</label>
                    <textarea
                      id="plan-note"
                      maxLength={2000}
                      rows={4}
                      value={draft.data.note}
                      onChange={(e) => draft.update({ note: e.target.value })}
                      placeholder="What matters before you make a decision?"
                    />
                    <small>
                      {draft.data.note.length}/2,000 · Saves automatically
                    </small>
                  </div>
                  <AddressField
                    value={draft.data.address}
                    onChange={(address) => draft.update({ address })}
                    session={session}
                  />
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={draft.data.shareActivity}
                      onChange={(e) =>
                        draft.update({ shareActivity: e.target.checked })
                      }
                    />
                    Include my anonymous visit in aggregate community activity.
                    No account details are shared.
                  </label>
                  <div className="success-notice">
                    Your plan stays here as you refine it. It is not a trade
                    instruction.
                  </div>
                </div>
              )}
              {draft.data.step > 0 && (
                <button
                  type="button"
                  className="text-button"
                  onClick={() => draft.update({ step: draft.data.step - 1 })}
                >
                  ← Previous step
                </button>
              )}
            </form>
          </section>
        </div>
      )}
      {pane === "account" && (
        <AccountPanel
          session={session}
          onError={setError}
          onNotice={setNotice}
        />
      )}
      {pane === "support" && (
        <section className="panel support-panel">
          <p className="eyebrow">WE’RE HERE TO HELP</p>
          <h2>Tell us what happened.</h2>
          <p className="muted">
            Your message is saved as you write. Never include passwords, API
            keys, payment-card details, or brokerage credentials.
          </p>
          <form
            className="form-stack"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              void action("Saving your support request", async () => {
                const r = await api<{ id: string }>("/api/support", {
                  method: "POST",
                  csrf: session.csrf,
                  body: {
                    email: draft.data.email,
                    message: draft.data.supportMessage,
                    website: String(form.get("website") ?? ""),
                  },
                });
                setNotice(`Support request saved. Your reference is ${r.id}.`);
              });
            }}
          >
            <Honeypot />
            <div className="field">
              <label htmlFor="support-email">Reply email</label>
              <input
                id="support-email"
                type="email"
                autoComplete="email"
                required
                value={draft.data.email}
                onChange={(e) => draft.update({ email: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="support-message">How can we help?</label>
              <textarea
                id="support-message"
                required
                minLength={10}
                maxLength={4000}
                rows={6}
                value={draft.data.supportMessage}
                onChange={(e) =>
                  draft.update({ supportMessage: e.target.value })
                }
              />
            </div>
            <button className="primary-button" disabled={Boolean(pending)}>
              Send support request
            </button>
          </form>
        </section>
      )}
      {pane === "account" && (
        <section className="panel">
          <h2>Sign-in methods</h2>
          <p className="muted">
            Connect another provider while signed in. We never merge accounts
            just because their email addresses match.
          </p>
          <SocialButtons session={session} link />
        </section>
      )}
      {availability?.available &&
        availability.remaining !== null &&
        availability.remaining <= 10 && (
          <aside className="capacity-banner">
            <strong>{availability.remaining} cohort places available</strong>
            <p>
              Availability is based on current reservations.
              {availability.endsAt
                ? ` Reservations close ${new Date(availability.endsAt).toLocaleString()}.`
                : ""}
            </p>
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                void action("Reserving your place", async () => {
                  const r = await api<{ expiresAt: string }>(
                    "/api/reservations",
                    {
                      method: "POST",
                      csrf: session.csrf,
                      body: { website: "" },
                    },
                  );
                  setNotice(
                    `Your place is reserved until ${new Date(r.expiresAt).toLocaleString()}.`,
                  );
                  setAvailability(await api("/api/availability"));
                })
              }
              disabled={!availability.remaining || Boolean(pending)}
            >
              Reserve a place
            </button>
          </aside>
        )}
      <div className="workspace-bottom">
        <span>Trading is not enabled in this workspace.</span>
        <button
          className="text-button"
          onClick={() => draft.update({ helpDismissed: false })}
        >
          Show guidance
        </button>
      </div>
      <div className="undo-stack" aria-live="polite">
        {deleting.map((item) => (
          <div className="undo-toast" key={item.id}>
            <div>
              <strong>{item.symbol} removed</strong>
              <small>
                Undo within{" "}
                {Math.max(
                  0,
                  Math.ceil((Date.parse(item.deleteAt!) - time) / 1000),
                )}{" "}
                seconds
              </small>
            </div>
            <button
              className="undo-button"
              onClick={() => void undo(item)}
              disabled={Boolean(pending)}
            >
              Undo
            </button>
          </div>
        ))}
      </div>
      <Community count={count} />
    </div>
  );
}
function AccountPanel({
  session,
  onError,
  onNotice,
}: {
  session: Session;
  onError: (s: string) => void;
  onNotice: (s: string) => void;
}) {
  const [busy, setBusy] = useState(""),
    [connections, setConnections] = useState<
      { mode: string; connected_at: string }[] | null
    >(null),
    [billing, setBilling] = useState("Loading"),
    [account, setAccount] = useState<{
      mode: string;
      account: {
        equity: string;
        cash: string;
        currency: string;
        status: string;
      };
      positions: { symbol: string; qty: string; market_value: string | null }[];
      asOf: string;
    } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void Promise.all([
      api<{ connections: { mode: string; connected_at: string }[] }>(
        "/api/brokers",
        { signal: controller.signal },
      ),
      api<{ status: string }>("/api/billing", { signal: controller.signal }),
    ])
      .then(([r, b]) => {
        setConnections(r.connections);
        setBilling(b.status);
      })
      .catch((e) => {
        if (!controller.signal.aborted) onError(e.message);
      });
    return () => controller.abort();
  }, [onError]);
  async function perform(label: string, work: () => Promise<void>) {
    setBusy(label);
    onError("");
    try {
      await work();
    } catch (e) {
      onError(
        e instanceof Error ? e.message : "We could not complete this action.",
      );
    } finally {
      setBusy("");
    }
  }
  async function redirect(path: string, body: unknown = {}) {
    const r = await api<{ url: string }>(path, {
      method: "POST",
      csrf: session.csrf,
      body,
    });
    const url = new URL(r.url);
    if (
      ![
        "app.alpaca.markets",
        "checkout.stripe.com",
        "billing.stripe.com",
      ].includes(url.hostname) ||
      url.protocol !== "https:"
    )
      throw new ApiError(
        "We could not verify the provider link. Try again.",
        "REDIRECT",
        400,
      );
    location.assign(url.toString());
  }
  return (
    <div className="workspace-columns">
      <section className="panel">
        <p className="eyebrow">BROKERAGE CONNECTION</p>
        <h2>Your Alpaca account.</h2>
        <p className="muted">
          Connect to view real account information. This connection requests
          read-only access and cannot place trades.
        </p>
        {!session.user.verified && (
          <div className="context-tip">
            Create an account and verify your email before linking a brokerage.
          </div>
        )}
        {busy && (
          <Progress
            steps={[busy, "Waiting for provider confirmation"]}
            current={0}
          />
        )}
        <div className="button-row">
          <button
            className="primary-button"
            disabled={
              Boolean(busy) ||
              !session.user.verified ||
              !session.features.alpaca
            }
            onClick={() =>
              void perform("Preparing Alpaca authorization", () =>
                redirect("/api/brokers/alpaca/connect", { mode: "paper" }),
              )
            }
          >
            Connect Alpaca paper
          </button>
          <button
            className="secondary-button"
            disabled={
              Boolean(busy) ||
              !session.user.verified ||
              !session.features.alpaca
            }
            onClick={() =>
              void perform("Preparing Alpaca authorization", () =>
                redirect("/api/brokers/alpaca/connect", { mode: "live" }),
              )
            }
          >
            Connect live account
          </button>
        </div>
        {!session.features.alpaca && (
          <p className="small muted">
            Alpaca linking is unavailable on this installation. Your guest
            workspace remains usable.
          </p>
        )}
        {connections === null ? (
          <Skeleton />
        ) : connections.length === 0 ? (
          <p className="empty-copy">No brokerage accounts connected.</p>
        ) : (
          connections.map((c) => (
            <div className="connection-row" key={c.mode}>
              <span>Alpaca · {c.mode}</span>
              <button
                className="text-button"
                onClick={() =>
                  void perform("Fetching your account", async () =>
                    setAccount(
                      await api(`/api/brokers/alpaca/account?mode=${c.mode}`),
                    ),
                  )
                }
              >
                Refresh account
              </button>
              <button
                className="text-button"
                onClick={() =>
                  void perform("Removing stored connection", async () => {
                    const r = await api<{ message: string }>(
                      `/api/brokers/alpaca/${c.mode}`,
                      { method: "DELETE", csrf: session.csrf, body: {} },
                    );
                    setConnections(
                      (previous) =>
                        previous?.filter((x) => x.mode !== c.mode) ?? [],
                    );
                    setAccount(null);
                    onNotice(r.message);
                  })
                }
              >
                Disconnect
              </button>
            </div>
          ))
        )}
        {account && (
          <div className="account-snapshot">
            <span className="status-pill">
              {account.mode.toUpperCase()} · {account.account.status}
            </span>
            <h3>
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: account.account.currency,
              }).format(Number(account.account.equity))}{" "}
              equity
            </h3>
            <small>Updated {new Date(account.asOf).toLocaleString()}</small>
            <ul>
              {account.positions.map((p) => (
                <li key={p.symbol}>
                  {p.symbol}: {p.qty} shares/contracts
                </li>
              ))}
            </ul>
            {!account.positions.length && (
              <p>No positions returned by Alpaca.</p>
            )}
          </div>
        )}
      </section>
      <section className="panel">
        <p className="eyebrow">MEMBERSHIP</p>
        <h2>Billing, without surprises.</h2>
        <p className="muted">
          Stripe hosts checkout and billing management. Account access follows
          confirmed subscription status.
        </p>
        <p>
          Subscription status: <strong>{billing}</strong>
        </p>
        <div className="button-row">
          <button
            className="primary-button"
            disabled={
              !session.features.billing ||
              !session.user.verified ||
              Boolean(busy)
            }
            onClick={() =>
              void perform("Preparing Stripe checkout", () =>
                redirect("/api/billing/checkout"),
              )
            }
          >
            View secure checkout
          </button>
          <button
            className="secondary-button"
            disabled={!session.user.verified || Boolean(busy)}
            onClick={() =>
              void perform("Opening billing management", () =>
                redirect("/api/billing/portal"),
              )
            }
          >
            Manage billing
          </button>
        </div>
        {!session.features.billing && (
          <p className="small muted">
            Paid subscriptions are not being offered on this installation.
          </p>
        )}
        {session.termsUrl && <a href={session.termsUrl}>Subscription terms</a>}
        {session.privacyUrl && <a href={session.privacyUrl}>Privacy policy</a>}
      </section>
    </div>
  );
}
