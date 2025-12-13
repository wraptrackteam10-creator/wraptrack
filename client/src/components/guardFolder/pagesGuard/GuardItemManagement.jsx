import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiOutlineTrash } from "react-icons/hi";
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import { FaRegCalendarAlt, FaFilePdf } from "react-icons/fa";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import { BsSearch } from "react-icons/bs";
import jsPDF from "jspdf";
import "bootstrap/dist/css/bootstrap.min.css";

function GuardItemManagement() {
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const [items, setItems] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmMode, setConfirmMode] = useState(null); // "verify" | "delete" | "download"
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [loadingItems, setLoadingItems] = useState(true);

  const guardInfo = JSON.parse(localStorage.getItem("user")) || {};
  const guardId = guardInfo.id;
  const guardName = `${guardInfo.firstname || ""} ${guardInfo.lastname || ""}`.trim();

  const showToast = (message, type = "success", duration = 3000) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), duration);
  };

  const goBack = () => navigate(-1);

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/settings`);
        const data = await res.json();
        setSettings(data);
      } catch {
        showToast("Failed to fetch settings", "danger");
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchSettings();
  }, [API_BASE_URL]);

  // Fetch items
  useEffect(() => {
    const fetchItems = async () => {
      setLoadingItems(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/items`);
        const data = await res.json();
        if (res.ok) setItems(data);
      } catch {
        showToast("Failed to fetch items", "danger");
      } finally {
        setLoadingItems(false);
      }
    };
    fetchItems();
  }, [API_BASE_URL]);

  // Confirm modal controls
  const openConfirm = (item, mode) => {
    setConfirmTarget(item || null);
    setConfirmMode(mode);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setConfirmTarget(null);
    setConfirmMode(null);
  };

  const handleConfirm = async () => {
    if (!confirmMode) return;

    try {
      if (confirmMode === "verify" && confirmTarget) {
        const res = await fetch(`${API_BASE_URL}/api/items/${confirmTarget._id}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Claimed", guardId, guardName }),
        });
        if (!res.ok) throw new Error("Failed to verify item");

        setItems((prev) =>
          prev.map((it) => (it._id === confirmTarget._id ? { ...it, status: "Claimed", claimedAt: new Date().toISOString() } : it))
        );
        showToast("Item verified", "success");
      } else if (confirmMode === "delete" && confirmTarget) {
        const res = await fetch(`${API_BASE_URL}/api/items/${confirmTarget._id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Delete failed");

        setItems((prev) => prev.filter((it) => it._id !== confirmTarget._id));
        showToast("Item deleted", "success");
      } else if (confirmMode === "download") {
        downloadPDF();
      }
    } catch {
      showToast(`Failed to ${confirmMode}`, "danger");
    } finally {
      closeConfirm();
    }
  };

  // Download PDF (simple listing)
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Guard Items Report", 10, 15);
    let y = 25;
    filteredItems.forEach((item, index) => {
      doc.setFontSize(12);
      doc.text(`${index + 1}. ${item.userId?.firstname || ""} ${item.userId?.lastname || ""}`, 10, y);
      doc.setFontSize(10);
      doc.text(`Status: ${item.status} - Penalty: ${item.penaltyPoints || 0}P`, 10, y + 6);
      const descLines = doc.splitTextToSize(`Description: ${item.description || "-"}`, 180);
      doc.text(descLines, 10, y + 12);
      y += 12 + descLines.length * 5;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
    doc.save("guard_items.pdf");
  };

  const formatDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Filters
  const filteredItems = items.filter((item) => {
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    const matchesDate = !dateFilter || new Date(item.createdAt).toISOString().slice(0, 10) === dateFilter;
    const matchesSearch =
      !searchQuery ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.userId?.firstname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.userId?.lastname?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesDate && matchesSearch;
  });

  // Guard access disabled
  if (!loadingSettings && !settings?.guardAccess) {
    return (
      <div className="text-center mt-5">
        <h4 style={{ color: "#123458" }}>🚫 Guard access disabled</h4>
        <button className="btn mt-3" style={{ background: "#123458", color: "#F1EFEC" }} onClick={goBack}>
          Go Back
        </button>
      </div>
    );
  }

  // --- RENDER ---
  // IMPORTANT: use height: "100%" so the parent (DashboardGuard) controls the page height.
  // The scrollable areas are the mobile list and the desktop table container (they use overflow:auto)
  return (
    <div className="d-flex flex-column" style={{ height: "100%", backgroundColor: "#F1EFEC", color: "#030303" }}>
      {/* Header / filters (shared) */}
      <div className="sticky-top bg-white border-bottom" style={{ zIndex: 1020 }}>
        <div className="container-fluid p-2">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-7 d-flex gap-2 align-items-center flex-wrap">
              <button
                className="btn d-inline-flex align-items-center justify-content-center"
                style={{ background: "#123458", color: "#F1EFEC", minWidth: 42, height: "37px" }}
                onClick={() => document.getElementById("filterDate")?.showPicker?.()}
                aria-label="Open date picker"
                title="Select date"
              >
                <FaRegCalendarAlt />
              </button>

              {/* Date input with visible label/placeholder on mobile */}
              <div style={{ position: "relative", minWidth: 150 }}>
                <input
                  id="filterDate"
                  type="date"
                  className="form-control"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  style={{ maxWidth: 150, border: "1px solid #D4C9BE" }}
                  aria-label="Filter by date"
                />
                
              </div>

              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ maxWidth: 195, border: "1px solid #D4C9BE" }}
                aria-label="Filter by status"
              >
                {["All", "Deposited", "Claimed", "Unclaimed"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-5 d-flex gap-2 justify-content-start justify-content-md-end">
              <div style={{ position: "relative", width: "100%" }}>
                <BsSearch
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "10px",
                    transform: "translateY(-50%)",
                    color: "#6b6b6b",
                    pointerEvents: "none",
                  }}
                />

                <input
                  type="text"
                  className="form-control"
                  placeholder="Search items"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search items"
                  style={{
                    paddingLeft: "32px", // space for icon
                    border: "1px solid #D4C9BE",
                    minWidth: 0,
                  }}
                />
              </div>
              <button
                className="btn d-inline-flex align-items-center justify-content-center"
                style={{ background: filteredItems.length > 0 ? "#123458" : "#D4C9BE", color: "#F1EFEC", minWidth: 44 }}
                disabled={filteredItems.length === 0}
                onClick={() => openConfirm(null, "download")}
                aria-label="Download PDF"
                title={filteredItems.length > 0 ? "Download PDF" : "No items to download"}
              >
                <FaFilePdf />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT AREA: make the content take available space */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        {/* MOBILE: card list (keeps your mobile look) */}
        <div className="d-md-none p-2" style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          {loadingItems ? (
            <div className="text-center mt-5" style={{ color: "#123458", fontWeight: 500 }}>⏳ Loading items...</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center mt-5" style={{ color: "#123458", fontWeight: 500 }}>
              {items.length === 0 ? "📦 No items currently deposited" : "🔍 No items matched your filter/search"}
            </div>
          ) : (
            filteredItems.map((item) => {
              const isExpanded = expandedId === item._id;
              const statusColor =
                item.status === "Deposited" ? "#D4C9BE" :
                item.status === "Claimed" ? "#90EE90" :
                item.status === "Unclaimed" ? "#F08080" : "#FFD700";

              return (
                <div key={item._id} className="rounded p-3 mb-2 shadow-sm" style={{ background: "#FFFFFF", border: "1px solid #D4C9BE" }}>
                  <div className="d-flex">
                    <img
                      src={item.photoUrl || "/logo.png"}
                      alt=""
                      style={{ width: 70, height: 70, borderRadius: 8, objectFit: "cover", marginRight: 10, border: "1px solid #D4C9BE", cursor: "pointer" }}
                      onClick={() => setFullscreenImage(item.photoUrl || "/logo.png")}
                    />
                    <div className="flex-grow-1 d-flex flex-column justify-content-between">
                      <div className="d-flex justify-content-between align-items-center w-100">
                        <div className="d-flex align-items-center gap-2">
                          <h6 className="mb-0">{item.userId?.firstname} {item.userId?.lastname}</h6>
                          <small style={{ color: item.penaltyPoints > 0 ? "red" : "#D4C9BE", fontWeight: item.penaltyPoints > 0 ? "bold" : "normal" }}>
                            {item.penaltyPoints || 0}P
                          </small>
                        </div>
                        <button className="btn btn-sm d-flex align-items-center justify-content-center" style={{ color: "#123458" }} onClick={() => setExpandedId(isExpanded ? null : item._id)}>
                          {isExpanded ? <IoIosArrowDown size={20} /> : <MdOutlineKeyboardArrowRight size={20} />}
                        </button>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mt-2">
                        <button className="btn btn-sm" style={{ background: statusColor, color: item.status === "Unclaimed" ? "white" : "#030303", border: "1px solid #D4C9BE" }}>
                          {item.status}
                        </button>

                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm"
                            style={{ background: "#123458", color: "#F1EFEC", opacity: item.status === "Claimed" ? 0.7 : 1 }}
                            disabled={item.status === "Claimed"}
                            onClick={() => openConfirm(item, "verify")}
                          >
                            <IoCheckmarkCircleOutline /> Verify
                          </button>

                          <button className="btn btn-sm btn-outline-danger" onClick={() => openConfirm(item, "delete")} style={{ border: "1px solid #D4C9BE" }}>
                            <HiOutlineTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-2 pt-2 border-top" style={{ borderColor: "#D4C9BE" }}>
                      <p className="mb-1">{item.description}</p>
                      <small className="text-muted">{formatDate(item.createdAt)}</small>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* DESKTOP: table (table-like, clean UI) */}
        <div className="d-none d-md-block p-2 container-fluid" style={{ flex: 1, minHeight: 0 }}>
          {loadingItems ? (
            <div className="text-center mt-5" style={{ color: "#123458", fontWeight: 500 }}>⏳ Loading items...</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center mt-5" style={{ color: "#123458", fontWeight: 500 }}>
              {items.length === 0 ? "📦 No items currently deposited" : "🔍 No items matched your filter/search"}
            </div>
          ) : (
            // The table area itself becomes scrollable (only this area).
            <div className="table-responsive" style={{ height: "100%", overflowY: "auto", background: "#FFFFFF", border: "1px solid #D4C9BE" }}>
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 80 }} className="text-center">Photo</th>
                    <th>User</th>
                    <th>Description</th>
                    <th style={{ width: 140 }}>Date</th>
                    <th style={{ width: 120 }} className="text-center">Status</th>
                    <th style={{ width: 100 }} className="text-center">Penalty</th>
                    <th style={{ width: 210 }} className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const statusColor =
                      item.status === "Deposited" ? "#D4C9BE" :
                      item.status === "Claimed" ? "#90EE90" :
                      item.status === "Unclaimed" ? "#F08080" : "#FFD700";

                    return (
                      <tr key={item._id}>
                        <td className="text-center">
                          <img
                            src={item.photoUrl || "/logo.png"}
                            alt={`${item.userId?.firstname || ""}`}
                            style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6, cursor: "pointer", border: "1px solid #D4C9BE" }}
                            onClick={() => setFullscreenImage(item.photoUrl || "/logo.png")}
                          />
                        </td>

                        <td>
                          <div style={{ fontWeight: 600 }}>{`${item.userId?.firstname || ""} ${item.userId?.lastname || ""}`}</div>
                          <div className="text-muted" style={{ fontSize: ".85rem" }}>{item.userId?.email || ""}</div>
                        </td>

                        <td style={{ wordBreak: "break-word", maxWidth: 360 }}>{item.description || "-"}</td>

                        <td><small className="text-muted">{formatDate(item.createdAt)}</small></td>

                        <td className="text-center">
                          <span className="badge" style={{ background: statusColor, color: item.status === "Unclaimed" ? "#fff" : "#000" }}>
                            {item.status}
                          </span>
                        </td>

                        <td className="text-center">
                          <small style={{ color: item.penaltyPoints > 0 ? "red" : "#6c757d", fontWeight: item.penaltyPoints > 0 ? 700 : 400 }}>
                            {item.penaltyPoints || 0}P
                          </small>
                        </td>

                        <td className="text-center">
                          <div className="d-flex justify-content-center gap-2">
                            <button
                              className="btn btn-sm"
                              style={{ background: "#123458", color: "#F1EFEC", minWidth: 84 }}
                              disabled={item.status === "Claimed"}
                              onClick={() => openConfirm(item, "verify")}
                              title={item.status === "Claimed" ? "Already verified" : "Verify"}
                            >
                              <IoCheckmarkCircleOutline /> <span className="ms-1">Verify</span>
                            </button>

                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => openConfirm(item, "delete")}
                              style={{ border: "1px solid #D4C9BE", minWidth: 56 }}
                              title="Delete"
                            >
                              <HiOutlineTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* FULL IMAGE LIGHTBOX */}
      {fullscreenImage && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex justify-content-center align-items-center"
          style={{ zIndex: 5000 }}
          onClick={() => setFullscreenImage(null)}
          role="dialog"
          aria-modal="true"
        >
          <img src={fullscreenImage} alt="full" style={{ maxWidth: "92%", maxHeight: "92%" }} />
        </div>
      )}

      {/* CONFIRM MODAL */}
      {confirmOpen && (
        <>
          <div className="modal-backdrop show" onClick={closeConfirm} style={{ zIndex: 5000 }} />
          <div className="modal d-block" style={{ zIndex: 6000 }}>
            <div className="modal-dialog modal-sm modal-dialog-centered">
              <div className="modal-content" style={{ border: "1px solid #D4C9BE" }}>
                <div className="modal-header">
                  <h6 className="modal-title">
                    {confirmMode === "verify" ? "Confirm Verification" : confirmMode === "delete" ? "Confirm Delete" : "Confirm Download"}
                  </h6>
                  <button className="btn-close" onClick={closeConfirm} />
                </div>

                <div className="text-muted p-3">
                  <p>
                    {confirmMode === "verify"
                      ? "Are you sure you want to verify this item?"
                      : confirmMode === "delete"
                      ? "Are you sure you want to delete this item?"
                      : "Do you want to download the PDF report?"}
                  </p>
                </div>

                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={closeConfirm}>No</button>
                  <button className="btn" style={{ background: "#123458", color: "#F1EFEC" }} onClick={handleConfirm}>Yes</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* TOAST */}
      {toast.show && (
        <div
          className="position-fixed bottom-0 end-0 m-3 p-3 rounded shadow text-muted"
          style={{
            background: toast.type === "success" ? "#90EE90" : toast.type === "danger" ? "#F08080" : "#D4C9BE",
            color: "#030303",
            minWidth: 250,
            zIndex: 4000,
          }}
          role="status"
          aria-live="polite"
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default GuardItemManagement;