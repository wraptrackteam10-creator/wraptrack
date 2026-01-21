import logo from "../../images/wtlogofinal.png";
import { FaBars } from "react-icons/fa";
import { CiLogout } from "react-icons/ci";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../../utils/fetchWithAuth";
/**
 * Navbar:
 * - shows a hamburger on small screens which calls onToggleSidebar (passed as prop).
 * - keeps the desktop menu button hidden (we use persistent sidebar there).
 *
 * Props:
 * - onToggleSidebar: () => void
 */
function Navbar({ onToggleSidebar }) {
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetchWithAuth(`${API_BASE_URL}/api/logout`, {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      console.error("Logout error", error);
    };

    localStorage.removeItem("user");
    navigate("/");
    setShowMenu(false);
  };

  return (
    <div
      className="d-flex align-items-center justify-content-between px-3 py-2"
      style={{ backgroundColor: "#123458" }}
    >
      <div className="d-flex align-items-center gap-2">
        {/* Hamburger: visible only on mobile (below md) */}
        <button
          className="btn p-1 d-md-none"
          onClick={onToggleSidebar}
          aria-label="Toggle menu"
          style={{ background: "transparent", border: "none", color: "#F1EFEC" }}
        >
          <FaBars size={20} />
        </button>

        <img src={logo} alt="WraPTrack Logo" style={{ width: 36, height: 36 }} />
        <h4 className="m-0 fw-semibold d-sm-block" style={{ color: "#F1EFEC" }}>
          WraPTrack
        </h4>
      </div>

      {/* Page title: hide on very small screens to save space */}
      <h5 className="m-0 fw-semibold d-none d-md-block" style={{ color: "#F1EFEC" }}>
        Admin Dashboard
      </h5>

      {/* Menu */}
      <div ref={menuRef} className="position-relative">
        <div
          role="button"
          onClick={() => setShowMenu((s) => !s)}
          style={{ color: "#F1EFEC", cursor: "pointer" }}
          aria-haspopup="true"
          aria-expanded={showMenu}
        >
          {/* Simple three-dot / menu indicator */}
          <svg width="20" height="6" viewBox="0 0 20 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="3" cy="3" r="3" fill="#F1EFEC" />
            <circle cx="10" cy="3" r="3" fill="#F1EFEC" />
            <circle cx="17" cy="3" r="3" fill="#F1EFEC" />
          </svg>
        </div>

        {showMenu && (
          <div
            className="position-absolute end-0 mt-2 rounded shadow-sm"
            style={{
              width: 180,
              backgroundColor: "#FFFFFF",
              border: "1px solid #D4C9BE",
              zIndex: 1000,
            }}
          >
            <ul className="list-unstyled m-0 p-2">
              <li
                className="p-2 small d-flex align-items-center gap-2"
                style={{ color: "#7a1f1f", cursor: "pointer" }}
                onClick={() => {
                  handleLogout();
                }}
              >
                <CiLogout size={18} /> Logout
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default Navbar;