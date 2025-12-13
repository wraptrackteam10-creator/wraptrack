import GuardNavBar from "./GuardNavBar";
import GuardFooter from "./GuardFooter";
import { Outlet } from "react-router-dom";

function DashboardGuard() {
  return (
    <div style={{display: "flex", flexDirection: "column", height: "100dvh", backgroundColor: "#F1EFEC" }}>
      {/* Header */}
      <div>
        <GuardNavBar />
      </div>

      {/* Scrollable section */}
      <div 
        style={{ 
          flexGrow: 1,
          overflowY: "hidden",
        }}
      >
        <Outlet />
      </div>

      {/* Footer */}
      <div>
        <GuardFooter />
      </div>
    </div>
  );
}

export default DashboardGuard;

