import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import { api, type Session } from "./api";
import { Shell, Skeleton, Recovery } from "./Primitives";
import Workspace from "./Workspace";
export default function PrivateDashboard() {
  const [session, setSession] = useState<Session | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    void api<Session>("/api/session", { signal: controller.signal })
      .then(setSession)
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, []);
  if (error)
    return (
      <Shell>
        <Recovery message={error} onRetry={() => location.reload()} />
      </Shell>
    );
  if (!session)
    return (
      <Shell>
        <Skeleton />
      </Shell>
    );
  if (!session.user.authenticated) return <Navigate to="/app/login" replace />;
  return <Workspace />;
}
