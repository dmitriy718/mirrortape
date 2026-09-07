import { useEffect, useRef } from "react";
import type { Draft } from "./api";
import type { useDraft } from "./useDraft";
import { Recovery } from "./Primitives";
const labels: Record<keyof Draft, string> = {
  symbolInput: "Symbol being entered",
  email: "Email",
  name: "Name",
  address: "Address",
  city: "City",
  postalCode: "Postal code",
  experience: "Experience",
  allocation: "Planning allocation",
  note: "Research note",
  supportMessage: "Support message",
  contactTopic: "Contact topic",
  supportRequestId: "Request reference",
  shareActivity: "Community activity choice",
  helpDismissed: "Guidance preference",
  step: "Onboarding step",
};
function value(input: Draft[keyof Draft]) {
  return typeof input === "boolean"
    ? input
      ? "On"
      : "Off"
    : String(input) || "Empty";
}
export default function DraftRecovery({
  draft,
}: {
  draft: ReturnType<typeof useDraft>;
}) {
  const region = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!draft.review || !region.current) return;
    const navigationHeight =
      document.querySelector(".product-nav")?.getBoundingClientRect().height ??
      0;
    const top =
      region.current.getBoundingClientRect().top +
      window.scrollY -
      navigationHeight -
      24;
    region.current.focus({ preventScroll: true });
    window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
  }, [draft.review]);
  if (!draft.error && !draft.review) return null;
  if (draft.review)
    return (
      <section
        ref={region}
        tabIndex={-1}
        className="draft-conflicts panel"
        aria-label="Compare draft changes"
      >
        <h2>Choose the changes to keep</h2>
        <p>
          These fields changed in another tab. Other changes will be combined.
          Nothing is replaced until you choose.
        </p>
        {draft.error && draft.error.code !== "DRAFT_CONFLICT" && (
          <p role="alert">{draft.error.message}</p>
        )}
        {draft.review.conflicts.map((conflict) => (
          <div className="draft-conflict" key={conflict.key}>
            <h3>{labels[conflict.key]}</h3>
            <div>
              <strong>This tab</strong>
              <p>{value(conflict.local)}</p>
            </div>
            <div>
              <strong>Saved version</strong>
              <p>{value(conflict.remote)}</p>
            </div>
          </div>
        ))}
        <div className="button-row">
          <button
            className="primary-button"
            disabled={draft.reviewing}
            onClick={() => void draft.resolveChanges("local")}
          >
            Keep this tab’s versions
          </button>
          <button
            className="secondary-button"
            disabled={draft.reviewing}
            onClick={() => void draft.resolveChanges("remote")}
          >
            Use saved versions
          </button>
        </div>
        {draft.reviewing && (
          <p role="status">Checking and saving your choices…</p>
        )}
      </section>
    );
  return (
    <Recovery
      message={draft.error!.message}
      label={
        draft.reviewing
          ? "Checking saved changes…"
          : draft.error!.code === "DRAFT_CONFLICT"
            ? "Review saved changes"
            : "Retry save"
      }
      onRetry={() => {
        if (draft.reviewing) return;
        if (draft.error?.code === "DRAFT_CONFLICT") void draft.reviewChanges();
        else draft.retrySave();
      }}
    />
  );
}
