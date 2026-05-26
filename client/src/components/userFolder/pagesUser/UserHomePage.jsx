import React, { useEffect, useState, useRef } from "react";
import { NavLink } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../usercss/imageStyle.css";
import { fetchWithAuth } from "../../../utils/fetchWithAuth";

/**
 * UserHomePage (responsive, production-ready)
 *
 * - Desktop (md+): modern table layout with beautiful styling
 * - Mobile (below md): stacked cards optimized for touch
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
  secondary: "#5A7FA6",
  delete: "#F08080",
  editOutline: "#123458",
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

function UserHomePage() {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "";
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;
  const cardsRef = useRef({});

  const showToast = (message, type = "success", duration = 3000) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), duration);
  };

  const openConfirm = (id) => {
    setConfirmTarget(id);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setConfirmTarget(null);
  };

  const confirmArchive = async () => {
    if (!confirmTarget) return;
    const targetId = confirmTarget;
    closeConfirm();
    await archiveItem(targetId);
  };

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const res = await fetchWithAuth(`${API_BASE_URL}/api/items`, {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok) {
          if (!Array.isArray(data)) return setItems([]);
          const userItems = data.filter(
            (item) =>
              item.userId?._id === user?.id &&
              item.action !== "Archive" &&
              item.status !== "Claimed"
          );
          setItems(userItems);
        } else {
          console.error("Failed to fetch items:", data?.error);
          setItems([]);
        }
      } catch (error) {
        console.error("Error fetching items:", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, API_BASE_URL]);

  const getPenaltyInfo = (status, createdAt, penalty) => {
    if (status === "Unclaimed" || status === "Penalized") {
      return {
        text: `Penalized ${penalty ?? 0}x`,
        color: "#EF5350",
        icon: "⚠️",
      };
    } else if (status === "Pending Verification") {
      return {
        text: "Awaiting Verification",
        color: "#FFA726",
        icon: "⏳",
      };
    }

    const now = new Date();
    const penaltyTime = new Date();
    penaltyTime.setHours(22, 0, 0, 0);

    if (createdAt) {
      const created = new Date(createdAt);
      if (created > penaltyTime) penaltyTime.setDate(penaltyTime.getDate() + 1);
    }

    const diff = penaltyTime - now;
    if (diff <= 0) {
      return {
        text: `Penalized ${penalty ?? 0}x`,
        color: "#EF5350",
        icon: "⚠️",
      };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    return {
      text: `${hours}h ${minutes}m remaining`,
      color: "#2196F3",
      icon: "⏱️",
    };
  };

  const handleViewDetails = (id) => {
    setExpandedItemId((prev) => (prev === id ? null : id));
  };

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
        showToast(err.error || "Failed to archive item", "danger");
        return;
      }
      setItems((prev) => prev.filter((i) => i._id !== id));
      showToast("Item successfully archived.", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to archive item", "danger");
    }
  };

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
      {/* Header (sticky) */}
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
        <div className="container-fluid d-flex align-items-center justify-content-between">
          <div>
            <h2 className="d-none d-md-block" style={{ fontWeight: 700, margin: "0 0 4px 0", fontSize: "24px" }}>
              My Items Dashboard
            </h2>
            <h3 className="d-md-none" style={{ fontWeight: 700, margin: "0 0 4px 0", fontSize: "18px" }}>
              My Items
            </h3>
            <small style={{ color: COLORS.headerText, opacity: 0.85, fontSize: "14px" }}>
              Welcome back, {user?.firstname || "User"} <span>👋</span>
            </small>
          </div>

          {/* Desktop buttons */}
          <div className="d-none d-md-flex gap-2">
            <NavLink to="/user/deposit" className="text-decoration-none">
              <button
                className="btn btn-sm"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  color: COLORS.headerText,
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontWeight: 500,
                  fontSize: "14px",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.target.style.background = "rgba(255,255,255,0.25)")}
                onMouseLeave={(e) => (e.target.style.background = "rgba(255,255,255,0.15)")}
                aria-label="Scan item"
              >
                <i className="bi bi-camera me-2" style={{ fontSize: "16px" }} /> Scan
              </button>
            </NavLink>

            <NavLink to="/user/claim" className="text-decoration-none">
              <button
                className="btn btn-sm"
                style={{
                  background: "#FFFFFF",
                  color: COLORS.header,
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontWeight: 600,
                  fontSize: "14px",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)")}
                onMouseLeave={(e) => (e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,0.12)")}
                aria-label="Claim item"
              >
                <i className="bi bi-box-arrow-up me-2" style={{ fontSize: "16px" }} /> Claim
              </button>
            </NavLink>
          </div>

          {/* Mobile icon buttons */}
          <div className="d-md-none d-flex gap-2">
            <NavLink to="/user/deposit" className="text-decoration-none">
              <button
                className="btn btn-sm"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  color: COLORS.headerText,
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 10px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => (e.target.style.background = "rgba(255,255,255,0.25)")}
                onMouseLeave={(e) => (e.target.style.background = "rgba(255,255,255,0.15)")}
                aria-label="Scan item"
              >
                <i className="bi bi-camera" style={{ fontSize: "18px" }} />
              </button>
            </NavLink>

            <NavLink to="/user/claim" className="text-decoration-none">
              <button
                className="btn btn-sm"
                style={{
                  background: "#FFFFFF",
                  color: COLORS.header,
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 10px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                }}
                onMouseEnter={(e) => (e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)")}
                onMouseLeave={(e) => (e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,0.12)")}
                aria-label="Claim item"
              >
                <i className="bi bi-box-arrow-up" style={{ fontSize: "18px" }} />
              </button>
            </NavLink>
          </div>
        </div>
      </header>

      {/* Content area */}
      <main style={{ flex: 1, overflow: "auto", padding: "24px 0" }}>
        <div className="container-fluid px-3 px-md-4">
          {/* Desktop table view */}
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
                  <div className="spinner-border" style={{ color: COLORS.primary }} role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <div className="mt-3 text-dark" style={{ fontWeight: 500, fontSize: "15px" }}>
                    Fetching your items...
                  </div>
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-5">
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle mb-4 mx-auto"
                    style={{
                      width: "80px",
                      height: "80px",
                      background: "rgba(18, 52, 88, 0.08)",
                      color: COLORS.primary,
                    }}
                  >
                    <i className="bi bi-inbox" style={{ fontSize: "2.5rem" }} />
                  </div>
                  <h5 style={{ color: COLORS.text, fontWeight: "700", marginBottom: "8px" }}>
                    No items found yet
                  </h5>
                  <p style={{ color: COLORS.lightText, marginBottom: "20px", fontSize: "14px" }}>
                    Start by depositing your first item to get started with WraPTrack.
                  </p>
                  <NavLink to="/user/deposit" className="text-decoration-none">
                    <button
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
                      <i className="bi bi-camera me-2" /> Scan Your First Item
                    </button>
                  </NavLink>
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
                        <th style={{ padding: "14px 16px", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", width: "150px", textAlign: "center" }}>
                          Status
                        </th>
                        <th style={{ padding: "14px 16px", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", width: "180px", textAlign: "center" }}>
                          Penalty
                        </th>
                        <th style={{ padding: "14px 16px", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", width: "80px", textAlign: "center" }}>
                          Actions
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
                                marginBottom: "4px",
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
                                minWidth: "100px",
                              }}
                            >
                              {item.status === "Pending Verification" ? "⏳ Pending" : item.status}
                            </span>
                          </td>

                          <td style={{ padding: "14px 16px", textAlign: "center" }}>
                            {(() => {
                              const penaltyInfo = getPenaltyInfo(item.status, item.createdAt, item.penalty);
                              return (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "6px",
                                    color: penaltyInfo.color,
                                    fontWeight: 500,
                                    fontSize: "13px",
                                  }}
                                >
                                  <span>{penaltyInfo.icon}</span>
                                  <span>{penaltyInfo.text}</span>
                                </div>
                              );
                            })()}
                          </td>

                          <td style={{ padding: "14px 16px", textAlign: "center" }}>
                            <button
                              className="btn btn-sm"
                              style={{
                                border: "none",
                                background: "#FEE2E2",
                                color: COLORS.delete,
                                borderRadius: "6px",
                                padding: "6px 8px",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                              }}
                              onClick={() => openConfirm(item._id)}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = COLORS.delete;
                                e.currentTarget.style.color = "#fff";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "#FEE2E2";
                                e.currentTarget.style.color = COLORS.delete;
                              }}
                              aria-label="Archive item"
                            >
                              <i className="bi bi-archive" />
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

          {/* Mobile stacked cards */}
          <div className="d-block d-md-none">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border" style={{ color: COLORS.primary }} role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <div className="mt-3 text-dark" style={{ fontWeight: 500 }}>Fetching your items...</div>
              </div>
            ) : items.length === 0 ? (
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
                  <i className="bi bi-inbox" style={{ fontSize: "2rem" }} />
                </div>
                <h5 style={{ color: COLORS.text, fontWeight: "700" }}>No items found</h5>
                <p className="text-muted small mb-4 px-3">
                  You haven't deposited any items yet. Scan to deposit an item to get started.
                </p>
                <NavLink to="/user/deposit" className="text-decoration-none">
                  <button
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
                    <i className="bi bi-camera me-2" /> Scan Item
                  </button>
                </NavLink>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3 px-2">
                {items.map((item) => {
                  const isExpanded = expandedItemId === item._id;
                  const penaltyInfo = getPenaltyInfo(item.status, item.createdAt, item.penalty);
                  return (
                    <div
                      key={item._id}
                      ref={(el) => (cardsRef.current[item._id] = el)}
                      style={{
                        background: COLORS.surface,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: "10px",
                        overflow: "hidden",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                      }}
                    >
                      {/* Card Header */}
                      <div style={{ display: "flex", gap: "12px", padding: "12px" }}>
                        {/* Image */}
                        <div
                          style={{
                            width: 90,
                            height: 90,
                            overflow: "hidden",
                            cursor: "pointer",
                            flex: "0 0 90px",
                            borderRadius: "8px",
                          }}
                          onClick={() => setSelectedImage(item.photoUrl || "/logo.png")}
                        >
                          <img
                            src={item.photoUrl || "/logo.png"}
                            alt="item"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                          <div>
                            {/* Description */}
                            <div
                              style={{
                                fontWeight: 600,
                                color: COLORS.text,
                                fontSize: "14px",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                marginBottom: "4px",
                                wordBreak: "break-word",
                              }}
                              title={item.description}
                            >
                              {item.description || "No description"}
                            </div>

                            {/* Date/Time */}
                            <div style={{ color: COLORS.muted, fontSize: "12px", marginBottom: "6px" }}>
                              {formatDate(item.createdAt)} • {formatTime(item.createdAt)}
                            </div>
                          </div>

                          {/* Status Badge & Actions Row */}
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "space-between" }}>
                            {/* Status Badge */}
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "4px 8px",
                                borderRadius: "5px",
                                background: COLORS.status[item.status] || COLORS.status.Deposited,
                                border: `1.5px solid ${COLORS.statusBorder[item.status] || COLORS.statusBorder.Deposited}`,
                                color: COLORS.statusText[item.status] || COLORS.statusText.Deposited,
                                fontWeight: 600,
                                fontSize: "11px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {item.status === "Pending Verification" ? "⏳ Pending" : item.status}
                            </span>

                            {/* Action Buttons */}
                            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                              {/* Show/Hide Details */}
                              <button
                                style={{
                                  border: "none",
                                  background: "transparent",
                                  color: COLORS.primary,
                                  borderRadius: "5px",
                                  padding: "5px 6px",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                  fontWeight: 500,
                                  transition: "all 0.2s ease",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                                onClick={() => handleViewDetails(item._id)}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "rgba(18, 52, 88, 0.08)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "transparent";
                                }}
                              >
                                <i className={`bi ${isExpanded ? "bi-chevron-up" : "bi-chevron-down"}`} style={{ fontSize: "16px" }} />
                              </button>

                              {/* Archive Button */}
                              <button
                                style={{
                                  border: "none",
                                  background: "#FEE2E2",
                                  color: COLORS.delete,
                                  borderRadius: "5px",
                                  padding: "5px 6px",
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                                onClick={() => openConfirm(item._id)}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = COLORS.delete;
                                  e.currentTarget.style.color = "#fff";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "#FEE2E2";
                                  e.currentTarget.style.color = COLORS.delete;
                                }}
                              >
                                <i className="bi bi-archive" style={{ fontSize: "16px" }} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: "12px", background: "#FAFAFA" }}>
                          <p style={{ margin: "0 0 10px 0", color: COLORS.text, fontSize: "13px", fontWeight: 500 }}>
                            <strong>Owner:</strong> {item.userId?.firstname || user?.firstname} {item.userId?.lastname || user?.lastname}
                          </p>
                          <p
                            style={{
                              margin: "0",
                              color: penaltyInfo.color,
                              fontSize: "13px",
                              fontWeight: 500,
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <span>{penaltyInfo.icon}</span>
                            <span>{penaltyInfo.text}</span>
                          </p>
                        </div>
                      )}
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

      {/* CONFIRM MODAL */}
      {confirmOpen && (
        <>
          <div
            className="modal-backdrop show"
            onClick={closeConfirm}
            style={{ zIndex: 5000, background: "rgba(0,0,0,0.5)" }}
          />
          <div className="modal d-block" style={{ zIndex: 6000 }}>
            <div className="modal-dialog modal-sm modal-dialog-centered">
              <div
                className="modal-content"
                style={{
                  border: "none",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
                }}
              >
                <div
                  className="modal-header"
                  style={{
                    borderBottom: "none",
                    paddingBottom: 0,
                    background: "#FFEBEE",
                  }}
                >
                  <h6 className="modal-title" style={{ fontWeight: 700, color: COLORS.delete, fontSize: "16px" }}>
                    <i className="bi bi-exclamation-circle me-2" /> Archive Item
                  </h6>
                </div>
                <div className="modal-body pt-3 pb-4">
                  <p style={{ fontSize: "14px", color: COLORS.text, margin: 0 }}>
                    Are you sure you want to archive this item? You can find it in your archived items later.
                  </p>
                </div>
                <div
                  className="modal-footer"
                  style={{
                    borderTop: `1px solid ${COLORS.border}`,
                    background: "#FAFAFA",
                    gap: "8px",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={closeConfirm}
                    style={{
                      border: `1px solid ${COLORS.border}`,
                      background: COLORS.surface,
                      color: COLORS.text,
                      fontWeight: 500,
                      borderRadius: "6px",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{
                      background: COLORS.delete,
                      color: "#fff",
                      fontWeight: 600,
                      borderRadius: "6px",
                      border: "none",
                    }}
                    onClick={confirmArchive}
                  >
                    Archive Item
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* TOAST SYSTEM */}
      {toast.show && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            padding: "12px 16px",
            borderRadius: "8px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            zIndex: 7000,
            fontWeight: 500,
            fontSize: "14px",
            color: "#fff",
            background: toast.type === "success" ? "#4BB543" : "#F08080",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            animation: "fadeInUp 0.3s ease-out",
          }}
          role="alert"
        >
          <i className={`bi ${toast.type === "success" ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill"}`} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Footer */}
      <footer
        style={{
          background: COLORS.header,
          color: COLORS.headerText,
          borderTop: `1px solid ${COLORS.border}`,
          padding: "12px 24px",
          marginTop: "auto",
        }}
      >
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <small style={{ fontWeight: 700, fontSize: "14px" }}>WraPTrack</small>
          <small style={{ fontSize: "13px", opacity: 0.85 }}>
            © 2025 — {user?.firstname ? `${user.firstname}'s Items` : "WraPTrack"}
          </small>
        </div>
      </footer>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
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

export default UserHomePage;
