import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";

// ---------------------------------------------------------------------------
// Deprecation Warning Suppression: Three.js r183+ with @react-three/fiber v9
// ---------------------------------------------------------------------------
// In Three.js r183+, THREE.Clock was deprecated in favor of THREE.Timer.
// @react-three/fiber (R3F v9.7) still instantiates an internal Clock in its
// Canvas root state. All application code in this project (OrbitAccent,
// PipelineScene, DataMonumentScene, HeroParticlesScene) uses direct useFrame
// delta accumulation (elapsedRef.current += delta) rather than THREE.Clock.
//
// This filter strictly targets ONLY this specific library-internal deprecation
// message so genuine application warnings and errors pass through untouched.
// ---------------------------------------------------------------------------
if (typeof window !== "undefined") {
  const origWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Clock: This module has been deprecated. Please use THREE.Timer instead.")
    ) {
      return;
    }
    origWarn.apply(console, args);
  };
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
