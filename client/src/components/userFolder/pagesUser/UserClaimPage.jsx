import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { LuArrowLeft } from "react-icons/lu";
import { FaBoxOpen } from "react-icons/fa";
import { fetchWithAuth } from "../../../utils/fetchWithAuth";

/**
 * Updated UserClaimPage
 * - Color system and UI follow the project's design rules.
 * - Desktop (md+): table view with columns: #, Photo, Description, Owner, Date, Time, Status, Actions (Claim).
 * - Mobile: card layout (touch friendly) — similar to previous design.
 * - Header and buttons use the specified colors:
 *   - App background: #F1EFEC
 *   - Header/footer: #123458 with header text #F1EFEC
 *   - Card / Table surface: #FFFFFF, borders: #D4C9BE
 *   - Primary action: #123458
 *   - Delete / danger: #F08080
 */

const COLORS = {
  appBg: "#F1EFEC",
  header: "#123458",
  headerText: "#F1EFEC",
  surface: "#FFFFFF",
  border: "#D4C9BE",
  primary: "#123458",
  delete: "#F08080",
  text: "#030303",
  muted: "#D4C9BE",
  status: {
    Deposited: "#D4C9BE",
    Claimed: "#90EE90",
    Unclaimed: "#F08080",
    "Pending Verification": "#FFD700",
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

  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;
  const goBack = () => navigate(-1);

  // TOAST
  const showToast = (message, type = "success", duration = 3000) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), duration);
  };

  // Load settings
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

  // Load user items
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

  // Handle claim request
  const handleClaim = async (itemId) => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/items/${itemId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "Pending Verification" }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast("✅ Requested claim, waiting for verification!", "success");
        setItems((prev) =>
          prev.map((item) => (item._id === itemId ? { ...item, status: "Pending Verification" } : item))
        );
      } else {
        showToast(data.error || "❌ Failed to update status", "danger");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      showToast("⚠️ Server error while updating item.", "danger");
    }
  };

  if (loading) {
    return (
      <div style={{ background: COLORS.appBg, minHeight: "100vh" }} className="d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div style={{ color: COLORS.muted }}>Loading settings...</div>
        </div>
      </div>
    );
  }

  const canClaim = settings?.studentAccess && !settings?.loginRestriction;

  return (
    <div style={{ background: COLORS.appBg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* HEADER */}
      <div
        style={{
          position: "sticky",
          top: 0,
          left: 0,
          width: "100%",
          zIndex: 1000,
          background: COLORS.header,
          color: COLORS.headerText,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          padding: "12px 0",
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
            <div style={{ fontWeight: 700 }}>Claim Items</div>
            <small style={{ color: COLORS.headerText, opacity: 0.95 }}>Manage your deposited items here</small>
          </div>

          <div style={{ width: 36 }} />
        </div>
      </div>

      {/* CONTENT */}
      <div
        className="container flex-grow-1 py-4"
        style={{
          marginTop: 84,
          overflowY: "auto",
          maxHeight: "calc(100vh - 84px)",
        }}
      >
        {/* Desktop table view */}
        <div className="d-none d-md-block">
          <div className="card" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
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
                      <th style={{ width: 140 }} className="text-end">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-5" style={{ color: COLORS.muted }}>
                          <div>
                            <FaBoxOpen size={40} className="mb-2" />
                            <div>No items to claim yet</div>
                            <div className="small" style={{ color: COLORS.muted }}>Items you deposited will appear here once verified.</div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      items.map((item, i) => (
                        <tr key={item._id}>
                          <td>{i + 1}</td>
                          <td>
                            <img
                              src={item.photoUrl || "/logo.png"}
                              alt="thumb"
                              style={{ width: 110, height: 72, objectFit: "cover", borderRadius: 6, border: `1px solid ${COLORS.border}`, cursor: "pointer" }}
                              onClick={() => item.photoUrl && setSelectedImage(item.photoUrl)}
                            />
                          </td>
                          <td style={{ color: COLORS.text, fontWeight: 600 }}>{item.description || "No description"}</td>
                          <td style={{ color: COLORS.muted }}>
                            {item.userId?.firstname || user?.firstname || "—"} {item.userId?.lastname || user?.lastname || ""}
                          </td>
                          <td style={{ color: COLORS.muted }}>{new Date(item.createdAt).toLocaleDateString()}</td>
                          <td style={{ color: COLORS.muted }}>{new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                          <td>
                            <span
                              style={{
                                background: COLORS.status[item.status] || COLORS.status.Deposited,
                                color: item.status === "Pending Verification" ? "#000" : "#030303",
                                padding: "6px 10px",
                                borderRadius: 999,
                                fontWeight: 600,
                                display: "inline-block",
                              }}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="text-end">
                            <button
                              className="btn btn-sm"
                              onClick={() => {
                                if (!canClaim || item.status === "Pending Verification") return;
                                handleClaim(item._id);
                              }}
                              disabled={!canClaim || item.status === "Pending Verification"}
                              style={{
                                background: canClaim && item.status !== "Pending Verification" ? COLORS.primary : COLORS.muted,
                                color: COLORS.headerText,
                                border: `1px solid ${canClaim && item.status !== "Pending Verification" ? COLORS.primary : COLORS.border}`,
                                padding: "6px 12px",
                                borderRadius: 8,
                                cursor: !canClaim || item.status === "Pending Verification" ? "not-allowed" : "pointer",
                                fontWeight: 700,
                              }}
                            >
                              {!canClaim ? "Claiming unavailable" : item.status === "Pending Verification" ? "Verifying…" : "Claim"}
                            </button>
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

        {/* Mobile cards */}
        <div className="d-block d-md-none">
          {items.length === 0 ? (
            <div className="text-center py-5" style={{ color: COLORS.muted }}>
              <FaBoxOpen size={60} className="mb-3" />
              <h6 style={{ color: COLORS.text }}>No items to claim yet</h6>
              <p className="small">Items you deposited will appear here once verified.</p>
            </div>
          ) : (
            <div className="row g-3">
              {items.map((item) => (
                <div key={item._id} className="col-12">
                  <div
                    className="card shadow-sm"
                    style={{ border: `1px solid ${COLORS.border}`, overflow: "hidden" }}
                  >
                    <div
                      style={{
                        height: 220,
                        overflow: "hidden",
                        cursor: item.photoUrl ? "pointer" : "default",
                      }}
                      onClick={() => item.photoUrl && setSelectedImage(item.photoUrl)}
                    >
                      {item.photoUrl ? (
                        <img
                          src={item.photoUrl}
                          alt="Item"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <div className="d-flex align-items-center justify-content-center" style={{ height: "100%", background: "#f8f9fa" }}>
                          <FaBoxOpen size={60} color="#6c757d" />
                        </div>
                      )}
                    </div>

                    <div className="p-3 d-flex flex-column gap-2">
                      <div>
                        <div style={{ fontWeight: 700, color: COLORS.text }}>{item.description || "No description"}</div>
                        <div className="small" style={{ color: COLORS.muted }}>
                          {item.userId?.firstname || user?.firstname} {item.userId?.lastname || user?.lastname} • {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>

                      <div className="d-flex gap-2">
                        <div style={{ flex: 1 }}>
                          <span
                            style={{
                              background: COLORS.status[item.status] || COLORS.status.Deposited,
                              color: item.status === "Pending Verification" ? "#000" : "#030303",
                              padding: "6px 10px",
                              borderRadius: 999,
                              fontWeight: 600,
                              display: "inline-block",
                            }}
                          >
                            {item.status}
                          </span>
                        </div>

                        <div style={{ flex: 1 }}>
                          <button
                            onClick={() => {
                              if (!canClaim || item.status === "Pending Verification") return;
                              handleClaim(item._id);
                            }}
                            disabled={!canClaim || item.status === "Pending Verification"}
                            style={{
                              width: "100%",
                              background: canClaim && item.status !== "Pending Verification" ? COLORS.primary : COLORS.muted,
                              color: COLORS.headerText,
                              border: "none",
                              padding: "10px 12px",
                              borderRadius: 8,
                              fontWeight: 700,
                              cursor: !canClaim || item.status === "Pending Verification" ? "not-allowed" : "pointer",
                            }}
                          >
                            {!canClaim ? "Claiming unavailable" : item.status === "Pending Verification" ? "Verifying…" : "Claim"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FULLSCREEN IMAGE VIEWER */}
      {selectedImage && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ zIndex: 2000, background: "rgba(0,0,0,0.75)", cursor: "zoom-out" }}
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Full View"
            className="rounded shadow-lg"
            style={{ maxWidth: "90%", maxHeight: "90%", objectFit: "contain", border: `1px solid ${COLORS.border}`, background: COLORS.surface }}
          />
        </div>
      )}

      {/* TOAST */}
      {toast.show && (
        <div
          className={`position-fixed bottom-0 end-0 m-3 p-3 rounded shadow`}
          style={{
            zIndex: 2000,
            minWidth: 250,
            background: toast.type === "success" ? COLORS.primary : toast.type === "danger" ? COLORS.delete : "#ffc107",
            color: toast.type === "warning" ? COLORS.text : "#fff",
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default UserClaimPage;