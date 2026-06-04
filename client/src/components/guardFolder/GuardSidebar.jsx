import { NavLink } from "react-router-dom";
import { FiHome, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { BiBox } from "react-icons/bi";
import { BsJournalText } from "react-icons/bs";
import { MdLogout } from "react-icons/md";

function GuardSidebar({ sidebarOpen, setSidebarOpen }) {
  const navItems = [
    { label: "Home", icon: FiHome, path: "/guard/home" },
    { label: "Items", icon: BiBox, path: "/guard/item-management" },
    { label: "Logs", icon: BsJournalText, path: "/guard/history-log" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    window.location.href = "/sign-in";
  };

  return (
    <div
      style={{
        width: sidebarOpen ? "260px" : "80px",
        backgroundColor: "#123458",
        borderRight: "1px solid #1e293b",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        transition: "width 0.3s ease",
        position: "relative",
        zIndex: 1000,
      }}
    >
      {/* Collapse Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          position: "absolute",
          right: "-12px",
          top: "20px",
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          backgroundColor: "#123458",
          border: "1px solid #1e293b",
          color: "#D4C9BE",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s ease",
          zIndex: 1001,
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = "#1e293b";
          e.target.style.color = "#F1EFEC";
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = "#123458";
          e.target.style.color = "#D4C9BE";
        }}
        title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {sidebarOpen ? <FiChevronLeft size={16} /> : <FiChevronRight size={16} />}
      </button>

      {/* Logo/Brand */}
      <div
        style={{
          padding: "20px",
          borderBottom: "1px solid #1e293b",
          textAlign: sidebarOpen ? "left" : "center",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "8px",
            backgroundColor: "rgba(241, 239, 236, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#F1EFEC",
            fontWeight: "bold",
            fontSize: "20px",
            margin: sidebarOpen ? "0" : "0 auto",
          }}
        >
          G
        </div>
        {sidebarOpen && (
          <p style={{ color: "#D4C9BE", fontSize: "12px", marginTop: "8px", marginBottom: 0 }}>
            Guard Panel
          </p>
        )}
      </div>

      {/* Navigation Items */}
      <nav style={{ flex: 1, padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px",
                borderRadius: "8px",
                textDecoration: "none",
                color: isActive ? "#F1EFEC" : "#D4C9BE",
                backgroundColor: isActive ? "rgba(241, 239, 236, 0.15)" : "transparent",
                borderLeft: isActive ? "3px solid #10b981" : "3px solid transparent",
                transition: "all 0.2s ease",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: isActive ? "600" : "500",
              })}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(241, 239, 236, 0.1)";
              }}
              onMouseLeave={(e) => {
                const isActive = e.currentTarget.classList.contains("active");
                e.currentTarget.style.backgroundColor = isActive
                  ? "rgba(241, 239, 236, 0.15)"
                  : "transparent";
              }}
            >
              <Icon size={20} style={{ flexShrink: 0 }} />
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div
        style={{
          padding: "12px",
          borderTop: "1px solid #1e293b",
        }}
      >
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #1e293b",
            backgroundColor: "transparent",
            color: "#ef4444",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
            e.currentTarget.style.borderColor = "#ef4444";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.borderColor = "#1e293b";
          }}
          title={sidebarOpen ? "Logout" : "Logout"}
        >
          <MdLogout size={20} style={{ flexShrink: 0 }} />
          {sidebarOpen && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}

export default GuardSidebar;
