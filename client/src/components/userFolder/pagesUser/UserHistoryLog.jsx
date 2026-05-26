import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { LuArrowLeft, LuHistory, LuRefreshCw } from "react-icons/lu";
import { FaBoxOpen } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import { fetchWithAuth } from "../../../utils/fetchWithAuth";

/**
 * UserHistoryLog (Production-Ready)
 *
 * - Uses the project's color system
 * - Responsive:
 *   * Desktop (md+): beautiful table view
 *   * Mobile: stacked cards with expandable images
 * - Professional typography and visual hierarchy
 */

const COLORS = {
  appBg: "#F1EFEC",
  header: "#123458",
  headerText: "#F1EFEC",
  surface: "#FFFFFF",
  border: "#D4C9BE",
  primary: "#123458",
  text: "#030303",
  muted: "#D4C9BE",
  lightText: "#666666",
  status: {
    Deposited: "#E8F4F8",
    Claimed: "#E8F5E9",
    Unclaimed: "#FFEBEE",
    "Pending Verification": "#FFF3E0",
  },
  statusBorder: {
    Deposited: "#80DEEA",
    Claimed: "#66BB6A",
    Unclaimed: "#EF5350",
    "Pending Verification": "#FFA726",
  },
  statusText: {
    Deposited: "#00838F",
    Claimed: "#2E7D32",
    Unclaimed: "#C62828",
    "Pending Verification": "#E65100",
  },
};

function UserHistoryLog() {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;

  const goBack = () => navigate(-1);

  const fetchLogs = async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/logs/${user.id}`);
      const data = await res.json();
      if (res.ok) {
        const allowed = ["Deposited", "Claimed", "Unclaimed"];
        const filteredLogs = (data || []).filter((log) => allowed.includes(log.status));
        filteredLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setLogs(filteredLogs);
      } else {
        console.error("Failed to fetch logs:", data?.message || data);
        setLogs([]);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
      setLogs([]);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = (iso) => {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return iso;
    }
  };

  const formatTime = (iso) => {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch {
      return iso;
    }
  };

  return (
    <div style={{ background: COLORS.appBg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header
        style={{
          background: COLORS.header,
          color: COLORS.headerText,
          padding: "16px 24px",
          position: "sticky",
          top: 0,
          zIndex: 1200,
          boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
        }}
      >
        <div className="container-fluid d-flex align-items-center justify-content-between">
          {/* Back Button */}
          <button
            onClick={goBack}
            className="btn btn-link p-0"
            style={{
              color: COLORS.headerText,
              textDecoration: "none",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            aria-label="Go back"
          >
            <LuArrowLeft size={24} />
          </button>

          {/* Center Title */}
          <div style={{ textAlign: "center", flex: 1, paddingX: "16px" }}>
            <h2 style={{ fontWeight: 700, margin: "0 0 4px 0", fontSize: "22px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <LuHistory size={20} />
              History Log
            </h2>
            <small style={{ color: COLORS.headerText, opacity: 0.85, fontSize: "13px" }}>
              Track your past deposited and claimed items
            </small>
          </div>

          {/* Refresh Button */}
          <button
            className="btn btn-link p-0"
            onClick={fetchLogs}
            disabled={refreshing}
            title="Refresh logs"
            aria-label="Refresh logs"
            style={{
              color: COLORS.headerText,
              textDecoration: "none",
              transition: "all 0.2s ease",
              opacity: refreshing ? 0.6 : 1,
              cursor: refreshing ? "not-allowed" : "pointer",
            }}
          >
            <LuRefreshCw size={24} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main style={{ flex: 1, overflow: "auto", padding: "24px 0" }}>
        <div className="container-fluid px-3 px-md-4">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status" style={{ color: COLORS.primary }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <div className="mt-3" style={{ color: COLORS.lightText, fontWeight: 500, fontSize: "15px" }}>
                Loading your history...
              </div>
            </div>
          ) : logs.length === 0 ? (
            <div
              className="text-center py-5 rounded-4 d-flex flex-column align-items-center justify-content-center"
              style={{
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                minHeight: "350px",
              }}
            >
              <div
                className="d-flex align-items-center justify-content-center rounded-circle mb-4"
                style={{
                  width: "80px",
                  height: "80px",
                  background: "rgba(18, 52, 88, 0.08)",
                  color: COLORS.primary,
                }}
              >
                <LuHistory size={40} />
              </div>
              <h5 style={{ color: COLORS.text, fontWeight: "700", marginBottom: "8px", fontSize: "18px" }}>
                No history yet
              </h5>
              <p className="text-muted small mb-0" style={{ maxWidth: "300px", fontSize: "14px" }}>
                Your deposited and claimed items will appear here once you start using WraPTrack.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="d-none d-md-block">
                <div
                  style={{
                    background: COLORS.surface,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  }}
                >
                  <div className="table-responsive">
                    <table className="table mb-0 align-middle" style={{ borderCollapse: "collapse" }}>
                      <thead>
                        <tr
                          style={{
                            background: "#F9FAFB",
                            borderBottom: `2px solid ${COLORS.border}`,
                            color: COLORS.text,
                          }}
                        >
                          <th style={{ padding: "14px 16px", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", width: "50px" }}>
                            #
                          </th>
                          <th style={{ padding: "14px 16px", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", width: "110px" }}>
                            Photo
                          </th>
                          <th style={{ padding: "14px 16px", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            Description
                          </th>
                          <th style={{ padding: "14px 16px", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", width: "150px" }}>
                            Owner
                          </th>
                          <th style={{ padding: "14px 16px", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", width: "120px" }}>
                            Date
                          </th>
                          <th style={{ padding: "14px 16px", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", width: "100px" }}>
                            Time
                          </th>
                          <th style={{ padding: "14px 16px", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", width: "140px", textAlign: "center" }}>
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map((log, idx) => (
                          <tr
                            key={log._id}
                            style={{
                              borderBottom: `1px solid ${COLORS.border}`,
                              color: COLORS.text,
                              transition: "background-color 0.15s ease",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F9FAFB")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                          >
                            <td style={{ padding: "14px 16px", fontSize: "14px", fontWeight: 600, color: COLORS.lightText }}>
                              {idx + 1}
                            </td>

                            <td style={{ padding: "14px 16px" }}>
                              <img
                                src={log.photoUrl || "/logo.png"}
                                alt="item-thumb"
                                style={{
                                  width: 90,
                                  height: 65,
                                  objectFit: "cover",
                                  borderRadius: "8px",
                                  border: `1px solid ${COLORS.border}`,
                                  cursor: log.photoUrl ? "pointer" : "default",
                                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                                }}
                                onClick={() => log.photoUrl && setSelectedImage(log.photoUrl)}
                                onMouseEnter={(e) => {
                                  if (log.photoUrl) {
                                    e.currentTarget.style.transform = "scale(1.05)";
                                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = "scale(1)";
                                  e.currentTarget.style.boxShadow = "none";
                                }}
                              />
                            </td>

                            <td style={{ padding: "14px 16px", fontSize: "14px", fontWeight: 500 }}>
                              <div
                                style={{
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                  wordBreak: "break-word",
                                }}
                                title={log.description || ""}
                              >
                                {log.description || "No description"}
                              </div>
                            </td>

                            <td style={{ padding: "14px 16px", fontSize: "14px", color: COLORS.lightText }}>
                              {log.userId?.firstname || user?.firstname || "—"} {log.userId?.lastname || user?.lastname || ""}
                            </td>

                            <td style={{ padding: "14px 16px", fontSize: "14px", color: COLORS.lightText }}>
                              {formatDate(log.createdAt)}
                            </td>

                            <td style={{ padding: "14px 16px", fontSize: "14px", color: COLORS.lightText }}>
                              {formatTime(log.createdAt)}
                            </td>

                            <td style={{ padding: "14px 16px", textAlign: "center" }}>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  padding: "6px 12px",
                                  borderRadius: "6px",
                                  background: COLORS.status[log.status] || COLORS.status.Deposited,
                                  border: `1.5px solid ${COLORS.statusBorder[log.status] || COLORS.statusBorder.Deposited}`,
                                  color: COLORS.statusText[log.status] || COLORS.statusText.Deposited,
                                  fontWeight: 600,
                                  fontSize: "12px",
                                  minWidth: "100px",
                                }}
                              >
                                {log.status === "Pending Verification" ? "⏳ Pending" : log.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Mobile cards */}
              <div className="d-block d-md-none px-2">
                <div className="d-flex flex-column gap-3">
                  {logs.map((log) => {
                    const isExpanded = expandedLogId === log._id;

                    return (
                      <div
                        key={log._id}
                        style={{
                          background: COLORS.surface,
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: "10px",
                          overflow: "hidden",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {/* Card Header (always visible) */}
                        <div
                          style={{
                            padding: "14px 14px",
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            gap: "10px",
                            cursor: "pointer",
                            transition: "background-color 0.2s ease",
                          }}
                          onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F9FAFB")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          {/* Left content */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h6
                              style={{
                                fontWeight: 600,
                                color: COLORS.text,
                                margin: "0 0 8px 0",
                                fontSize: "14px",
                                display: "-webkit-box",
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                              title={log.description}
                            >
                              {log.description || "No description"}
                            </h6>

                            {/* Meta info */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: COLORS.lightText }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <i className="bi bi-person" style={{ fontSize: "12px" }} />
                                <span>
                                  {log.userId?.firstname || user?.firstname} {log.userId?.lastname || user?.lastname}
                                </span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <i className="bi bi-calendar" style={{ fontSize: "12px" }} />
                                <span>
                                  {formatDate(log.createdAt)} • {formatTime(log.createdAt)}
                                </span>
                              </div>
                            </div>

                            {/* Status badge */}
                            <div style={{ marginTop: "8px" }}>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  padding: "4px 8px",
                                  borderRadius: "5px",
                                  background: COLORS.status[log.status] || COLORS.status.Deposited,
                                  border: `1.5px solid ${COLORS.statusBorder[log.status] || COLORS.statusBorder.Deposited}`,
                                  color: COLORS.statusText[log.status] || COLORS.statusText.Deposited,
                                  fontWeight: 600,
                                  fontSize: "11px",
                                }}
                              >
                                {log.status === "Pending Verification" ? "⏳ Pending" : log.status}
                              </span>
                            </div>
                          </div>

                          {/* Chevron */}
                          <div style={{ display: "flex", alignItems: "center", color: COLORS.muted }}>
                            <i className={`bi bi-chevron-${isExpanded ? "up" : "down"}`} style={{ fontSize: "18px" }} />
                          </div>
                        </div>

                        {/* Expanded image section */}
                        {isExpanded && (
                          <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: "12px 14px", background: "#FAFAFA" }}>
                            <div
                              style={{
                                width: "100%",
                                height: 200,
                                overflow: "hidden",
                                borderRadius: "8px",
                                border: `1px solid ${COLORS.border}`,
                                cursor: log.photoUrl ? "zoom-in" : "default",
                                background: "#f8f9fa",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (log.photoUrl) setSelectedImage(log.photoUrl);
                              }}
                            >
                              {log.photoUrl ? (
                                <img
                                  src={log.photoUrl}
                                  alt="item"
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              ) : (
                                <div style={{ color: "#adb5bd", fontSize: "32px" }}>
                                  <FaBoxOpen />
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
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
            zIndex: 3000,
            background: "rgba(0,0,0,0.85)",
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
              borderRadius: "12px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              background: COLORS.surface,
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        table tbody tr:hover {
          background-color: #F9FAFB !important;
        }

        @media (max-width: 576px) {
          main {
            padding: 16px 0;
          }
        }
      `}</style>
    </div>
  );
}

export default UserHistoryLog;
