import PageMetadata from "./workspace/PageMetadata";
import {
  DocumentPage,
  BlogPage,
  BlogArticle,
  StatusPage,
} from "./workspace/SitePages";
import ContactPage from "./workspace/ContactPage";
import { documents } from "./content/documents";
import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router";
import { Landing, PricingPage, InformationPage } from "@/workspace/PublicPages";
import { Shell, Skeleton, ErrorBoundary } from "@/workspace/Primitives";
const Workspace = lazy(() => import("@/workspace/PrivateDashboard"));
const DemoDashboard = lazy(() => import("@/workspace/DemoDashboard"));
const AuthPage = lazy(() => import("@/workspace/AuthPage"));
export default function App() {
  return (
    <ErrorBoundary>
      <PageMetadata />
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
          <Route path="/demo" element={<DemoDashboard />} />
          <Route path="/pricing" element={<PricingPage />} />
          {Object.keys(documents).map((path) => (
            <Route key={path} path={path} element={<DocumentPage />} />
          ))}
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogArticle />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="*" element={<InformationPage />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
