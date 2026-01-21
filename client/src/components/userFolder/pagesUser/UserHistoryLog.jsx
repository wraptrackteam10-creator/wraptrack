import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { LuArrowLeft, LuHistory, LuRefreshCw } from "react-icons/lu";
import { FaBoxOpen } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import { fetchWithAuth } from "../../../utils/fetchWithAuth";

/**
 * UserHistoryLog
 *
 * - Uses the project's color system:
 *   app background: #F1EFEC
 *   header/footer: #123458 (header text #F1EFEC)
 *   surface/cards: #FFFFFF
 *   borders: #D4C9BE
 * - Responsive:
 *   * Desktop (md+): table view with columns: #, Photo, Description, Owner, Date, Time, Status
 *   * Mobile: stacked cards with image, description, date/time, status and image preview
 * - Photo preview opens a fullscreen viewer (click image)
 */

const COLORS = {
  appBg: "#F1EFEC",
  header: "#123458",
  headerText: "#F1EFEC",
  surface: "#FFFFFF",
  border: "#D4C9BE",
  text: "#030303",
  muted: "#D4C9BE",
  status: {
    Deposited: "#D4C9BE",
    Claimed: "#90EE90",
    Unclaimed: "#F08080",
    "Pending Verification": "#FFD700",
  },
};

function UserHistoryLog() {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;

  const goBack = () => navigate(-1);

  // Fetch user-specific logs (only Deposited, Claimed, Unclaimed)
  const fetchLogs = async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/logs/${user.id}`);
      const data = await res.json();
      if (res.ok) {
        const allowed = ["Deposited", "Claimed", "Unclaimed"];
        const filteredLogs = (data || []).filter((log) => allowed.includes(log.status));
        // sort by date desc
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
      {/* Header */}
      <header
        style={{
          background: COLORS.header,
          color: COLORS.headerText,
          padding: "14px 0",
          position: "sticky",
          top: 0,
          zIndex: 1200,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <div className="container d-flex align-items-center justify-content-between">
          <button
            onClick={goBack}
            className="btn btn-link p-0"
            style={{ color: COLORS.headerText, textDecoration: "none" }}
            aria-label="Go back"
          >
            <LuArrowLeft size={22} />
          </button>

          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{ fontWeight: 700, color: COLORS.headerText, letterSpacing: 0.2 }}>
              <LuHistory size={18} style={{ verticalAlign: "middle", marginRight: 8 }} />
              History Log
            </div>
            <small style={{ color: COLORS.headerText, opacity: 0.95 }}>Track your past deposited and claimed items</small>
          </div>

          <button
            className="btn btn-link p-0"
            onClick={fetchLogs}
            disabled={refreshing}
            title="Refresh logs"
            aria-label="Refresh logs"
            style={{ color: COLORS.headerText }}
          >
            <LuRefreshCw size={22} className={refreshing ? "spin" : ""} />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="container py-3" style={{ flex: 1, overflow: "auto", maxHeight: "calc(100vh - 96px)" }}>
        {loading ? (
          <div className="text-center py-5" style={{ color: COLORS.muted }}>
            <div className="spinner-border" role="status" style={{ color: "#6c757d" }} />
            <div className="mt-2">Loading logs...</div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-5" style={{ color: COLORS.muted }}>
            <FaBoxOpen size={60} className="mb-3" />
            <h6 style={{ color: COLORS.text }}>No history logs yet</h6>
            <p className="small" style={{ color: COLORS.muted }}>Your past deposits and claims will appear here.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="d-none d-md-block">
              <div
                className="card"
                style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
              >
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table mb-0 align-middle">
                      <thead style={{ background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}` }}>
                        <tr>
                          <th style={{ width: 48 }}>#</th>
                          <th style={{ width: 120 }}>Photo</th>
                          <th>Description</th>
                          <th style={{ width: 160 }}>Owner</th>
                          <th style={{ width: 120 }}>Date</th>
                          <th style={{ width: 90 }}>Time</th>
                          <th style={{ width: 140 }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map((log, idx) => (
                          <tr key={log._id}>
                            <td>{idx + 1}</td>
                            <td>
                              <img
                                src={log.photoUrl || "/logo.png"}
                                alt="thumb"
                                style={{
                                  width: 110,
                                  height: 72,
                                  objectFit: "cover",
                                  borderRadius: 6,
                                  border: `1px solid ${COLORS.border}`,
                                  cursor: log.photoUrl ? "pointer" : "default",
                                }}
                                onClick={() => log.photoUrl && setSelectedImage(log.photoUrl)}
                              />
                            </td>
                            <td style={{ color: COLORS.text, fontWeight: 600 }}>{log.description || "No description"}</td>
                            <td style={{ color: COLORS.muted }}>
                              {log.userId?.firstname || user?.firstname || "—"} {log.userId?.lastname || user?.lastname || ""}
                            </td>
                            <td style={{ color: COLORS.muted }}>{formatDate(log.createdAt)}</td>
                            <td style={{ color: COLORS.muted }}>{formatTime(log.createdAt)}</td>
                            <td>
                              <span
                                style={{
                                  background: COLORS.status[log.status] || COLORS.status.Deposited,
                                  color: log.status === "Pending Verification" ? "#000" : "#030303",
                                  padding: "6px 10px",
                                  borderRadius: 999,
                                  fontWeight: 600,
                                  display: "inline-block",
                                }}
                              >
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="d-block d-md-none">
              <div className="d-flex flex-column gap-3">
                {logs.map((log) => (
                  <div key={log._id} className="card" style={{ border: `1px solid ${COLORS.border}`, background: COLORS.surface }}>
                    <div
                      style={{
                        height: 220,
                        overflow: "hidden",
                        cursor: log.photoUrl ? "pointer" : "default",
                      }}
                      onClick={() => log.photoUrl && setSelectedImage(log.photoUrl)}
                    >
                      {log.photoUrl ? (
                        <img src={log.photoUrl} alt="log" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div className="d-flex align-items-center justify-content-center" style={{ height: "100%", background: "#f8f9fa" }}>
                          <FaBoxOpen size={60} color="#6c757d" />
                        </div>
                      )}
                    </div>

                    <div className="p-3">
                      <div style={{ fontWeight: 700, color: COLORS.text }}>{log.description || "No Description"}</div>
                      <div className="small" style={{ color: COLORS.muted, marginTop: 6 }}>
                        {log.userId?.firstname || user?.firstname} {log.userId?.lastname || user?.lastname} • {formatDate(log.createdAt)} {formatTime(log.createdAt)}
                      </div>

                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <div>
                          <span
                            style={{
                              background: COLORS.status[log.status] || COLORS.status.Deposited,
                              color: log.status === "Pending Verification" ? "#000" : "#030303",
                              padding: "6px 10px",
                              borderRadius: 999,
                              fontWeight: 600,
                              display: "inline-block",
                            }}
                          >
                            {log.status}
                          </span>
                        </div>

                        <div>
                          <button
                            className="btn btn-sm"
                            onClick={() => log.photoUrl && setSelectedImage(log.photoUrl)}
                            style={{
                              background: "transparent",
                              border: `1px solid ${COLORS.border}`,
                              color: COLORS.text,
                              padding: "6px 10px",
                              borderRadius: 8,
                            }}
                          >
                            View Photo
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
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
    </div>
  );
}

export default UserHistoryLog;