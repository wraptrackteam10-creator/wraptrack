import NavBarU from "./NavBarU";
import { Outlet } from "react-router-dom";
import { useRef, useState, useEffect } from "react";

function DashboardUser() {
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
  }, []);

  return (
    <div className="d-flex flex-column" style={{ height: "100vh", overflow: "hidden" }}>
      {/* Header */}
      <div ref={headerRef}>
        <NavBarU />
      </div>

      {/* Scrollable body */}
      <div
        style={{
          backgroundColor: "#f2f2f2",
          height: `calc(100vh - ${headerHeight}px)`,
          overflowY: "auto",
        }}
      >
        <Outlet />
      </div>
    </div>
  );
}

export default DashboardUser;
