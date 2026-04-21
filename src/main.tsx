import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import "./index.css";
import App from "./App";

const canonicalBasePath = new URL(import.meta.env.BASE_URL, window.location.origin)
  .pathname;
if (window.location.pathname !== canonicalBasePath) {
  window.history.replaceState(
    null,
    "",
    `${canonicalBasePath}${window.location.search}${window.location.hash}`,
  );
}

const convexUrl = import.meta.env.VITE_CONVEX_URL;
const convexClient = convexUrl ? new ConvexReactClient(convexUrl) : null;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {convexClient ? (
      <ConvexProvider client={convexClient}>
        <App convexReady />
      </ConvexProvider>
    ) : (
      <App convexReady={false} />
    )}
  </StrictMode>,
)
