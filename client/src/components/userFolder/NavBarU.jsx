import logo from "../../images/wtlogofinal.png";
import { FaBell, FaBars, FaTrash } from "react-icons/fa";
import { CiLogout } from "react-icons/ci";
import { BsJournalText } from "react-icons/bs";
import { MdOutlineInfo } from "react-icons/md";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./usercss/navbar.css";
import { fetchWithAuth } from "../../utils/fetchWithAuth";

function NavBarU() {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const navigate = useNavigate();

  const [settings, setSettings] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState("");
  const [targetNotifId, setTargetNotifId] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const menuRef = useRef(null);
  const notifRef = useRef(null);

  const COLORS = {
    header: "#123458",
    light: "#F1EFEC",
    muted: "#D4C9BE",
    text: "#030303",
    danger: "#dc3545",
    card: "#ffffff",
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE_URL}/api/settings`, {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok) setSettings(data);
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    };
    fetchSettings();
  }, [API_BASE_URL]);

  useEffect(() => {
    if (!user || !settings?.remindersEnable) return;

    const fetchNotifications = async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE_URL}/api/notifications/${user.id}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok) {
          setNotifications(data);
          setUnreadCount(data.filter((n) => !n.read).length);
        }
      } catch (error) {
        console.error("Fetch notifications failed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user, settings, API_BASE_URL]);

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

  const handleBellClick = async () => {
    if (!settings?.remindersEnable) {
      alert("⚠️ Notifications are currently disabled by admin.");
      return;
    }

    const willShow = !showNotifications;
    setShowNotifications(willShow);
    setShowMenu(false);

    if (willShow && unreadCount > 0 && user) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);

      try {
        await fetchWithAuth(`${API_BASE_URL}/api/notifications/read-all/${user.id}`, {
          method: "PUT",
        });
      } catch (error) {
        console.error("Failed to mark notifications as read:", error);
      }
    }
  };

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
      await fetchWithAuth(`${API_BASE_URL}/api/notifications/all/${user.id}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Failed to clear all notifications:", error);
    }
  };

  const deleteSingleNotification = async (id) => {
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    setConfirmOpen(false);

    try {
      await fetchWithAuth(`${API_BASE_URL}/api/notifications/${id}`, {
        method: "DELETE",
      });
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

  const handleLogout = async () => {
    try {
      await fetchWithAuth(`${API_BASE_URL}/api/logout`, {
        method: "POST",
        credentials: "include", // 🔥 VERY IMPORTANT
      });
    } catch (error) {
      console.error("Logout failed:", error);
    };

    localStorage.removeItem("user");
    navigate("/");
    setShowMenu(false);
  };

  return (
    <div>
      {/* HEADER */}
      <div
        className="d-flex justify-content-between align-items-center px-4 py-2 shadow-sm"
        style={{
          backgroundColor: COLORS.header,
          color: COLORS.light,
          borderBottom: `1px solid ${COLORS.muted}`,
        }}
      >
        {/* Logo */}
        <div className="d-flex align-items-center gap-2">
          <img src={logo} alt="logo" width="38" />
          <h4 className="fw-bold m-0" style={{ color: COLORS.light }}>
            WraPTrack
          </h4>
        </div>

        {/* Icons */}
        <div className="d-flex align-items-center gap-3 position-relative">
          {/* Bell */}
          <div ref={notifRef} className="position-relative">
            <FaBell
              size={22}
              onClick={handleBellClick}
              style={{
                color: settings?.remindersEnable ? COLORS.light : COLORS.muted,
                cursor: settings?.remindersEnable ? "pointer" : "not-allowed",
              }}
            />

            {settings?.remindersEnable && unreadCount > 0 && (
              <span
                className="position-absolute top-0 start-100 translate-middle badge rounded-pill"
                style={{
                  backgroundColor: COLORS.danger,
                  fontSize: "0.65rem",
                  transform: "translate(-40%, 40%)",
                }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}

            {showNotifications && settings?.remindersEnable && (
              <div
                className="position-absolute end-0 mt-2 rounded shadow-sm"
                style={{
                  width: "280px",
                  backgroundColor: COLORS.card,
                  border: `1px solid ${COLORS.muted}`,
                  zIndex: 2000,
                }}
              >
                <ul
                  className="list-unstyled m-0 p-2"
                  style={{ maxHeight: "260px", overflowY: "auto" }}
                >
                  {loading ? (
                    <li className="p-2 text-muted small text-center">
                      Loading...
                    </li>
                  ) : notifications.length > 0 ? (
                    notifications.map((note) => (
                      <li
                        key={note._id}
                        className="p-2 border-bottom small d-flex justify-content-between align-items-start"
                      >
                        <div style={{ color: COLORS.text }}>
                          {note.message}
                          <br />
                          <small className="text-muted">
                            {new Date(note.createdAt).toLocaleString()}
                          </small>
                        </div>
                        <button
                          className="btn btn-sm border-0"
                          style={{ color: COLORS.danger }}
                          onClick={() => confirmDeleteSingle(note._id)}
                        >
                          ✖
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className="p-2 text-muted small text-center">
                      No notifications
                    </li>
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

          {/* Menu */}
          <div ref={menuRef}>
            <FaBars
              size={22}
              onClick={() => {
                setShowMenu(!showMenu);
                setShowNotifications(false);
              }}
              style={{ color: COLORS.light, cursor: "pointer" }}
            />

            {showMenu && (
              <div
                className="position-absolute end-0 mt-2 rounded shadow-sm"
                style={{
                  width: "200px",
                  backgroundColor: COLORS.card,
                  border: `1px solid ${COLORS.muted}`,
                  zIndex: 2000,
                }}
              >
                <ul className="list-unstyled m-0 p-2">
                  <li
                    className="p-2 border-bottom small dropdown-item-clickable d-flex align-items-center gap-2"
                    style={{ color: COLORS.text, cursor: "pointer" }}
                    onClick={() => {
                      navigate("/user/history");
                      setShowMenu(false);
                    }}
                  >
                    <BsJournalText size={18} /> History Log
                  </li>
                  <li
                    className="p-2 border-bottom small dropdown-item-clickable d-flex align-items-center gap-2"
                    style={{ color: COLORS.text, cursor: "pointer" }}
                    onClick={() => {
                      navigate("/info");
                      setShowMenu(false);
                    }}
                  >
                    <MdOutlineInfo size={18} /> Help & Info
                  </li>
                  <li
                    className="p-2 small dropdown-item-clickable d-flex align-items-center gap-2 text-danger"
                    style={{ cursor: "pointer" }}
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
      </div>

      {/* Confirmation Modal */}
      {confirmOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: "rgba(0,0,0,0.4)", zIndex: 2000 }}
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
