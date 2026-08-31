import { Outlet } from "react-router-dom";
import { Nav } from "./Nav";
import { Footer } from "./Footer";

/**
 * Shared layout for all non-home pages.
 * Nav is always visible; footer appears on inner pages only.
 * Home page has its own full-screen layout without this wrapper.
 */
export function Layout() {

  return (
    <div className="min-h-screen text-chalk">
      {/* Skip link */}
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      {/* Persistent nav */}
      <Nav />

      {/* Page content */}
      <main id="main-content" className="pt-14">
        <Outlet />
      </main>

      {/* Footer on inner pages */}
      <Footer />
    </div>
  );
}
