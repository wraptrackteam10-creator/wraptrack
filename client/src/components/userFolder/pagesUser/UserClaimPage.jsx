import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { LuArrowLeft } from "react-icons/lu";
import { FaBoxOpen } from "react-icons/fa";
import { fetchWithAuth } from "../../../utils/fetchWithAuth";

/**
 * UserClaimPage — Production Ready
 *
 * - Color system: header #123458, app bg #F1EFEC, surface #FFFFFF, borders #D4C9BE
 * - Desktop (md+): modern table layout with professional styling
 * - Mobile: optimized card layout with improved typography and hierarchy
 * - Responsive design with smooth interactions
 */

const COLORS = {
  appBg: "#F1EFEC",
  header: "#123458",
  headerText: "#F1EFEC",
  surface: "#FFFFFF",
  border: "#D4C9BE",
  primary: "#123458",
  secondary: "#5A7FA6",
  delete: "#F08080",
  text: "#030303",
  lightText: "#666666",
  muted: "#D4C9BE",
  success: "#4BB543",
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

function UserClaimPage() {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const navigate = useNavigate();

  const [settings, setSettings] = useState(null);
  const [items, setItems] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [claimingId, setClaimingId] = useState(null);

  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;
  const goBack = () => navigate(-1);

  // =============================
  // SHOW TOAST
  // =============================
  const showToast = (message, type = "success", duration = 3000) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), duration);
  };

  // =============================
  // FETCH SETTINGS
  // =============================
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE_URL}/api/settings`, {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok) setSettings(data);
        else showToast(data.error || "Failed to load settings", "danger");
      } catch (error) {
        console.error("Error loading settings:", error);
        showToast("Error loading settings", "danger");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE_URL]);

  // =============================
  // FETCH ITEMS
  // =============================
  useEffect(() => {
    const fetchItems = async () => {
      if (!user) return;
      try {
        const res = await fetchWithAuth(`${API_BASE_URL}/api/items`, {
          credentials: "include",
        });
        const data = await res.json();

        if (res.ok) {
          const userItems = (data || []).filter(
            (item) =>
              item.userId?._id === user?.id &&
              (item.status === "Deposited" || item.status === "Pending Verification")
          );
          setItems(userItems);
        } else {
          showToast(data.error || "Failed to fetch items", "danger");
        }
      } catch (error) {
        console.error("Error fetching items:", error);
        showToast("Error fetching items", "danger");
      }
    };
    fetchItems();
  }, [user, API_BASE_URL]);

  // =============================
  // HANDLE CLAIM
  // =============================
  const handleClaim = async (itemId) => {
    try {
      setClaimingId(itemId);
      const res = await fetchWithAuth(`${API_BASE_URL}/api/items/${itemId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "Pending Verification" }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast("✅ Claim request submitted! Awaiting verification.", "success");
        setItems((prev) =>
          prev.map((item) => (item._id === itemId ? { ...item, status: "Pending Verification" } : item))
        );
      } else {
        showToast(data.error || "❌ Failed to submit claim request", "danger");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      showToast("⚠️ Server error while submitting claim", "danger");
    } finally {
      setClaimingId(null);
    }
  };

  // =============================
  // FORMAT HELPERS
  // =============================
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

  if (loading) {
    return (
      <div style={{ background: COLORS.appBg, minHeight: "100vh" }} className="d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border" style={{ color: COLORS.primary }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div style={{ color: COLORS.lightText, marginTop: "12px", fontWeight: 500 }}>
            Loading settings...
          </div>
        </div>
      </div>
    );
  }

  const canClaim = settings?.studentAccess && !settings?.loginRestriction;

  return (
    <div style={{ background: COLORS.appBg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* FIXED HEADER */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: COLORS.header,
          color: COLORS.headerText,
          boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
          padding: "16px 24px",
        }}
      >
        <div className="d-flex align-items-center justify-content-between">
          <button
            onClick={goBack}
            className="btn btn-link p-0"
            style={{
              color: COLORS.headerText,
              textDecoration: "none",
              transition: "all 0.2s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            aria-label="Go back"
          >
            <LuArrowLeft size={22} style={{ marginRight: "8px" }} />
          </button>

          <div style={{ textAlign: "center", flex: 1 }}>
            <h2 style={{ fontWeight: 700, margin: "0 0 4px 0", fontSize: "22px" }}>
              Claim Items
            </h2>
            <small style={{ color: COLORS.headerText, opacity: 0.85, fontSize: "13px" }}>
              Manage your deposited items here
            </small>
          </div>

          <div style={{ width: 30 }} />
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, overflow: "auto", padding: "24px 0" }}>
        <div className="container-fluid px-3 px-md-4">
          {/* Desktop Table View */}
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
              {items.length === 0 ? (
                <div className="text-center py-5">
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle mb-3 mx-auto"
                    style={{
                      width: "80px",
                      height: "80px",
                      background: "rgba(18, 52, 88, 0.08)",
                      color: COLORS.primary,
                    }}
                  >
                    <FaBoxOpen size={40} />
                  </div>
                  <h5 style={{ color: COLORS.text, fontWeight: "700", marginBottom: "8px" }}>
                    No items to claim yet
                  </h5>
                  <p style={{ color: COLORS.lightText, marginBottom: "20px", fontSize: "14px" }}>
                    Items you deposited will appear here once verified.
                  </p>
                </div>
              ) : (
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
                        <th style={{ padding: "14px 16px", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", maxWidth: "300px" }}>
                          Description
                        </th>
                        <th style={{ padding: "14px 16px", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", width: "150px" }}>
                          Owner
                        </th>
                        <th style={{ padding: "14px 16px", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", width: "110px" }}>
                          Date
                        </th>
                        <th style={{ padding: "14px 16px", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", width: "90px" }}>
                          Time
                        </th>
                        <th style={{ padding: "14px 16px", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", width: "140px", textAlign: "center" }}>
                          Status
                        </th>
                        <th style={{ padding: "14px 16px", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", width: "100px", textAlign: "center" }}>
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr
                          key={item._id}
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
                              src={item.photoUrl || "/logo.png"}
                              alt="item-thumb"
                              style={{
                                width: 90,
                                height: 65,
                                objectFit: "cover",
                                borderRadius: "8px",
                                border: `1px solid ${COLORS.border}`,
                                cursor: "pointer",
                                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                              }}
                              onClick={() => setSelectedImage(item.photoUrl || "/logo.png")}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "scale(1.05)";
                                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "scale(1)";
                                e.currentTarget.style.boxShadow = "none";
                              }}
                            />
                          </td>

                          <td style={{ padding: "14px 16px", fontSize: "14px", maxWidth: "300px" }}>
                            <div
                              style={{
                                fontWeight: 600,
                                color: COLORS.text,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                wordBreak: "break-word",
                              }}
                              title={item.description || ""}
                            >
                              {item.description || "No description"}
                            </div>
                          </td>

                          <td style={{ padding: "14px 16px", fontSize: "14px", color: COLORS.lightText }}>
                            {item.userId?.firstname || user?.firstname || "—"} {item.userId?.lastname || user?.lastname || ""}
                          </td>

                          <td style={{ padding: "14px 16px", fontSize: "14px", color: COLORS.lightText }}>
                            {formatDate(item.createdAt)}
                          </td>

                          <td style={{ padding: "14px 16px", fontSize: "14px", color: COLORS.lightText }}>
                            {formatTime(item.createdAt)}
                          </td>

                          <td style={{ padding: "14px 16px", textAlign: "center" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                background: COLORS.status[item.status] || COLORS.status.Deposited,
                                border: `1.5px solid ${COLORS.statusBorder[item.status] || COLORS.statusBorder.Deposited}`,
                                color: COLORS.statusText[item.status] || COLORS.statusText.Deposited,
                                fontWeight: 600,
                                fontSize: "12px",
                                minWidth: "90px",
                              }}
                            >
                              {item.status === "Pending Verification" ? "⏳ Pending" : item.status}
                            </span>
                          </td>

                          <td style={{ padding: "14px 16px", textAlign: "center" }}>
                            <button
                              className="btn btn-sm"
                              onClick={() => {
                                if (!canClaim || item.status === "Pending Verification") return;
                                handleClaim(item._id);
                              }}
                              disabled={!canClaim || item.status === "Pending Verification" || claimingId === item._id}
                              style={{
                                background: canClaim && item.status !== "Pending Verification" ? COLORS.primary : COLORS.muted,
                                color: COLORS.headerText,
                                border: "none",
                                borderRadius: "6px",
                                padding: "8px 14px",
                                fontWeight: 600,
                                fontSize: "13px",
                                cursor: !canClaim || item.status === "Pending Verification" || claimingId === item._id ? "not-allowed" : "pointer",
                                transition: "all 0.2s ease",
                                opacity: !canClaim || item.status === "Pending Verification" || claimingId === item._id ? 0.6 : 1,
                              }}
                              onMouseEnter={(e) => {
                                if (!e.currentTarget.disabled) {
                                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(18, 52, 88, 0.25)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = "none";
                              }}
                            >
                              {!canClaim ? "Unavailable" : claimingId === item._id ? "Processing..." : item.status === "Pending Verification" ? "Verifying…" : "Claim"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="d-block d-md-none">
            {items.length === 0 ? (
              <div
                className="text-center py-5 rounded-4 d-flex flex-column align-items-center justify-content-center"
                style={{
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  minHeight: "350px",
                  margin: "0 12px",
                }}
              >
                <div
                  className="d-flex align-items-center justify-content-center rounded-circle mb-3"
                  style={{
                    width: "64px",
                    height: "64px",
                    background: "rgba(18, 52, 88, 0.08)",
                    color: COLORS.primary,
                  }}
                >
                  <FaBoxOpen size={32} />
                </div>
                <h5 style={{ color: COLORS.text, fontWeight: "700", marginBottom: "8px" }}>
                  No items to claim
                </h5>
                <p style={{ color: COLORS.lightText, fontSize: "14px", margin: 0 }}>
                  Items will appear here once verified.
                </p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3 px-2">
                {items.map((item) => (
                  <div
                    key={item._id}
                    style={{
                      background: COLORS.surface,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: "12px",
                      overflow: "hidden",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {/* Image */}
                    <div
                      style={{
                        width: "100%",
                        height: "240px",
                        overflow: "hidden",
                        cursor: item.photoUrl ? "pointer" : "default",
                        background: "#F9FAFB",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onClick={() => item.photoUrl && setSelectedImage(item.photoUrl)}
                    >
                      {item.photoUrl ? (
                        <img
                          src={item.photoUrl}
                          alt="Item"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <FaBoxOpen size={48} color={COLORS.muted} />
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ padding: "16px" }}>
                      {/* Description */}
                      <div style={{ marginBottom: "12px" }}>
                        <h6 style={{
                          fontWeight: 700,
                          color: COLORS.text,
                          fontSize: "15px",
                          margin: "0 0 6px 0",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}>
                          {item.description || "No description"}
                        </h6>
                        <p style={{
                          fontWeight: 500,
                          color: COLORS.lightText,
                          fontSize: "12px",
                          margin: 0,
                        }}>
                          {item.userId?.firstname || user?.firstname} {item.userId?.lastname || user?.lastname} • {formatDate(item.createdAt)}
                        </p>
                        <p style={{
                          fontWeight: 400,
                          color: COLORS.muted,
                          fontSize: "11px",
                          margin: "4px 0 0 0",
                        }}>
                          {formatTime(item.createdAt)}
                        </p>
                      </div>

                      {/* Status & Action */}
                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "6px 10px",
                            borderRadius: "6px",
                            background: COLORS.status[item.status] || COLORS.status.Deposited,
                            border: `1.5px solid ${COLORS.statusBorder[item.status] || COLORS.statusBorder.Deposited}`,
                            color: COLORS.statusText[item.status] || COLORS.statusText.Deposited,
                            fontWeight: 600,
                            fontSize: "12px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.status === "Pending Verification" ? "⏳ Pending" : item.status}
                        </span>

                        <button
                          onClick={() => {
                            if (!canClaim || item.status === "Pending Verification") return;
                            handleClaim(item._id);
                          }}
                          disabled={!canClaim || item.status === "Pending Verification" || claimingId === item._id}
                          style={{
                            flex: 1,
                            background: canClaim && item.status !== "Pending Verification" ? COLORS.primary : COLORS.muted,
                            color: COLORS.headerText,
                            border: "none",
                            borderRadius: "6px",
                            padding: "10px 12px",
                            fontWeight: 600,
                            fontSize: "14px",
                            cursor: !canClaim || item.status === "Pending Verification" || claimingId === item._id ? "not-allowed" : "pointer",
                            transition: "all 0.2s ease",
                            opacity: !canClaim || item.status === "Pending Verification" || claimingId === item._id ? 0.6 : 1,
                          }}
                          onMouseEnter={(e) => {
                            if (!e.currentTarget.disabled) {
                              e.currentTarget.style.transform = "translateY(-2px)";
                              e.currentTarget.style.boxShadow = "0 4px 12px rgba(18, 52, 88, 0.2)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        >
                          {!canClaim ? "Unavailable" : claimingId === item._id ? "Processing..." : item.status === "Pending Verification" ? "Verifying…" : "Claim"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* FULLSCREEN IMAGE VIEWER */}
      {selectedImage && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1050,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "zoom-out",
            animation: "fadeIn 0.2s ease-out",
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

      {/* TOAST NOTIFICATION */}
      {toast.show && (
        <div
          role="alert"
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            padding: "14px 18px",
            borderRadius: "8px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            zIndex: 7000,
            minWidth: "280px",
            background: toast.type === "success" ? COLORS.success : toast.type === "danger" ? COLORS.delete : "#ffc107",
            color: toast.type === "warning" ? COLORS.text : "#fff",
            fontWeight: 500,
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            animation: "slideInUp 0.3s ease-out",
          }}
        >
          <span style={{ fontSize: "18px" }}>
            {toast.type === "success" ? "✓" : toast.type === "danger" ? "✕" : "⚠"}
          </span>
          {toast.message}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
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

export default UserClaimPage;
