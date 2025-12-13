import NavBarU from "./NavBarU";
import { Outlet } from 'react-router-dom';
import { useRef } from "react";

function DashboardUser() {
  const headerRef = useRef(null);

  return (
    <div className="d-flex flex-column" style={{ height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div ref={headerRef}>
        <NavBarU />
      </div>

      {/* Body (fixed height, scroll inside content if needed) */}
      <div
  style={{
    backgroundColor: "#f2f2f2",
    height: "calc(100vh - 56px)",   // viewport minus navbar
    overflowY: "auto",              // this makes OUTLET scroll
  }}
>
  <Outlet />
</div>

    </div>
  );
}

export default DashboardUser;
