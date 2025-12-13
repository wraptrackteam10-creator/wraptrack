import { NavLink } from "react-router-dom";
import { CiLogout } from "react-icons/ci";

function Sidebar() {
  const linkBaseStyle = {
    padding: "12px 16px",
    borderRadius: "8px",
    textDecoration: "none",
  };

  return (
    <div className="d-flex flex-column h-100 p-3">
      {/* Main nav */}
      <ul className="nav flex-column gap-1">
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
                backgroundColor: isActive
                  ? "rgba(241,239,236,0.12)" // subtle active highlight
                  : "transparent",
              })}
              className="d-flex align-items-center gap-2"
            >
              <i className={`bi ${item.icon}`}></i>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Logout (bottom) */}
      <ul
        className="nav flex-column mt-auto pt-3"
        style={{ borderTop: "1px solid #D4C9BE" }}
      >
        <li className="nav-item">
          <NavLink
            to="/"
            className="d-flex align-items-center gap-2"
            style={{
              ...linkBaseStyle,
              color: "#F08080",
              fontWeight: "600",
            }}
          >
            <CiLogout />
            Logout
          </NavLink>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;
