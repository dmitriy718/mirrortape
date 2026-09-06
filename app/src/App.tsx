import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router";
import { Landing, PricingPage, InformationPage } from "@/workspace/PublicPages";
import { Shell, Skeleton, ErrorBoundary } from "@/workspace/Primitives";
const Workspace = lazy(() => import("@/workspace/Workspace"));
const AuthPage = lazy(() => import("@/workspace/AuthPage"));
export default function App() {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <Shell>
            <Skeleton />
          </Shell>
        }
      >
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/app" element={<Workspace />} />
          {["login", "register", "recover", "resend", "reset", "verify"].map(
            (path) => (
              <Route
                key={path}
                path={`/app/${path}`}
                element={<AuthPage key={path} />}
              />
            ),
          )}
          <Route path="/demo" element={<Navigate to="/app" replace />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="*" element={<InformationPage />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
