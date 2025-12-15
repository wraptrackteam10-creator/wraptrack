import logo from "../../images/wtlogo2.png";
import { FaBell, FaBars } from "react-icons/fa";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CiLogout } from "react-icons/ci";

function GuardNavBar() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const menuRef = useRef(null);
  const notifRef = useRef(null);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const user = JSON.parse(localStorage.getItem("user"));

  /* ================= FETCH NOTIFICATIONS ================= */
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/notifications/${user.id}`);
        const data = await res.json();
        if (res.ok) setNotifications(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [user, API_BASE_URL]);

  /* ================= CLICK OUTSIDE ================= */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        notifRef.current &&
        !notifRef.current.contains(event.target)
      ) {
        setShowMenu(false);
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div>
      {/* ================= HEADER ================= */}
      <div
        className="d-flex justify-content-between align-items-center px-3 py-2 shadow-sm"
        style={{ backgroundColor: "#123458", position: "relative"}}
      >
        {/* Logo + Title */}
        <div className="d-flex align-items-center gap-2">
          <img src={logo} alt="logo" width="36" />
          <h5 className="fw-bold m-0" style={{ color: "#F1EFEC" }}>
            WraPTrack
          </h5>
        </div>

        {/* Icons */}
        <div className="d-flex align-items-center gap-3 position-relative">
          {/* 🔔 Notifications */}
          <div ref={notifRef}>
            <FaBell
              size={20}
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowMenu(false);
              }}
              style={{ color: "#F1EFEC", cursor: "pointer" }}
            />

            {showNotifications && (
              <div
                className="position-fixed"
                style={{
                  top: "60px", // adjust if your navbar height changes
                  right: "20px",
                  width: "260px",
                  background: "#FFFFFF",
                  border: "1px solid #D4C9BE",
                  borderRadius: "5px",
                  zIndex: 5000,
                  boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                }}
              >
                <ul className="list-unstyled m-0 p-2">
                  {loading ? (
                    <li className="p-2 text-muted small text-center">Loading...</li>
                  ) : notifications.length > 0 ? (
                    notifications.map((note, index) => (
                      <li
                        key={index}
                        className="p-2 small"
                        style={{
                          borderBottom: "1px solid #D4C9BE",
                          color: "#030303",
                        }}
                      >
                        {note.message || "New update"}
                        <br />
                        <small style={{ color: "#D4C9BE" }}>
                          {new Date(note.createdAt).toLocaleString([], {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </small>
                      </li>
                    ))
                  ) : (
                    <li className="p-2 text-muted small text-center">
                      No new notifications
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* ☰ Menu */}
          <div ref={menuRef}>
            <FaBars
              size={20}
              onClick={() => {
                setShowMenu(!showMenu);
                setShowNotifications(false);
              }}
              style={{ color: "#F1EFEC", cursor: "pointer" }}
            />

            {showMenu && (
              <div
                className="position-fixed"
                style={{
                  top: "40px", // adjust to match navbar height
                  right: "20px",
                  width: "200px",
                  background: "#FFFFFF",
                  border: "1px solid #D4C9BE",
                  borderRadius: "5px",
                  zIndex: 6000,
                  boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                }}
              >
                <ul className="list-unstyled m-0 p-2">
                  <li
                    className="p-2 small d-flex align-items-center gap-2"
                    style={{ color: "#7a1f1f", cursor: "pointer" }}
                    onClick={() => {
                      localStorage.removeItem("user");
                      navigate("/sign-in");
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
      </div>
    </div>
  );
}

export default GuardNavBar;
