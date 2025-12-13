import { NavLink } from "react-router-dom";
import { FiHome } from "react-icons/fi";
import { BiBox } from "react-icons/bi";
import { BsJournalText } from "react-icons/bs";

function GuardFooter() {
  const navItemStyle = ({ isActive }) => ({
    flex: 1,
    textAlign: "center",
    padding: "10px 0",
    color: isActive ? "#F1EFEC" : "#D4C9BE",
    fontWeight: isActive ? "600" : "normal",
    textDecoration: "none",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    fontSize: "12px",
    transition: "color 0.2s ease",
  });

  return (
    <div
      style={{
        position: "relative",
        bottom: 0,
        left: 0,
        width: "100%",
        display: "flex",
        backgroundColor: "#123458", // ✅ Footer background
        borderTop: "1px solid #D4C9BE", // ✅ Subtle divider
        zIndex: 2000,
      }}
    >
      <NavLink to="/guard/home" style={navItemStyle}>
        <FiHome size={20} />
        Home
      </NavLink>

      <NavLink to="/guard/item-management" style={navItemStyle}>
        <BiBox size={20} />
        Items
      </NavLink>

      <NavLink to="/guard/history-log" style={navItemStyle}>
        <BsJournalText size={20} />
        Logs
      </NavLink>
    </div>
  );
}

export default GuardFooter;
