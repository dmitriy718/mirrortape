import { useState } from "react";
import { Link } from "react-router";
import { Shell } from "./Primitives";
type Demo = { symbols: string[]; note: string };
function readDemo(): Demo {
  try {
    const saved = JSON.parse(
      sessionStorage.getItem("mirrortape-demo") ?? "null",
    );
    if (
      saved &&
      Array.isArray(saved.symbols) &&
      saved.symbols.length <= 50 &&
      saved.symbols.every(
        (s: unknown) =>
          typeof s === "string" && /^[A-Z][A-Z0-9.-]{0,9}$/.test(s),
      ) &&
      typeof saved.note === "string" &&
      saved.note.length <= 2000
    )
      return saved;
  } catch {
    /* Begin a clean demo if browser storage is unavailable. */
  }
  return { symbols: ["AAPL", "MSFT", "NVDA"], note: "" };
}
export default function DemoDashboard() {
  const [data, setData] = useState(readDemo),
    [symbol, setSymbol] = useState(""),
    [message, setMessage] = useState(""),
    [step, setStep] = useState(0);
  function update(change: Partial<Demo>) {
    const next = { ...data, ...change };
    setData(next);
    try {
      sessionStorage.setItem("mirrortape-demo", JSON.stringify(next));
      setMessage("Demo changes saved in this browser tab.");
    } catch {
      setMessage(
        "Demo changes are kept on this page only. Browser storage is unavailable.",
      );
    }
  }
  return (
    <Shell>
      <div className="content-width workspace-main">
        <aside className="demo-banner">
          <strong>DEMO DASHBOARD · PRACTICE ONLY</strong>
          <p>
            This is a separate sandbox. Example symbols are not recommendations.
            No account balances, live quotes, or trades are shown.
          </p>
        </aside>
        <div className="page-top">
          <div>
            <p className="eyebrow">EXPLORE BEFORE YOU SIGN UP</p>
            <h1>Your process, at a glance.</h1>
            <p className="muted">
              Try a research list and a personal plan. Your private dashboard
              starts separately after signup.
            </p>
          </div>
          <Link className="primary-button" to="/app/register">
            Create my private dashboard
          </Link>
        </div>
        <div className="demo-tour" aria-label="Demo tour">
          <button
            className={step === 0 ? "secondary-button" : "text-button"}
            onClick={() => setStep(0)}
          >
            1. Build a watchlist
          </button>
          <button
            className={step === 1 ? "secondary-button" : "text-button"}
            onClick={() => setStep(1)}
          >
            2. Write a plan
          </button>
          <button
            className={step === 2 ? "secondary-button" : "text-button"}
            onClick={() => setStep(2)}
          >
            3. Keep it private
          </button>
        </div>
        <div className="workspace-columns">
          <section className="panel">
            <p className="eyebrow">EXAMPLE RESEARCH LIST</p>
            <h2>A watchlist you can shape.</h2>
            <form
              className="inline-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (data.symbols.length >= 50) {
                  setMessage("The demo supports up to 50 symbols.");
                  return;
                }
                if (!data.symbols.includes(symbol))
                  update({ symbols: [...data.symbols, symbol] });
                setSymbol("");
              }}
            >
              <label className="sr-only" htmlFor="demo-symbol">
                Demo stock symbol
              </label>
              <input
                id="demo-symbol"
                value={symbol}
                onChange={(event) =>
                  setSymbol(event.target.value.toUpperCase())
                }
                pattern="[A-Z][A-Z0-9.\-]{0,9}"
                maxLength={10}
                required
              />
              <button className="primary-button">Add to demo</button>
            </form>
            <ul className="watch-items">
              {data.symbols.map((item) => (
                <li key={item}>
                  <strong>{item}</strong>
                  <span className="muted">Example symbol</span>
                  <button
                    className="icon-button"
                    aria-label={`Remove demo ${item}`}
                    onClick={() =>
                      update({
                        symbols: data.symbols.filter((s) => s !== item),
                      })
                    }
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <section className="panel">
            <p className="eyebrow">YOUR PRACTICE PLAN</p>
            <h2>
              {
                [
                  "Start with what matters.",
                  "Make your thinking visible.",
                  "A space of your own.",
                ][step]
              }
            </h2>
            <p className="muted">
              {
                [
                  "Add or remove symbols to see how a focused research list works.",
                  "Keep a note about what you want to research before deciding.",
                  "Create an account to store your own research on the server, independently from this demo.",
                ][step]
              }
            </p>
            <div className="field">
              <label htmlFor="demo-note">Demo research note (optional)</label>
              <textarea
                id="demo-note"
                maxLength={2000}
                rows={6}
                value={data.note}
                onChange={(event) => update({ note: event.target.value })}
              />
            </div>
            <p role="status" className="muted small">
              {message || "Demo edits stay separate from your private account."}
            </p>
            <Link className="primary-button" to="/app/register">
              Keep my own research organized
            </Link>
          </section>
        </div>
      </div>
    </Shell>
  );
}
