import logo from "../../images/wtlogo2.png";
import { FaBars } from "react-icons/fa";
import { CiLogout } from "react-icons/ci";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

function Navbar() {
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className="d-flex align-items-center justify-content-between px-4 py-2"
      style={{ backgroundColor: "#123458" }}
    >
      {/* Logo + App name */}
      <div className="d-flex align-items-center gap-2">
        <img
          src={logo}
          alt="WraPTrack Logo"
          style={{ width: 40, height: 40 }}
        />
        <h4 className="m-0 fw-semibold" style={{ color: "#F1EFEC" }}>
          WraPTrack
        </h4>
      </div>

      {/* Page title */}
      <h5 className="m-0 fw-semibold" style={{ color: "#F1EFEC" }}>
        Admin Dashboard
      </h5>

      {/* Menu */}
      <div ref={menuRef} className="position-relative">
        <FaBars
          size={22}
          style={{ color: "#F1EFEC", cursor: "pointer" }}
          onClick={() => setShowMenu(prev => !prev)}
        />

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
                  localStorage.removeItem("user");
                  navigate("/");
                  setShowMenu(false);
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
