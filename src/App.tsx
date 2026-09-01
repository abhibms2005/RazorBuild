import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Home from "./pages/Home";
import HowItWorks from "./pages/HowItWorks";
import Results from "./pages/Results";
import Dashboard from "./pages/Dashboard";
import { DashboardErrorBoundary } from "./components/dashboard/DashboardErrorBoundary";

/**
 * Root app with React Router.
 * Home gets its own full-screen cinematic layout.
 * Inner pages share the Layout (nav + footer + Outlet).
 */
export default function App() {
  return (
    <Routes>
      {/* Home — no shared layout (cinematic, no footer) */}
      <Route path="/" element={<Home />} />

      {/* Inner pages — shared nav + footer */}
      <Route element={<Layout />}>
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/results" element={<Results />} />
        <Route path="/dashboard" element={<DashboardErrorBoundary><Dashboard /></DashboardErrorBoundary>} />
      </Route>
    </Routes>
  );
}
