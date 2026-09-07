import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
const pageCtas: Record<
  string,
  { title: string; label: string; detail: string }
> = {
  "/": {
    title: "Build a calmer research routine.",
    label: "Create my free account",
    detail:
      "Start with a watchlist and a plan. No card or brokerage connection needed.",
  },
  "/how-it-works": {
    title: "Put the process into practice.",
    label: "Build my first watchlist",
    detail: "Your private dashboard starts with one symbol.",
  },
  "/pricing": {
    title: "Start free. Decide at your pace.",
    label: "Start with the free plan",
    detail: "See what is included before you make a commitment.",
  },
  "/risk": {
    title: "Write down your own ground rules.",
    label: "Create my trading plan",
    detail:
      "A personal plan helps you stay deliberate. It does not guarantee investment results.",
  },
  "/faq": {
    title: "Ready for your own workspace?",
    label: "Turn answers into action",
    detail:
      "Create an account, keep your research together, and return when you need it.",
  },
  "/traders": {
    title: "Keep your research moving.",
    label: "Organize my research",
    detail:
      "Use the workspace today. Copy trading is not available in this release.",
  },
  "/about": {
    title: "Make this space your own.",
    label: "Start my private workspace",
    detail: "A free place for your list and your next question.",
  },
  "/blog": {
    title: "Put an idea into practice.",
    label: "Try a clearer research routine",
    detail: "Explore the demo before creating your private account.",
  },
  "/support": {
    title: "Keep your work and help in one place.",
    label: "Create an account to get started",
    detail:
      "Already have an account? Sign in to view your dashboard and send a support request.",
  },
};
export function PageCTA() {
  const { pathname } = useLocation();
  const cta = pageCtas[pathname];
  if (!cta) return null;
  return (
    <section className="landing-cta page-conversion" aria-label="Next step">
      <div>
        <p className="eyebrow">YOUR NEXT STEP</p>
        <h2>{cta.title}</h2>
        <p className="muted">{cta.detail}</p>
      </div>
      <Link className="primary-button large" to="/app/register">
        {cta.label}
      </Link>
    </section>
  );
}
export function ExitIntent() {
  const { pathname } = useLocation();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem("mirrortape-exit-dismissed") === "yes";
    } catch {
      return false;
    }
  });
  const close = () => {
    setOpen(false);
    setDismissed(true);
    try {
      sessionStorage.setItem("mirrortape-exit-dismissed", "yes");
    } catch {
      /* The current component still remembers the dismissal. */
    }
  };
  useEffect(() => {
    if (
      dismissed ||
      !pageCtas[pathname] ||
      !matchMedia("(hover: hover) and (pointer: fine)").matches
    )
      return;
    const since = Date.now();
    const leave = (event: MouseEvent) => {
      if (
        event.relatedTarget === null &&
        event.clientY <= 0 &&
        Date.now() - since >= 15000
      )
        setOpen(true);
    };
    document.addEventListener("mouseout", leave);
    return () => document.removeEventListener("mouseout", leave);
  }, [pathname, dismissed]);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  if (!pageCtas[pathname]) return null;
  return (
    <dialog
      className="exit-dialog"
      ref={dialog}
      aria-labelledby="exit-title"
      onCancel={close}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="exit-content">
        <button
          className="icon-button exit-close"
          aria-label="Close invitation"
          onClick={close}
        >
          ×
        </button>
        <p className="eyebrow">TAKE A LOOK FIRST</p>
        <h2 id="exit-title">See the workspace before you decide.</h2>
        <p>
          Try the interactive demo without an account. Create a private
          workspace whenever you are ready.
        </p>
        <div className="button-row">
          <Link to="/demo" className="primary-button" onClick={close}>
            Explore the demo
          </Link>
          <Link to="/app/register" className="secondary-button" onClick={close}>
            Create free account
          </Link>
        </div>
        <button className="text-button" onClick={close}>
          No thanks, continue browsing
        </button>
      </div>
    </dialog>
  );
}
