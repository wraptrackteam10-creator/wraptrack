import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { LuArrowLeft } from "react-icons/lu";
import { FaArchive } from "react-icons/fa";
import { MdUnarchive } from "react-icons/md";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { fetchWithAuth } from "../../../utils/fetchWithAuth";

const COLORS = {
  appBg: "#F1EFEC",
  header: "#123458",
  headerText: "#F1EFEC",
  surface: "#FFFFFF",
  border: "#D4C9BE",
  primary: "#123458",
  secondary: "#5A7FA6",
  text: "#030303",
  muted: "#D4C9BE",
  lightText: "#666666",
  status: {
    Deposited: "#F1F5F9",
    Claimed: "#E8F5E9",
    Unclaimed: "#FFEBEE",
    "Pending Verification": "#FFF3E0",
    Settled: "#E8F4F8",
    Archive: "#F3F4F6",
  },
  statusBorder: {
    Deposited: "#94A3B8",
    Claimed: "#66BB6A",
    Unclaimed: "#EF5350",
    "Pending Verification": "#FFA726",
    Settled: "#80DEEA",
    Archive: "#9CA3AF",
  },
  statusText: {
    Deposited: "#475569",
    Claimed: "#2E7D32",
    Unclaimed: "#C62828",
    "Pending Verification": "#E65100",
    Settled: "#00838F",
    Archive: "#374151",
  },
};

function UserArchivedPage() {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "";
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [unarchivingId, setUnarchivingId] = useState(null);

  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user"))
      : null;

  const formatDate = (iso) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (iso) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  useEffect(() => {
    const fetchArchivedItems = async () => {
      try {
        setLoading(true);
        const res = await fetchWithAuth(
          `${API_BASE_URL}/api/items?archived=true`,
          { credentials: "include" }
        );
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          // Filter to current user's own archived items only
          const archived = data.filter(
            (item) => item.userId?._id === user?.id || item.userId === user?.id
          );
          setItems(archived);
        } else {
          setItems([]);
        }
      } catch (err) {
        console.error("Error fetching archived items:", err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) fetchArchivedItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, API_BASE_URL]);

  const handleUnarchive = async (itemId) => {
    try {
      setUnarchivingId(itemId);
      const res = await fetchWithAuth(
        `${API_BASE_URL}/api/items/${itemId}/unarchive`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (res.ok) {
        // Remove the item from the list
        setItems((prevItems) => prevItems.filter((item) => item._id !== itemId));
      } else {
        console.error("Failed to unarchive item");
        alert("Failed to unarchive item. Please try again.");
      }
    } catch (err) {
      console.error("Error unarchiving item:", err);
      alert("Error unarchiving item. Please try again.");
    } finally {
      setUnarchivingId(null);
    }
  };

  return (
    <div
      style={{
        background: COLORS.appBg,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <header
        style={{
          background: COLORS.header,
          color: COLORS.headerText,
          padding: "16px 24px",
          position: "sticky",
          top: 0,
          zIndex: 20,
          boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
        }}
      >
        <div className="container-fluid d-flex align-items-center gap-3">
          <button
            onClick={() => navigate("/user/home")}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              color: COLORS.headerText,
              borderRadius: "8px",
              padding: "8px 10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.25)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.15)")
            }
            aria-label="Back"
          >
            <LuArrowLeft size={20} />
          </button>
          <div>
            <h2
              className="d-none d-md-block"
              style={{ fontWeight: 700, margin: 0, fontSize: "22px" }}
            >
              Archived Items
            </h2>
            <h3
              className="d-md-none"
              style={{ fontWeight: 700, margin: 0, fontSize: "18px" }}
            >
              Archived
            </h3>
            <small style={{ opacity: 0.8, fontSize: "13px" }}>
              Items you've archived from your dashboard
            </small>
          </div>
        </div>
      </header>

      {/* Content */}
      <main style={{ flex: 1, padding: "24px 0" }}>
        <div className="container-fluid px-3 px-md-4">
          {/* Desktop Table */}
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
              {loading ? (
                <div className="text-center py-5">
                  <div
                    className="spinner-border"
                    style={{ color: COLORS.primary }}
                    role="status"
                  >
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <div
                    className="mt-3"
                    style={{ fontWeight: 500, fontSize: "15px", color: COLORS.text }}
                  >
                    Loading archived items...
                  </div>
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-5">
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle mb-4 mx-auto"
                    style={{
                      width: "80px",
                      height: "80px",
                      background: "rgba(18,52,88,0.08)",
                      color: COLORS.primary,
                    }}
                  >
                    <FaArchive size={32} />
                  </div>
                  <h5
                    style={{
                      color: COLORS.text,
                      fontWeight: 700,
                      marginBottom: "8px",
                    }}
                  >
                    No archived items
                  </h5>
                  <p
                    style={{
                      color: COLORS.lightText,
                      fontSize: "14px",
                      marginBottom: "20px",
                    }}
                  >
                    Items you archive from your dashboard will appear here.
                  </p>
                  <button
                    onClick={() => navigate("/user/home")}
                    style={{
                      background: COLORS.primary,
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "10px 20px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ← Back to Dashboard
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table
                    className="table mb-0 align-middle"
                    style={{ borderCollapse: "collapse" }}
                  >
                    <thead>
                      <tr
                        style={{
                          background: "#F9FAFB",
                          borderBottom: `2px solid ${COLORS.border}`,
                          color: COLORS.text,
                        }}
                      >
                        {["#", "Photo", "Description", "Owner", "Date Archived", "Status", "Action"].map(
                          (h) => (
                            <th
                              key={h}
                              style={{
                                padding: "14px 16px",
                                fontWeight: 700,
                                fontSize: "13px",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                textAlign:
                                  h === "Status" || h === "Action"
                                    ? "center"
                                    : "left",
                              }}
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr
                          key={item._id}
                          style={{
                            borderBottom: `1px solid ${COLORS.border}`,
                            color: COLORS.text,
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = "#F9FAFB")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = "transparent")
                          }
                        >
                          <td
                            style={{
                              padding: "14px 16px",
                              fontSize: "14px",
                              fontWeight: 600,
                              color: COLORS.lightText,
                            }}
                          >
                            {idx + 1}
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <img
                              src={item.photoUrl || "/logo.png"}
                              alt="item"
                              style={{
                                width: 90,
                                height: 65,
                                objectFit: "cover",
                                borderRadius: "8px",
                                border: `1px solid ${COLORS.border}`,
                                cursor: "pointer",
                                transition: "transform 0.2s",
                              }}
                              onClick={() =>
                                setSelectedImage(item.photoUrl || "/logo.png")
                              }
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.transform = "scale(1.05)")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.transform = "scale(1)")
                              }
                            />
                          </td>
                          <td
                            style={{
                              padding: "14px 16px",
                              fontSize: "14px",
                              maxWidth: "260px",
                              fontWeight: 500,
                            }}
                          >
                            {item.description || "—"}
                          </td>
                          <td
                            style={{
                              padding: "14px 16px",
                              fontSize: "14px",
                              color: COLORS.secondary,
                              fontWeight: 500,
                            }}
                          >
                            {item.userId?.firstname || user?.firstname || "—"}{" "}
                            {item.userId?.lastname || user?.lastname || ""}
                          </td>
                          <td
                            style={{
                              padding: "14px 16px",
                              fontSize: "13px",
                              color: COLORS.lightText,
                            }}
                          >
                            {formatDate(item.updatedAt || item.createdAt)}
                            <br />
                            <span style={{ fontSize: "11px", color: COLORS.muted }}>
                              {formatTime(item.updatedAt || item.createdAt)}
                            </span>
                          </td>
                          <td style={{ padding: "14px 16px", textAlign: "center" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                padding: "5px 12px",
                                borderRadius: "6px",
                                background:
                                  COLORS.status[item.status] || COLORS.status.Archive,
                                border: `1.5px solid ${
                                  COLORS.statusBorder[item.status] ||
                                  COLORS.statusBorder.Archive
                                }`,
                                color:
                                  COLORS.statusText[item.status] ||
                                  COLORS.statusText.Archive,
                                fontWeight: 600,
                                fontSize: "12px",
                              }}
                            >
                              {item.status || "Archived"}
                            </span>
                          </td>
                          <td style={{ padding: "14px 16px", textAlign: "center" }}>
                            <button
                              onClick={() => handleUnarchive(item._id)}
                              disabled={unarchivingId === item._id}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                background: "#E8F4F8",
                                border: "1.5px solid #80DEEA",
                                color: "#00838F",
                                fontWeight: 600,
                                fontSize: "12px",
                                cursor: unarchivingId === item._id ? "not-allowed" : "pointer",
                                transition: "all 0.2s",
                                opacity: unarchivingId === item._id ? 0.6 : 1,
                              }}
                              onMouseEnter={(e) => {
                                if (unarchivingId !== item._id) {
                                  e.currentTarget.style.background = "#D1EAEE";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (unarchivingId !== item._id) {
                                  e.currentTarget.style.background = "#E8F4F8";
                                }
                              }}
                            >
                              {unarchivingId === item._id ? (
                                <>
                                  <span
                                    className="spinner-border"
                                    style={{
                                      width: "12px",
                                      height: "12px",
                                      borderWidth: "1.5px",
                                    }}
                                    role="status"
                                  />
                                  Unarchiving...
                                </>
                              ) : (
                                <>
                                  <MdUnarchive size={14} />
                                  Unarchive
                                </>
                              )}
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

          {/* Mobile Cards */}
          <div className="d-block d-md-none">
            {loading ? (
              <div className="text-center py-5">
                <div
                  className="spinner-border"
                  style={{ color: COLORS.primary }}
                  role="status"
                />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-5">
                <FaArchive size={40} color={COLORS.muted} />
                <p className="mt-3" style={{ color: COLORS.lightText }}>
                  No archived items yet.
                </p>
                <button
                  onClick={() => navigate("/user/home")}
                  style={{
                    background: COLORS.primary,
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 20px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  ← Back to Dashboard
                </button>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3 px-1">
                {items.map((item) => {
                  const isExpanded = expandedItemId === item._id;
                  return (
                    <div
                      key={item._id}
                      style={{
                        background: COLORS.surface,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: "10px",
                        overflow: "hidden",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                      }}
                    >
                      {/* Card image */}
                      <div style={{ position: "relative" }}>
                        <img
                          src={item.photoUrl || "/logo.png"}
                          alt="item"
                          style={{
                            width: "100%",
                            height: "160px",
                            objectFit: "cover",
                            display: "block",
                            cursor: "pointer",
                          }}
                          onClick={() =>
                            setSelectedImage(item.photoUrl || "/logo.png")
                          }
                        />
                        <span
                          style={{
                            position: "absolute",
                            top: "10px",
                            right: "10px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            background:
                              COLORS.status[item.status] || COLORS.status.Archive,
                            border: `1.5px solid ${
                              COLORS.statusBorder[item.status] ||
                              COLORS.statusBorder.Archive
                            }`,
                            color:
                              COLORS.statusText[item.status] ||
                              COLORS.statusText.Archive,
                            fontWeight: 600,
                            fontSize: "11px",
                          }}
                        >
                          {item.status || "Archived"}
                        </span>
                      </div>

                      {/* Card body */}
                      <div style={{ padding: "12px 14px" }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "14px",
                            color: COLORS.text,
                            marginBottom: "4px",
                          }}
                        >
                          {item.description || "No description"}
                        </div>
                        <div
                          style={{
                            color: COLORS.lightText,
                            fontSize: "12px",
                            marginBottom: "8px",
                          }}
                        >
                          {formatDate(item.updatedAt || item.createdAt)} •{" "}
                          {formatTime(item.updatedAt || item.createdAt)}
                        </div>

                        {isExpanded && (
                          <div
                            style={{
                              borderTop: `1px solid ${COLORS.border}`,
                              paddingTop: "10px",
                              marginTop: "8px",
                              fontSize: "13px",
                              color: COLORS.lightText,
                            }}
                          >
                            <div style={{ marginBottom: "8px" }}>
                              <strong>Owner:</strong>{" "}
                              {item.userId?.firstname || user?.firstname || "—"}{" "}
                              {item.userId?.lastname || user?.lastname || ""}
                            </div>
                            <div>
                              <strong>Item Status:</strong> {item.status || "Archived"}
                            </div>
                          </div>
                        )}

                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            marginTop: "12px",
                          }}
                        >
                          <button
                            style={{
                              background: "transparent",
                              border: "none",
                              color: COLORS.primary,
                              fontSize: "12px",
                              fontWeight: 500,
                              cursor: "pointer",
                              padding: "4px 0",
                              flex: 1,
                            }}
                            onClick={() =>
                              setExpandedItemId(isExpanded ? null : item._id)
                            }
                          >
                            {isExpanded ? "▲ Less" : "▼ More"}
                          </button>
                          <button
                            onClick={() => handleUnarchive(item._id)}
                            disabled={unarchivingId === item._id}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "4px",
                              padding: "6px 10px",
                              borderRadius: "6px",
                              background: "#E8F4F8",
                              border: "1.5px solid #80DEEA",
                              color: "#00838F",
                              fontWeight: 600,
                              fontSize: "11px",
                              cursor: unarchivingId === item._id ? "not-allowed" : "pointer",
                              transition: "all 0.2s",
                              opacity: unarchivingId === item._id ? 0.6 : 1,
                              flex: 1,
                            }}
                          >
                            {unarchivingId === item._id ? (
                              <>
                                <span
                                  className="spinner-border"
                                  style={{
                                    width: "10px",
                                    height: "10px",
                                    borderWidth: "1.5px",
                                  }}
                                  role="status"
                                />
                                Unarchiving...
                              </>
                            ) : (
                              <>
                                <MdUnarchive size={12} />
                                Unarchive
                              </>
                            )}
                          </button>
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

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: "rgba(0,0,0,0.75)", zIndex: 9000 }}
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="full-view"
            style={{
              maxWidth: "90vw",
              maxHeight: "85vh",
              borderRadius: "12px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              objectFit: "contain",
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setSelectedImage(null)}
            style={{
              position: "fixed",
              top: "20px",
              right: "24px",
              background: "rgba(255,255,255,0.15)",
              border: "none",
              color: "#fff",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              fontSize: "18px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export default UserArchivedPage;
