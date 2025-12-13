import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";

function DashboardAdmin() {
  return (
    <div
      className="container-fluid p-0 d-flex flex-column"
      style={{ backgroundColor: "#F1EFEC", height: "100vh"}}
    >
      {/* Header */}
      <header>
        <Navbar />
      </header>

      {/* Main layout */}
      <div className="d-flex flex-grow-1" style={{ overflow: "hidden" }}>
        {/* Sidebar */}
        <aside
          style={{
            flexShrink: 0,
            width: "220px",
            backgroundColor: "#123458",
          }}
        >
          <Sidebar />
        </aside>

        {/* Content */}
        <main
          className="flex-grow-1 p-3 d-flex flex-column"
          style={{ minHeight: 0, overflow: "hidden",}}
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
