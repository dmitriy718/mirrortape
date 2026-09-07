import { useEffect, useState } from "react";
import { api, type Session } from "./api";
import { Recovery } from "./Primitives";
const names = { google: "Google", apple: "Apple", facebook: "Facebook" };
export default function SocialButtons({
  session,
  link = false,
  beforeStart,
}: {
  session: Session;
  link?: boolean;
  beforeStart?: () => Promise<void>;
}) {
  const [providers, setProviders] = useState<
      { id: keyof typeof names; available: boolean }[]
    >([]),
    [connected, setConnected] = useState<string[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState("");
  useEffect(() => {
    const abort = new AbortController();
    void Promise.all([
      api<{ providers: typeof providers }>("/api/auth/providers", {
        signal: abort.signal,
      }),
      link
        ? api<{ providers: string[] }>("/api/auth/identities", {
            signal: abort.signal,
          })
        : Promise.resolve({ providers: [] }),
    ])
      .then(([p, c]) => {
        setProviders(p.providers);
        setConnected(c.providers);
      })
      .catch(() => {
        if (!abort.signal.aborted)
          setError(
            "Sign-in options could not be loaded. Refresh to try again.",
          );
      });
    return () => abort.abort();
  }, [link]);
  async function start(provider: keyof typeof names) {
    setBusy(provider);
    setError("");
    try {
      await beforeStart?.();
      const result = await api<{ url: string }>(
        `/api/auth/social/${provider}/start`,
        {
          method: "POST",
          csrf: session.csrf,
          body: { intent: link ? "link" : "login" },
        },
      );
      location.assign(result.url);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Sign-in could not start. Try again.",
      );
      setBusy("");
    }
  }
  return (
    <div
      className="social-options"
      aria-label={link ? "Connected sign-in methods" : "Social sign-in"}
    >
      {providers.map((p) => (
        <button
          type="button"
          className={`social-button social-${p.id}`}
          key={p.id}
          disabled={!p.available || Boolean(busy) || connected.includes(p.id)}
          onClick={() => void start(p.id)}
        >
          {busy === p.id
            ? "Opening"
            : connected.includes(p.id)
              ? "Connected to"
              : link
                ? "Connect"
                : "Continue with"}{" "}
          {names[p.id]}
          {!p.available && <small>Not available yet</small>}
        </button>
      ))}
      {error && (
        <Recovery
          message={error}
          label="Reload sign-in options"
          onRetry={() => location.reload()}
        />
      )}
    </div>
  );
}
