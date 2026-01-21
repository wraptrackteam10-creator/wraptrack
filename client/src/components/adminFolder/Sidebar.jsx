  import { NavLink } from "react-router-dom";
  import { CiLogout } from "react-icons/ci";
  import { FaTimes } from "react-icons/fa";
  import { fetchWithAuth } from "../../utils/fetchWithAuth";

  /**
   * Sidebar component:
   * - When `mobile` prop is true it renders a close button and will call onClose when user presses it.
   * - Desktop remains the same visual and behavior.
   *
   * Props:
   * - mobile?: boolean
   * - onClose?: () => void
   */
  function Sidebar({ mobile = false, onClose }) {
    const linkBaseStyle = {
      padding: "12px 16px",
      borderRadius: "8px",
      textDecoration: "none",
      display: "flex",
      alignItems: "center",
      gap: 8,
    };

    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

    const handleLogout = async () => {
      try {
        await fetchWithAuth(`${API_BASE_URL}/api/logout`, {
          method: "POST",
          credentials: "include",
        });
      } catch (error ) {
        console.error("Logout error:", error);
      };

      localStorage.removeItem("user");
    };

    return (
      <div className="d-flex flex-column h-100" style={{ color: "#D4C9BE" }}>
        {/* Mobile header with close */}
        {mobile && (
          <div className="d-flex align-items-center justify-content-between mb-2" style={{ padding: "0 6px" }}>
            <div style={{ color: "#F1EFEC", fontWeight: 600 }}>Menu</div>
            <button
              className="btn p-1"
              onClick={onClose}
              aria-label="Close menu"
              style={{ color: "#F1EFEC", background: "transparent", border: "none" }}
            >
              <FaTimes />
            </button>
          </div>
        )}

        <div className="d-flex flex-column p-3 mt-3" style={{ gap: 8 }}>
          {/* Main nav */}
          <ul className="nav flex-column gap-1" style={{ margin: 0, padding: 0 }}>
            {[
              { to: "/admin/home", icon: "bi-house-door-fill", label: "Home" },
              { to: "/admin/user-management", icon: "bi-people-fill", label: "Users" },
              { to: "/admin/item-management", icon: "bi-box-seam", label: "Items" },
              { to: "/admin/reports", icon: "bi-graph-up", label: "Reports" },
              { to: "/admin/settings", icon: "bi-gear-fill", label: "Settings" },
            ].map((item) => (
              <li key={item.to} className="nav-item">
                <NavLink
                  to={item.to}
                  style={({ isActive }) => ({
                    ...linkBaseStyle,
                    color: isActive ? "#F1EFEC" : "#D4C9BE",
                    fontWeight: isActive ? "600" : "400",
                    backgroundColor: isActive ? "rgba(241,239,236,0.12)" : "transparent",
                  })}
                  className="d-flex align-items-center"
                  onClick={() => {
                    if (mobile && onClose) onClose();
                  }}
                >
                  <i className={`bi ${item.icon}`} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Logout (bottom) */}
          <div style={{ borderTop: "1px solid #D4C9BE", paddingTop: 12, marginTop: 12 }}>
            <NavLink
              to="/"
              className="d-flex align-items-center gap-2"
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                textDecoration: "none",
                color: "#F08080",
                fontWeight: "600",
              }}
              onClick={() => {
                // close mobile sidebar after logout
                handleLogout();
                if (mobile && onClose) onClose();
                // localStorage removal will be handled by route/component that receives '/'
              }}
            >
              <CiLogout />
              Logout
            </NavLink>
          </div>
        </div>
      </div>
    );
  }

  export default Sidebar;