import { useCallback, useEffect, useRef, useState } from "react";
import {
  api,
  ApiError,
  type SavedDraft,
  type Session,
  type Draft,
} from "./api";

export function useDraft(initial: SavedDraft, session: Session) {
  const [data, setData] = useState(initial.data);
  const [saved, setSaved] = useState(JSON.stringify(initial.data));
  const [savedAt, setSavedAt] = useState(initial.savedAt);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [retry, setRetry] = useState(0);
  const revision = useRef(initial.revision);
  const current = useRef(initial.data);
  const persisted = useRef(JSON.stringify(initial.data));
  const pending = useRef<Promise<void> | null>(null);
  const serialized = JSON.stringify(data);
  const dirty = serialized !== saved;

  const flush = useCallback(async () => {
    if (pending.current) return pending.current;
    if (JSON.stringify(current.current) === persisted.current) return;
    setSaving(true);
    pending.current = (async () => {
      try {
        while (JSON.stringify(current.current) !== persisted.current) {
          const snapshot = JSON.stringify(current.current);
          const result = await api<{ revision: number; savedAt: string }>(
            "/api/draft",
            {
              method: "PUT",
              csrf: session.csrf,
              body: {
                revision: revision.current,
                data: JSON.parse(snapshot),
                website: "",
              },
            },
          );
          revision.current = result.revision;
          persisted.current = snapshot;
          setSaved(snapshot);
          setSavedAt(result.savedAt);
          setError(null);
        }
      } catch (cause) {
        const failure =
          cause instanceof ApiError
            ? cause
            : new ApiError(
                "We could not save your draft. Try again.",
                "SAVE_FAILED",
                0,
              );
        setError(failure);
        throw failure;
      } finally {
        pending.current = null;
        setSaving(false);
      }
    })();
    return pending.current;
  }, [session.csrf]);

  useEffect(() => {
    if (!dirty || error) return;
    const timer = setTimeout(() => {
      void flush().catch(() => {
        /* The visible recovery state is set by flush. */
      });
    }, 600);
    return () => clearTimeout(timer);
  }, [dirty, serialized, error, retry, flush]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (JSON.stringify(current.current) === persisted.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const navigate = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor =
        event.target instanceof Element ? event.target.closest("a") : null;
      if (
        !anchor ||
        anchor.target ||
        anchor.hasAttribute("download") ||
        anchor.origin !== location.origin ||
        JSON.stringify(current.current) === persisted.current
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      void flush()
        .then(() => location.assign(anchor.href))
        .catch(() => {
          /* Keep the user on the page with the recovery action. */
        });
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", navigate, true);
    };
  }, [flush]);

  const update = (change: Partial<Draft>) => {
    current.current = { ...current.current, ...change };
    setData(current.current);
  };
  const retrySave = () => {
    setError(null);
    setRetry((n) => n + 1);
  };
  const reload = async () => {
    if (pending.current) await pending.current.catch(() => undefined);
    const fresh = await api<SavedDraft>("/api/draft");
    revision.current = fresh.revision;
    current.current = fresh.data;
    persisted.current = JSON.stringify(fresh.data);
    setData(fresh.data);
    setSaved(persisted.current);
    setSavedAt(fresh.savedAt);
    setError(null);
  };
  return {
    data,
    update,
    dirty,
    saving,
    savedAt,
    error,
    retrySave,
    reload,
    flush,
  };
}
