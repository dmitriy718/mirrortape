import { useEffect, useState, type FormEvent } from "react";
import { policyVersion } from "../content/documents";
import SocialButtons from "./SocialButtons";
import { Link, useLocation, Navigate } from "react-router";
import { api, type Session, type SavedDraft } from "./api";
import { useDraft } from "./useDraft";
import { Shell, Recovery, Honeypot, Progress } from "./Primitives";
export default function AuthPage() {
  const [loaded, setLoaded] = useState<{
      session: Session;
      draft: SavedDraft;
    } | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    const abort = new AbortController();
    void api<Session>("/api/session", { signal: abort.signal })
      .then(async (session) => ({
        session,
        draft: await api<SavedDraft>("/api/draft", { signal: abort.signal }),
      }))
      .then(setLoaded)
      .catch((e) => {
        if (!abort.signal.aborted) setError(e.message);
      });
    return () => abort.abort();
  }, []);
  return (
    <Shell>
      <section className="auth-wrap">
        {loaded ? (
          <AuthForm session={loaded.session} initial={loaded.draft} />
        ) : error ? (
          <Recovery message={error} onRetry={() => location.reload()} />
        ) : (
          <Progress
            steps={["Opening your secure session", "Loading your saved email"]}
            current={0}
          />
        )}
      </section>
    </Shell>
  );
}
function AuthForm({
  session,
  initial,
}: {
  session: Session;
  initial: SavedDraft;
}) {
  const { pathname } = useLocation();
  const kind = pathname.split("/").at(-1) ?? "login";
  const draft = useDraft(initial, session);
  const [consent, setConsent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState(""),
    [error, setError] = useState(() => {
      const errors: Record<string, string> = {
        accept_terms:
          "To create a new account, open signup and accept the Terms and adult eligibility requirement before choosing a provider.",
        failed:
          "Sign-in could not be verified. Try again or use your email and password.",
        cancelled:
          "Sign-in was cancelled. You can try again whenever you are ready.",
        account_exists:
          "An account already uses this email. Sign in with its existing method, then connect this provider from Account & billing.",
        linked_elsewhere:
          "This provider is already connected to another account. Use that account or choose another sign-in method.",
      };
      return (
        errors[new URLSearchParams(location.search).get("auth") ?? ""] ?? ""
      );
    }),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const [linkToken] = useState(
    () => new URLSearchParams(location.hash.slice(1)).get("token") ?? "",
  );
  useEffect(() => {
    if (location.hash)
      history.replaceState(null, "", location.pathname + location.search);
  }, []);
  const titles: Record<string, string> = {
    register: "Create your private dashboard.",
    login: "Welcome back.",
    recover: "Let’s get you back in.",
    reset: "Choose a new password.",
    verify: "Verify your email.",
    resend: "Get a new verification link.",
  };
  const needEmail = ["register", "login", "recover", "resend"].includes(kind),
    needPassword = ["register", "login", "reset"].includes(kind);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    setBusy(true);
    try {
      if (kind === "register" && !consent)
        throw new Error(
          "Confirm the Terms and adult eligibility requirement to create your account.",
        );
      await draft.flush();
      const website = String(form.get("website") ?? "");
      const body =
        kind === "verify"
          ? { token: linkToken, website }
          : kind === "reset"
            ? { token: linkToken, password, website }
            : ["recover", "resend"].includes(kind)
              ? { email: draft.data.email, website }
              : {
                  email: draft.data.email,
                  password,
                  website,
                  ...(kind === "register"
                    ? { acceptedTerms: policyVersion, adult: true }
                    : {}),
                };
      const result = await api<{ message?: string; created?: boolean }>(
        `/api/auth/${kind}`,
        {
          method: "POST",
          csrf: session.csrf,
          body,
        },
      );
      setPassword("");
      if (kind === "login" || (kind === "register" && result.created)) {
        location.assign("/app");
        return;
      }
      setMessage(
        result.message ??
          (kind === "verify"
            ? "Your email is verified. Return to your workspace or sign in."
            : "Your password has been reset. Sign in with your new password."),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  if (
    session.user.authenticated &&
    ["login", "register"].includes(kind) &&
    !new URLSearchParams(location.search).has("auth")
  )
    return <Navigate to="/app" replace />;
  return (
    <div className="panel auth-panel">
      <p className="eyebrow">MIRRORTAPE ACCOUNT</p>
      <h1>{titles[kind] ?? "Your account"}</h1>
      <p className="muted">
        {kind === "register"
          ? "Start free with your email and a password, or continue with a sign-in provider. No card required."
          : "Your account details stay between you and MirrorTape."}
      </p>
      {kind === "register" && (
        <label className="consent-field">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span>
            I am at least 18 and in the United States. I agree to the{" "}
            <Link to="/terms" target="_blank" rel="noopener">
              Terms of Service
            </Link>{" "}
            and have read the{" "}
            <Link to="/privacy" target="_blank" rel="noopener">
              Privacy Notice
            </Link>{" "}
            (opens in a new tab).
          </span>
        </label>
      )}
      {["login", "register"].includes(kind) && (
        <>
          <SocialButtons
            session={session}
            acceptedTerms={
              kind === "register" && consent ? policyVersion : undefined
            }
            beforeStart={async () => {
              if (kind === "register" && !consent)
                throw new Error(
                  "Confirm the Terms and adult eligibility requirement before continuing.",
                );
              await draft.flush();
            }}
          />
          <p className="auth-divider">or use your email</p>
        </>
      )}
      {busy && (
        <Progress
          steps={[
            kind === "login"
              ? "Checking your account"
              : "Validating your request",
            "Confirming the result",
          ]}
          current={0}
        />
      )}
      {message ? (
        <div className="success-notice" role="status">
          {message}
          <Link className="primary-button" to="/app/login">
            Go to sign in
          </Link>
          <Link className="text-button" to="/app">
            Return to workspace
          </Link>
        </div>
      ) : (
        <form className="form-stack" onSubmit={submit}>
          <Honeypot />
          {needEmail && (
            <div className="field">
              <label htmlFor="auth-email">Email address (required)</label>
              <input
                id="auth-email"
                type="email"
                name="email"
                autoComplete="email"
                required
                maxLength={254}
                value={draft.data.email}
                onChange={(e) => draft.update({ email: e.target.value })}
              />
            </div>
          )}
          {needPassword && (
            <div className="field">
              <label htmlFor="auth-password">Password (required)</label>
              <input
                id="auth-password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={kind === "login" ? 1 : 15}
                maxLength={128}
                autoComplete={
                  kind === "login" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="text-button password-toggle"
                aria-pressed={showPassword}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? "Hide password" : "Show password"}
              </button>
              {kind !== "login" && (
                <small>
                  At least 15 characters. Passwords are never saved as drafts.
                </small>
              )}
            </div>
          )}
          {(kind === "verify" || kind === "reset") && !linkToken && (
            <p className="field-error">
              Open the full link from your email to continue.
            </p>
          )}
          {error && (
            <div className="recovery" role="alert">
              <p>{error}</p>
              <button
                type="submit"
                className="secondary-button"
                disabled={busy}
              >
                Try again
              </button>
            </div>
          )}
          <button
            className="primary-button"
            disabled={
              busy || ((kind === "verify" || kind === "reset") && !linkToken)
            }
          >
            {kind === "register"
              ? "Create account"
              : kind === "login"
                ? "Sign in"
                : kind === "recover"
                  ? "Send recovery link"
                  : kind === "reset"
                    ? "Reset password"
                    : kind === "resend"
                      ? "Resend verification"
                      : "Verify email"}
          </button>
        </form>
      )}
      {draft.error && (
        <Recovery
          message={draft.error.message}
          label="Retry email save"
          onRetry={draft.retrySave}
        />
      )}
      <div className="auth-links">
        <Link to="/demo">Explore the demo</Link>
        <Link to="/app/resend">Resend verification email</Link>
        {kind !== "login" && (
          <Link to="/app/login">Already have an account?</Link>
        )}
        {kind === "login" && (
          <>
            <Link to="/app/recover">Forgot your password?</Link>
            <Link to="/app/register">Create an account</Link>
          </>
        )}
      </div>
    </div>
  );
}
