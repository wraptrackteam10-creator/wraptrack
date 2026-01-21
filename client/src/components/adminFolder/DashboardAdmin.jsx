import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";
import { useState } from "react";

/**
 * Responsive dashboard layout:
 * - Desktop (md and up): persistent left sidebar (220px) and content on the right.
 * - Mobile (below md): sidebar is hidden; a hamburger in the navbar toggles a slide-in panel.
 *
 * The mobile sidebar is rendered as a fixed overlay with a backdrop to preserve accessibility and simple UX.
 */
function DashboardAdmin() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);
  const toggleSidebar = () => setSidebarOpen((s) => !s);

  return (
    <div
      className="container-fluid p-0 d-flex flex-column"
      style={{ backgroundColor: "#F1EFEC", height: "100vh" }}
    >
      {/* Header */}
      <header>
        <Navbar onToggleSidebar={toggleSidebar} />
      </header>

      {/* Main layout */}
      <div className="d-flex flex-grow-1" style={{ overflow: "hidden" }}>
        {/* Desktop Sidebar (visible md+) */}
        <aside
          className="d-none d-md-block"
          style={{
            flexShrink: 0,
            width: "220px",
            backgroundColor: "#123458",
          }}
        >
          <Sidebar />
        </aside>

        {/* Mobile Sidebar (overlay) */}
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <div
              onClick={closeSidebar}
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.4)",
                zIndex: 1040,
              }}
              aria-hidden="true"
            />
            {/* Panel */}
            <div
              role="dialog"
              aria-modal="true"
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                height: "100%",
                width: "43%",
                maxWidth: 320,
                backgroundColor: "#123458",
                zIndex: 4050,
                boxShadow: "2px 0 12px rgba(0,0,0,0.2)",
                padding: 12,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Sidebar mobile onClose={closeSidebar} />
            </div>
          </>
        )}

        {/* Content */}
        <main
          className="flex-grow-1 p-3 d-flex flex-column"
          style={{ minHeight: 0, overflow: "hidden" }}
        >
          <div
            className="rounded p-1 flex-grow-1"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #D4C9BE",
              display: "flex",
              flexDirection: "column",
              overflow: "auto", // <-- VERY IMPORTANT
            }}
          >
            <Outlet />
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer
        className="text-center py-2"
        style={{
          position: "relative",
          backgroundColor: "#123458",
          color: "#F1EFEC",
          borderTop: "1px solid #D4C9BE",
        }}
      >
        © 2025 WraPTrack System
      </footer>
    </div>
  );
}

export default DashboardAdmin;