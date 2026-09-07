import DraftRecovery from "./DraftRecovery";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router";
import { Shell, Recovery, Honeypot, Skeleton } from "./Primitives";
import { api, type Session, type SavedDraft } from "./api";
import { useDraft } from "./useDraft";
const topics = [
  "General",
  "Account",
  "Privacy",
  "Accessibility",
  "Security",
  "Billing",
];
export default function ContactPage() {
  const [loaded, setLoaded] = useState<{
      session: Session;
      draft: SavedDraft;
    } | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    void api<Session>("/api/session", { signal: controller.signal })
      .then(async (session) => ({
        session,
        draft: await api<SavedDraft>("/api/draft", {
          signal: controller.signal,
        }),
      }))
      .then(setLoaded)
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, []);
  return (
    <Shell>
      <section className="content-width editorial-page">
        <header className="editorial-heading">
          <p className="eyebrow">CONTACT · 625 TECHNOLOGIES INC.</p>
          <h1>
            Let’s get the right
            <br />
            conversation started.
          </h1>
          <p className="hero-description">
            Account help, product questions, privacy requests, or a barrier we
            need to understand. You do not need to sign in to contact us.
          </p>
        </header>
        <div className="contact-layout">
          <aside className="panel contact-guidance">
            <h2>A useful first message</h2>
            <p>
              Tell us the page you were on, what you expected, and what
              happened. Keep private details out of your initial message.
            </p>
            <ul>
              <li>
                Privacy: describe the access, correction, or deletion request
                and your state of residence.
              </li>
              <li>
                Accessibility: describe the task, barrier, and assistive
                technology if relevant.
              </li>
              <li>
                Security: describe the concern without credentials, customer
                data, or exploit payloads.
              </li>
            </ul>
            <p>
              We may need to verify identity before sharing account data or
              making sensitive changes. This form is not an emergency or
              brokerage order channel.
            </p>
            <Link to="/status">Check service availability</Link>
            <Link to="/privacy">How your message is handled</Link>
          </aside>
          <noscript>
            <p className="panel">
              Enable JavaScript to load the secure request form. The company and
              policy pages remain readable without it.
            </p>
          </noscript>
          {loaded ? (
            <ContactForm session={loaded.session} initial={loaded.draft} />
          ) : error ? (
            <Recovery message={error} onRetry={() => location.reload()} />
          ) : (
            <Skeleton />
          )}
        </div>
      </section>
    </Shell>
  );
}
function ContactForm({
  session,
  initial,
}: {
  session: Session;
  initial: SavedDraft;
}) {
  const { search } = useLocation();
  const requested = new URLSearchParams(search).get("topic") ?? "";
  const [pending, setPending] = useState(false),
    [error, setError] = useState(""),
    [reference, setReference] = useState<string | null>(null);
  const draft = useDraft(initial, session);
  const update = draft.update;
  const queryApplied = useRef<string | null>(null);
  useEffect(() => {
    if (queryApplied.current === requested) return;
    queryApplied.current = requested;
    if (topics.includes(requested) && requested !== draft.data.contactTopic)
      update({
        contactTopic: requested as SavedDraft["data"]["contactTopic"],
        supportRequestId: "",
      });
  }, [requested, update, draft.data.contactTopic]);
  const topic = draft.data.contactTopic;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    setPending(true);
    try {
      const requestId =
        (draft.data.contactTopic === topic && draft.data.supportRequestId) ||
        crypto.randomUUID();
      draft.update({
        supportRequestId: requestId,
        contactTopic: topic as SavedDraft["data"]["contactTopic"],
      });
      await draft.flush();
      const response = await api<{ id?: string }>("/api/support", {
        method: "POST",
        csrf: session.csrf,
        body: {
          requestId,
          email: draft.data.email,
          message: `${topic}: ${draft.data.supportMessage}`,
          website: String(form.get("website") ?? ""),
        },
      });
      setReference(response.id ?? "");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Your request could not be confirmed. Keep your message and try again.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="panel">
      {reference !== null ? (
        <div className="success-notice" role="status">
          <h2>Your request has been received.</h2>
          {reference && (
            <p>
              Reference:{" "}
              <strong className="request-reference">{reference}</strong>
            </p>
          )}
          <p>
            Keep this reference for follow-up. This confirms receipt, not an
            email reply or a guaranteed response time.
          </p>
          <Link to="/faq" className="primary-button">
            Browse common questions
          </Link>
          <button className="text-button" onClick={() => setReference(null)}>
            Return to my message
          </button>
        </div>
      ) : (
        <form className="form-stack" onSubmit={(e) => void submit(e)}>
          <h2>Send a request</h2>
          <p className="muted small">
            Your email and message draft save as you type. Passwords, API keys,
            card details, and identity documents do not belong in this form.
          </p>
          <Honeypot />
          <div className="field">
            <label htmlFor="contact-topic">Topic</label>
            <select
              id="contact-topic"
              value={topic}
              onChange={(e) => {
                draft.update({
                  contactTopic: e.target
                    .value as SavedDraft["data"]["contactTopic"],
                  supportRequestId: "",
                });
              }}
            >
              {topics.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="contact-email">Reply email (required)</label>
            <input
              id="contact-email"
              type="email"
              required
              autoComplete="email"
              maxLength={254}
              value={draft.data.email}
              onChange={(e) =>
                draft.update({ email: e.target.value, supportRequestId: "" })
              }
            />
          </div>
          <div className="field">
            <label htmlFor="contact-message">Your message (required)</label>
            <textarea
              id="contact-message"
              required
              rows={8}
              minLength={10}
              maxLength={3900}
              value={draft.data.supportMessage}
              onChange={(e) =>
                draft.update({
                  supportMessage: e.target.value,
                  supportRequestId: "",
                })
              }
            />
            <small>10–3,900 characters. Use plain text.</small>
          </div>
          <p role="status" className="muted small">
            {draft.error
              ? "Draft not saved. Keep this page open."
              : draft.saving || draft.dirty
                ? "Saving your draft…"
                : draft.savedAt
                  ? `Saved to ${session.storage} at ${new Date(draft.savedAt).toLocaleTimeString()}`
                  : "Your draft will save when you start typing."}
          </p>
          <DraftRecovery draft={draft} />
          <p className="muted small">
            625 Technologies Inc. uses your message to handle your request as
            described in the <Link to="/privacy">Privacy Notice</Link>.
          </p>
          {error && (
            <Recovery
              message={error}
              label="Retry sending"
              onRetry={() => {
                document.getElementById("contact-send")?.click();
              }}
            />
          )}
          <button
            id="contact-send"
            className="primary-button"
            disabled={pending}
          >
            {pending ? "Sending your request…" : "Send request"}
          </button>
        </form>
      )}
    </div>
  );
}
