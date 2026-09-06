import { useEffect, useState, useRef } from "react";
import { api, type Session } from "./api";
export default function AddressField({
  value,
  onChange,
  session,
}: {
  value: string;
  onChange: (value: string) => void;
  session: Session;
}) {
  const [enabled, setEnabled] = useState(false),
    [results, setResults] = useState<{ id: string; label: string }[]>([]),
    [message, setMessage] = useState("");
  const requestToken = useRef(crypto.randomUUID());
  useEffect(() => {
    if (!enabled || !session.features.address || value.trim().length < 3)
      return;
    const abort = new AbortController();
    const timer = setTimeout(() => {
      void api<{ suggestions: { id: string; label: string }[] }>(
        "/api/address/suggestions",
        {
          method: "POST",
          csrf: session.csrf,
          body: { input: value, sessionToken: requestToken.current },
          signal: abort.signal,
        },
      )
        .then((r) => {
          setResults(r.suggestions);
          setMessage(
            r.suggestions.length
              ? ""
              : "No matches. You can enter the address yourself.",
          );
        })
        .catch(() => {
          if (!abort.signal.aborted)
            setMessage(
              "Suggestions are unavailable. You can enter the address yourself.",
            );
        });
    }, 400);
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [value, enabled, session]);
  async function choose(id: string) {
    try {
      const r = await api<{ formattedAddress: string }>(
        "/api/address/details",
        {
          method: "POST",
          csrf: session.csrf,
          body: { id, sessionToken: requestToken.current },
        },
      );
      onChange(r.formattedAddress);
      setResults([]);
      setEnabled(false);
      requestToken.current = crypto.randomUUID();
    } catch {
      setMessage(
        "We could not finish the lookup. You can enter the address yourself.",
      );
    }
  }
  return (
    <div className="field">
      <label htmlFor="address">
        Address <span className="muted">(optional)</span>
      </label>
      <input
        id="address"
        name="street-address"
        autoComplete="street-address"
        maxLength={250}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setResults([]);
        }}
        aria-describedby="address-help"
      />
      <small id="address-help">
        Only add an address if you want it in your saved profile.
      </small>
      {session.features.address && (
        <label className="check-label">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          Use Google address suggestions. What you type is sent to Google.
        </label>
      )}
      {enabled && results.length > 0 && (
        <div className="suggestions" aria-label="Address suggestions">
          {results.map((r) => (
            <button type="button" key={r.id} onClick={() => void choose(r.id)}>
              {r.label}
            </button>
          ))}
          <small>Google Maps</small>
        </div>
      )}
      {message && <small role="status">{message}</small>}
    </div>
  );
}
