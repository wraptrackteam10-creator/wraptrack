import GuardNavBar from "./GuardNavBar";
import GuardFooter from "./GuardFooter";
import GuardSidebar from "./GuardSidebar";
import { Outlet } from "react-router-dom";
import { useState } from "react";

function DashboardGuard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", backgroundColor: "#F1EFEC" }}>
      {/* Header - Full width */}
      <div style={{ flexShrink: 0 }}>
        <GuardNavBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      </div>

      {/* Main Content Area */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, width: "100%" }}>
        {/* Desktop Sidebar - Hidden on mobile */}
        <div className="d-none d-lg-flex" style={{ flexShrink: 0 }}>
          <GuardSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        </div>

        {/* Scrollable Content */}
        <div
          style={{
            flexGrow: 1,
            overflowY: "auto",
            overflowX: "hidden",
            width: "100%",
          }}
        >
          <Outlet />
        </div>
      </div>

      {/* Mobile Footer - Hidden on desktop */}
      <div className="d-lg-none" style={{ flexShrink: 0 }}>
        <GuardFooter />
      </div>
    </div>
  );
}

export default DashboardGuard;
  