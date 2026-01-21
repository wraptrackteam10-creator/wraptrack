import React, { useEffect, useState, useRef } from "react";
import { NavLink } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../usercss/imageStyle.css";
import { fetchWithAuth } from "../../../utils/fetchWithAuth";

/**
 * UserHomePage (responsive)
 *
 * - Desktop (md+): table layout (no Details button). Columns: #, Photo, Description, Owner, Date, Time, Status, Penalty, Actions(Archive).
 * - Mobile (below md): stacked cards optimized for touch with expandable details.
 *
 * Color system follows the provided design rules.
 */

const COLORS = {
  appBg: "#F1EFEC",
  header: "#123458",
  headerText: "#F1EFEC",
  innerHeader: "#FFFFFF",
  surface: "#FFFFFF",
  border: "#D4C9BE",
  primary: "#123458",
  delete: "#F08080",
  editOutline: "#123458",
  text: "#030303",
  muted: "#D4C9BE",
  status: {
    Deposited: "#D4C9BE",
    Claimed: "#90EE90",
    Unclaimed: "#F08080",
    "Pending Verification": "#FFD700",
  },
};

function UserHomePage() {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "";
  const [items, setItems] = useState([]);
  const [expandedItemId, setExpandedItemId] = useState(null); // mobile-only expansion
  const [selectedImage, setSelectedImage] = useState(null);
  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;

  const cardsRef = useRef({});

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE_URL}/api/items`, {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok) {
          const userItems = (data || []).filter(
            (item) =>
              item.userId?._id === user?.id &&
              item.action !== "Archive" &&
              item.status !== "Claimed"
          );
          setItems(userItems);
        } else {
          console.error("Failed to fetch items:", data?.error);
        }
      } catch (error) {
        console.error("Error fetching items:", error);
      }
    };
    if (user) fetchItems();
  }, [user, API_BASE_URL]);

  // Penalty time helper
  const getPenaltyTime = (status, createdAt, penalty) => {
    if (status === "Unclaimed" || status === "Penalized") {
      return `⚠️ Item already penalized. ${penalty ?? "0"}`;
    } else if (status === "Pending Verification") {
      return "Waiting for Verification";
    }

    const now = new Date();
    const penaltyTime = new Date();
    penaltyTime.setHours(22, 0, 0, 0);

    // If item created after today's penalty time assume next day
    if (createdAt) {
      const created = new Date(createdAt);
      if (created > penaltyTime) penaltyTime.setDate(penaltyTime.getDate() + 1);
    }

    const diff = penaltyTime - now;
    if (diff <= 0) return `⚠️ Item already penalized. ${penalty ?? ""}`;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    return `${hours}h ${minutes}m remaining before penalty`;
  };

  const handleViewDetails = (id) => {
    // mobile toggle only; desktop has no Details button
    setExpandedItemId((prev) => (prev === id ? null : id));
  };

  // Close expanded card when clicking outside (mobile)
  useEffect(() => {
    const onDocClick = (e) => {
      if (!expandedItemId) return;
      const el = cardsRef.current[expandedItemId];
      if (el && !el.contains(e.target)) setExpandedItemId(null);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [expandedItemId]);

  const archiveItem = async (id) => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/items/${id}/action`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "Archive" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to archive item");
        return;
      }
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to archive item");
    }
  };

  const formatDate = (iso) => {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleDateString();
    } catch {
      return iso;
    }
  };

  const formatTime = (iso) => {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return iso;
    }
  };

  return (
    <div style={{ background: COLORS.appBg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header (sticky) */}
      <header
        style={{
          background: COLORS.header,
          color: COLORS.headerText,
          padding: "14px 18px",
          position: "sticky",
          top: 0,
          zIndex: 20,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <div className="container d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <div>
              <div style={{ fontWeight: 700 }}>{/* title */}My Items Dashboard</div>
              <small style={{ color: COLORS.headerText, opacity: 0.9 }}>
                Welcome back, {user?.firstname || "User"} <span className="wave-hand">👋</span>
              </small>
            </div>
          </div>

          <div className="d-flex gap-2">
            <NavLink to="/user/deposit">
              <button
                className="btn btn-sm"
                style={{
                  background: "transparent",
                  color: COLORS.headerText,
                  border: `1px solid rgba(241,239,236,0.15)`,
                }}
                aria-label="Scan item"
              >
                <i className="bi bi-camera me-1" /> Scan
              </button>
            </NavLink>

            <NavLink to="/user/claim">
              <button
                className="btn btn-sm"
                style={{
                  background: COLORS.primary,
                  color: COLORS.headerText,
                  borderRadius: 20,
                  padding: "6px 12px",
                }}
                aria-label="Claim item"
              >
                <i className="bi bi-box-arrow-up me-1" /> Claim
              </button>
            </NavLink>
          </div>
        </div>
      </header>

      {/* Content area */}
      <main style={{ flex: 1, overflow: "auto", padding: "20px 0" }}>
        <div className="container">
          {/* Desktop table view */}
          <div className="d-none d-md-block">
            <div
              className="card"
              style={{
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table mb-0 align-middle">
                    <thead style={{ background: COLORS.innerHeader, borderBottom: `1px solid ${COLORS.border}` }}>
                      <tr style={{ color: COLORS.text }}>
                        <th style={{ width: 48, borderTop: `1px solid ${COLORS.border}` }}>#</th>
                        <th style={{ width: 100 }}>Photo</th>
                        <th>Description</th>
                        <th style={{ width: 160 }}>Owner</th>
                        <th style={{ width: 120 }}>Date</th>
                        <th style={{ width: 90 }}>Time</th>
                        <th className="text-center" style={{ width: 180 }}>Status</th>
                        <th className="text-center" style={{ width: 150 }}>Penalty</th>
                        <th style={{ width: 80 }} className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-center text-muted py-5" style={{ color: COLORS.muted }}>
                            No items found. Start by scanning or claiming items.
                          </td>
                        </tr>
                      ) : (
                        items.map((item, idx) => (
                          <tr key={item._id} style={{ color: COLORS.text }}>
                            <td>{idx + 1}</td>

                            <td>
                              <img
                                src={item.photoUrl || "/logo.png"}
                                alt="thumb"
                                style={{ width: 86, height: 62, objectFit: "cover", borderRadius: 6, border: `1px solid ${COLORS.border}`, cursor: "pointer" }}
                                onClick={() => setSelectedImage(item.photoUrl || "/logo.png")}
                              />
                            </td>

                            <td style={{ maxWidth: 480 }}>
                              <div style={{ fontWeight: 600, color: COLORS.text }} title={item.description || ""}>
                                {item.description || "No description"}
                              </div>
                            </td>

                            <td style={{ color: COLORS.text }}>
                              {item.userId?.firstname || user?.firstname || "—"} {item.userId?.lastname || user?.lastname || ""}
                            </td>

                            <td style={{ color: COLORS.text }}>{formatDate(item.createdAt)}</td>

                            <td style={{ color: COLORS.text }}>{formatTime(item.createdAt)}</td>

                            <td className="text-center">
                              <span
                                className="px-3 py-1 rounded-pill text-center"
                                style={{
                                  background: COLORS.status[item.status] || COLORS.status.Deposited,
                                  color: item.status === "Pending Verification" ? "#000" : "#030303",
                                  display: "inline-block",
                                  fontWeight: 600,
                                }}
                              >
                                {item.status === "Pending Verification" ? "Pending" : item.status}
                              </span>
                            </td>

                            <td className="text-center">
                              <small style={{ color: "red", }}>{getPenaltyTime(item.status, item.createdAt, item.penalty)}</small>
                            </td>

                            <td className="text-center">
                              <div className="d-flex justify-content-end gap-2">
                                {/* No Details button on desktop per requirement */}
                                <button
                                  className="btn btn-sm"
                                  style={{
                                    border: `1px solid ${COLORS.delete}`,
                                    color: COLORS.delete,
                                    background: "transparent",
                                  }}
                                  onClick={async () => {
                                    if (window.confirm("Archive this item?")) {
                                      await archiveItem(item._id);
                                    }
                                  }}
                                  aria-label="Archive item"
                                >
                                  <i className="bi bi-archive" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile stacked cards */}
          <div className="d-block d-md-none">
            {items.length === 0 ? (
              <div className="text-center text-muted py-5" style={{ color: COLORS.muted }}>
                <i className="bi bi-box-seam display-4 d-block mb-3" />
                <h6 style={{ color: COLORS.text }}>No items found yet</h6>
                <p className="small">Start by scanning or claiming your items above.</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {items.map((item) => {
                  const isExpanded = expandedItemId === item._id;
                  return (
                    <div
                      key={item._id}
                      ref={(el) => (cardsRef.current[item._id] = el)}
                      className="card"
                      style={{
                        background: COLORS.surface,
                        border: `1px solid ${COLORS.border}`,
                        overflow: "hidden",
                      }}
                    >
                      <div className="d-flex">
                        <div
                          style={{
                            width: 110,
                            height: 110,
                            overflow: "hidden",
                            cursor: "pointer",
                            flex: "0 0 110px",
                          }}
                          onClick={() => setSelectedImage(item.photoUrl || "/logo.png")}
                        >
                          <img
                            src={item.photoUrl || "/logo.png"}
                            alt="item"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        </div>

                        <div className="p-2 flex-grow-1">
                          <div className="d-flex align-items-start">
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, color: COLORS.text, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }} title={item.description}>
                                {item.description || "No description"}
                              </div>
                              <div style={{ color: COLORS.muted, fontSize: 12, marginTop: 6 }}>{formatDate(item.createdAt)} • {formatTime(item.createdAt)}</div>
                            </div>

                            <div className="text-end ms-2">
                              <div>
                                <span
                                  style={{
                                    display: "inline-block",
                                    padding: "6px 10px",
                                    borderRadius: 999,
                                    background: COLORS.status[item.status] || COLORS.status.Deposited,
                                    color: item.status === "Pending Verification" ? "#000" : "#030303",
                                    fontWeight: 600,
                                    fontSize: 12,
                                  }}
                                >
                                  {item.status}
                                </span>
                              </div>

                              <div className="d-flex gap-1 mt-2 justify-content-end">
                                <button
                                  className="btn btn-sm"
                                  style={{
                                    border: `1px solid ${COLORS.editOutline}`,
                                    color: COLORS.editOutline,
                                    background: "transparent",
                                    padding: "6px 8px",
                                  }}
                                  onClick={() => handleViewDetails(item._id)}
                                >
                                  {isExpanded ? "Hide" : "Details"}
                                </button>

                                <button
                                  className="btn btn-sm"
                                  style={{
                                    border: `1px solid ${COLORS.delete}`,
                                    color: COLORS.delete,
                                    background: "transparent",
                                    padding: "6px 8px",
                                  }}
                                  onClick={async () => {
                                    if (window.confirm("Archive this item?")) {
                                      await archiveItem(item._id);
                                    }
                                  }}
                                  aria-label="Archive item"
                                >
                                  <i className="bi bi-archive" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-2" style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 8 }}>
                              <p style={{ margin: 0, color: COLORS.text, fontSize: 13 }}><strong>Owner:</strong> {item.userId?.firstname || user?.firstname} {item.userId?.lastname || user?.lastname}</p>
                              <p style={{ margin: "6px 0 0 0", color: COLORS.text, fontSize: 13 }}><i className="bi bi-clock me-1" /> {getPenaltyTime(item.status, item.createdAt, item.penalty)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Fullscreen image viewer */}
      {selectedImage && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1050,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "zoom-out",
          }}
        >
          <img
            src={selectedImage}
            alt="Full view"
            style={{
              maxWidth: "92%",
              maxHeight: "92%",
              objectFit: "contain",
              borderRadius: 10,
              boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
            }}
          />
        </div>
      )}

      {/* Footer (app shell) */}
      <footer style={{ background: COLORS.header, color: COLORS.headerText, borderTop: `1px solid ${COLORS.border}`, padding: "10px 0" }}>
        <div className="container d-flex justify-content-between align-items-center">
          <small style={{ fontWeight: 700 }}>WraPTrack</small>
          <div style={{ color: COLORS.headerText, opacity: 0.9 }}>
            © 2025 — {user?.firstname ? `${user.firstname}` : "WraPTrack Team"}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default UserHomePage;