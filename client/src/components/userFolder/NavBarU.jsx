import logo from "../../images/wtlogo-removebg.png";
import { FaBell, FaBars, FaTrash } from "react-icons/fa";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./usercss/navbar.css";

function NavBarU() {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const navigate = useNavigate();

  const [settings, setSettings] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Confirmation modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState(""); // "single" or "all"
  const [targetNotifId, setTargetNotifId] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const menuRef = useRef(null);
  const notifRef = useRef(null);

  // Load system settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/settings`);
        const data = await res.json();
        if (res.ok) setSettings(data);
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    };
    fetchSettings();
  }, [API_BASE_URL]);

  // Load notifications
  useEffect(() => {
    if (!user || !settings?.remindersEnable) return;

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/notifications/${user.id}`);
        const data = await res.json();
        if (res.ok) {
          setNotifications(data);
          setUnreadCount(data.filter((n) => !n.read).length);
        } else {
          console.error("Error fetching notifications:", data.error);
        }
      } catch (error) {
        console.error("Fetch notifications failed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user, settings, API_BASE_URL]);

  // Close dropdowns when clicking outside
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

  // Handle bell click (mark all as read)
  const handleBellClick = async () => {
    if (!settings?.remindersEnable) {
      alert("⚠️ Notifications are currently disabled by admin.");
      return;
    }

    const willShow = !showNotifications;
    setShowNotifications(willShow);
    setShowMenu(false);

    // Mark all as read immediately in UI
    if (willShow && unreadCount > 0 && user) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);

      try {
        await fetch(`${API_BASE_URL}/api/notifications/read-all/${user.id}`, {
          method: "PUT",
        });
      } catch (error) {
        console.error("Failed to mark notifications as read:", error);
      }
    }
  };

  // Confirmation modal actions
  const confirmDeleteSingle = (id) => {
    setConfirmType("single");
    setTargetNotifId(id);
    setConfirmOpen(true);
  };

  const confirmClearAll = () => {
    setConfirmType("all");
    setConfirmOpen(true);
  };

  const handleClearAll = async () => {
    setNotifications([]);
    setUnreadCount(0);
    setConfirmOpen(false);

    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/all/${user.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      console.log("Clear all response:", data);
    } catch (error) {
      console.error("Failed to clear all notifications:", error);
    }
  };

  const deleteSingleNotification = async (id) => {
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    setConfirmOpen(false);

    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      console.log("Deleted single notification:", data);
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleConfirm = () => {
    if (confirmType === "single" && targetNotifId) {
      deleteSingleNotification(targetNotifId);
    } else if (confirmType === "all") {
      handleClearAll();
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center p-3 bg-black bg-gradient shadow-sm">
        {/* Logo + Title */}
        <div className="d-flex align-items-center gap-2">
          <img src={logo} alt="logo" width="40" />
          <h3 className="fw-bold text-light m-0">WraPTrack</h3>
        </div>

        {/* Icons Section */}
        <div className="d-flex align-items-center gap-3 position-relative">
          {/* 🔔 Bell Icon */}
          <div ref={notifRef} className="position-relative">
            <FaBell
              size={24}
              className={`text-light ${!settings?.remindersEnable ? "text-muted" : ""}`}
              onClick={handleBellClick}
              style={{ cursor: settings?.remindersEnable ? "pointer" : "not-allowed" }}
            />
            {settings?.remindersEnable && unreadCount > 0 && (
              <span
                className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                style={{ fontSize: "0.65rem", transform: "translate(-40%, 40%)" }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}

            {/* Notifications Dropdown */}
            {showNotifications && settings?.remindersEnable && (
              <div
                className="position-absolute end-0 mt-2 bg-white border rounded shadow-sm"
                style={{ width: "280px", zIndex: 1000 }}
              >
                <ul
                  className="list-unstyled m-0 p-2"
                  style={{ maxHeight: "260px", overflowY: "auto" }}
                >
                  {loading ? (
                    <li className="p-2 text-muted small text-center">Loading...</li>
                  ) : notifications.length > 0 ? (
                    notifications.map((note) => (
                      <li
                        key={note._id}
                        className="p-2 border-bottom small d-flex justify-content-between align-items-start"
                      >
                        <div>
                          {note.message}
                          <br />
                          <small className="text-muted">
                            {new Date(note.createdAt).toLocaleString([], {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </small>
                        </div>
                        <button
                          className="btn btn-sm btn-light text-danger border-0"
                          onClick={() => confirmDeleteSingle(note._id)}
                        >
                          ✖
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className="p-2 text-muted small text-center">No notifications</li>
                  )}
                </ul>

                {notifications.length > 0 && (
                  <div className="text-center border-top p-2">
                    <button
                      className="btn btn-danger btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
                      onClick={confirmClearAll}
                    >
                      <FaTrash size={12} /> Clear All Notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ☰ Menu */}
          <div ref={menuRef}>
            <FaBars
              size={24}
              className="text-light"
              onClick={() => {
                setShowMenu(!showMenu);
                setShowNotifications(false);
              }}
              style={{ cursor: "pointer" }}
            />
            {showMenu && (
              <div
                className="position-absolute end-0 mt-2 bg-white border rounded shadow-sm"
                style={{ width: "200px", zIndex: 1000 }}
              >
                <ul className="list-unstyled m-0 p-2">
                  <li
                    className="p-2 border-bottom small dropdown-item-clickable"
                    onClick={() => {
                      navigate("/user/history");
                      setShowMenu(false);
                    }}
                  >
                    📜 History Log
                  </li>
                  <li
                    className="p-2 small text-danger dropdown-item-clickable"
                    onClick={() => {
                      localStorage.removeItem("user");
                      navigate("/");
                      setShowMenu(false);
                    }}
                  >
                    🚪 Logout
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50"
          style={{ zIndex: 2000 }}
        >
          <div className="bg-white p-4 rounded shadow" style={{ width: "300px" }}>
            <h6 className="fw-bold mb-2">Confirm Delete</h6>
            <p className="small text-muted mb-3">
              {confirmType === "single"
                ? "Are you sure you want to delete this notification?"
                : "Delete ALL notifications? This action cannot be undone."}
            </p>

            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleConfirm}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NavBarU;
