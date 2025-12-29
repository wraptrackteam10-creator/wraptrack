import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { LuArchiveX } from "react-icons/lu";
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import { FaRegCalendarAlt, FaFilePdf } from "react-icons/fa";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { CiFilter } from "react-icons/ci";
import { MdOutlineKeyboardArrowRight, MdClear } from "react-icons/md";
import { BsSearch } from "react-icons/bs";
import jsPDF from "jspdf";
import "bootstrap/dist/css/bootstrap.min.css";
import FilterPanel from "./FilterPanel";

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
  const [confirmMode, setConfirmMode] = useState(null); // "verify" | "archive" | "download"
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [loadingItems, setLoadingItems] = useState(true);

  // Advanced filter state
  const [advancedFilters, setAdvancedFilters] = useState({
    name: "",
    descriptions: [],
    penaltyMode: "any", // any | penalty | no-penalty
    penaltyMin: "",
    penaltyMax: "",
    archived: false, // NEW: archived toggle
  });
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  // Ref for filter button container to position the floating panel
  const filterContainerRef = useRef(null);

  // Selection for archived items
  const [selectedArchivedIds, setSelectedArchivedIds] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

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
      } else if (confirmMode === "archive" && confirmTarget) {
        const res = await fetch(
          `${API_BASE_URL}/api/items/${confirmTarget._id}/action`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "Archive" }),
          }
        );

        if (!res.ok) throw new Error("Archive failed");

        const data = await res.json().catch(() => ({}));
        const updated = data.item || data || { ...confirmTarget, archivedAt: new Date().toISOString() };

        setItems((prev) =>
          prev.map((it) =>
            it._id === confirmTarget._id
              ? {
                  ...it,                 // KEEP populated userId
                  archivedAt: updated.archivedAt || new Date().toISOString(),
                  archivedBy: updated.archivedBy || guardId,
                  action: "Archive",
                }
              : it
          )
        );

        showToast("Item archived", "success");
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
      doc.text(`Status: ${item.status} - Penalty: ${item.penalty || 0}P`, 10, y + 6);
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

  // Apply advanced filters coming from FilterPanel
  const handleApplyAdvancedFilters = (filters) => {
    setAdvancedFilters(filters);
    // clear archived selection when toggling archived mode
    setSelectedArchivedIds([]);
  };

  const handleClearAdvancedFilters = () => {
    setAdvancedFilters({
      name: "",
      descriptions: [],
      penaltyMode: "any",
      penaltyMin: "",
      penaltyMax: "",
      archived: false,
    });
    setSelectedArchivedIds([]);
  };

  // Clear all filters (date, status, search, advanced)
  const handleClearAll = () => {
    setDateFilter("");
    setStatusFilter("All");
    setSearchQuery("");
    handleClearAdvancedFilters();
    showToast("Filters cleared", "success");
  };

  // Visible set: when archived toggle is on, show only archived items (archivedAt truthy), otherwise show non-archived
  const visibleItems = items.filter((item) =>
    advancedFilters.archived ? Boolean(item.archivedAt) : !item.archivedAt
  );

  // Filters
  const filteredItems = visibleItems.filter((item) => {
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;

    // date filter: when archived view is ON, compare archivedAt; else compare createdAt
    const dateToCompare = advancedFilters.archived && item.archivedAt ? item.archivedAt : item.createdAt;
    const matchesDate = !dateFilter || (dateToCompare && new Date(dateToCompare).toISOString().slice(0, 10) === dateFilter);

    const matchesSearch =
      !searchQuery ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.userId?.firstname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.userId?.lastname?.toLowerCase().includes(searchQuery.toLowerCase());

    // advanced filters
    const { name, descriptions, penaltyMode, penaltyMin, penaltyMax } = advancedFilters;

    const matchesName =
      !name ||
      item.userId?.firstname?.toLowerCase().includes(name.toLowerCase()) ||
      item.userId?.lastname?.toLowerCase().includes(name.toLowerCase());

    const matchesDescriptions =
      !descriptions || descriptions.length === 0
        ? true
        : descriptions.some((d) => (item.description || "").toLowerCase().includes(d.toLowerCase()));

    const pp = Number(item.penalty || 0);

    let matchesPenaltyMode = true;
    if (penaltyMode === "penalty") matchesPenaltyMode = pp > 0;
    else if (penaltyMode === "no-penalty") matchesPenaltyMode = pp === 0;

    let matchesPenaltyRange = true;
    if (penaltyMin !== "" && !Number.isNaN(Number(penaltyMin))) matchesPenaltyRange = matchesPenaltyRange && pp >= Number(penaltyMin);
    if (penaltyMax !== "" && !Number.isNaN(Number(penaltyMax))) matchesPenaltyRange = matchesPenaltyRange && pp <= Number(penaltyMax);

    return matchesStatus && matchesDate && matchesSearch && matchesName && matchesDescriptions && matchesPenaltyMode && matchesPenaltyRange;
  });

  const activeFilterCount = (() => {
    let count = 0;

    // basic filters
    if (dateFilter) count++;
    if (statusFilter !== "All") count++;
    if (searchQuery.trim()) count++;

    // advanced filters
    if (advancedFilters.name) count++;
    if (advancedFilters.descriptions?.length)
      count += advancedFilters.descriptions.length;

    if (advancedFilters.penaltyMode && advancedFilters.penaltyMode !== "any")
      count++;

    if (advancedFilters.penaltyMin !== "") count++;
    if (advancedFilters.penaltyMax !== "") count++;

    if (advancedFilters.archived) count++;

      return count;
    })();

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

  /* ---------- UNARCHIVE single + bulk ---------- */
  const tryUnarchiveEndpoint = async (id) => {
    // Try /unarchive first, fallback to action Unarchive
    try {
      const res = await fetch(`${API_BASE_URL}/api/items/${id}/unarchive`, { method: "PATCH" });
      if (res.ok) {
        const updated = await res.json();
        return { ok: true, updated };
      }
    } catch (e) {
      // ignore and try fallback
    }

    try {
      const res2 = await fetch(`${API_BASE_URL}/api/items/${id}/action`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "Unarchive" }),
      });
      if (res2.ok) {
        const data = await res2.json();
        const updated = data.item || data;
        return { ok: true, updated };
      } else {
        const err = await res2.json().catch(() => ({}));
        return { ok: false, error: err.error || "Unarchive failed" };
      }
    } catch (e) {
      return { ok: false, error: "Unarchive failed" };
    }
  };

  const performUnarchive = async (id) => {
    const result = await tryUnarchiveEndpoint(id);
    if (result.ok) {
      setItems((prev) => prev.map((it) => (it._id === result.updated._id ? result.updated : it)));
      showToast("Item restored", "success");
      // ensure selection cleared
      setSelectedArchivedIds((prev) => prev.filter((x) => x !== id));
      return true;
    } else {
      showToast(result.error || "Unarchive failed", "danger");
      return false;
    }
  };

  const unarchiveSelected = async () => {
    if (selectedArchivedIds.length === 0) return;
    setBulkActionLoading(true);
    const ids = [...selectedArchivedIds];
    try {
      const results = await Promise.all(ids.map((id) => tryUnarchiveEndpoint(id)));
      // apply successful updates
      setItems((prev) =>
        prev.map((it) => {
          const r = results.find((res, idx) => res.ok && ids[idx] === it._id);
          if (r && r.ok) return r.updated;
          return it;
        })
      );

      const failed = results.filter((r) => !r.ok);
      if (failed.length === 0) {
        showToast(`Unarchived ${ids.length} item(s)`, "success");
      } else {
        showToast(`${failed.length} item(s) failed to unarchive`, "danger");
      }
    } catch {
      showToast("Bulk unarchive failed", "danger");
    } finally {
      setSelectedArchivedIds([]);
      setBulkActionLoading(false);
    }
  };

  /* ---------- Selection helpers for archived items ---------- */
  const toggleSelectArchived = (id) => {
    setSelectedArchivedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const ids = filteredItems.map((u) => u._id);
    if (ids.length === 0) return;
    const allSelected = ids.every((id) => selectedArchivedIds.includes(id));
    if (allSelected) setSelectedArchivedIds([]);
    else setSelectedArchivedIds(ids);
  };

  const isAllSelected = () => {
    const ids = filteredItems.map((u) => u._id);
    return ids.length > 0 && ids.every((id) => selectedArchivedIds.includes(id));
  };

  const getLastUpdated = () =>
    items.length
      ? Math.max(...items.map((i) => new Date(advancedFilters.archived ? (i.archivedAt || i.updatedAt || i.createdAt) : (i.updatedAt || i.createdAt))))
      : new Date();

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

              <div ref={filterContainerRef} style={{ position: "relative" }}>
                <button
                  className="form-control btn d-inline-flex align-items-center justify-content-center"
                  onClick={() => setFilterPanelOpen((v) => !v)}
                  aria-expanded={filterPanelOpen}
                  aria-label="Open advanced filter"
                  title="Advanced filters"
                  style={{
                    border: activeFilterCount > 0 ? "2px solid #123458" : "1px solid #D4C9BE",
                    color: activeFilterCount > 0 ? "#123458" : "#030303",
                    fontWeight: activeFilterCount > 0 ? 600 : 400,
                  }}
                >
                  <CiFilter />
                  <span className="ms-1">
                    Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                  </span>
                </button>

                <FilterPanel
                  show={filterPanelOpen}
                  onClose={() => setFilterPanelOpen(false)}
                  onApply={handleApplyAdvancedFilters}
                  onClear={() => {
                    handleClearAdvancedFilters();
                    showToast("Advanced filters cleared", "success");
                  }}
                  initialFilters={advancedFilters}
                  anchorRef={filterContainerRef}
                />
              </div>

              <div>
                <button 
                  className="form-control btn d-inline-flex align-items-center justify-content-center" 
                  onClick={handleClearAll} 
                  style={{ border: "1px solid #D4C9BE" }}
                >
                  Clear
                </button>
              </div>
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
                  placeholder="Search"
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

              {/* When archived mode is ON show Unarchive selected button */}
              {advancedFilters.archived && (
                <div className="d-flex align-items-center gap-2">
                  <div className="small text-muted me-2">{selectedArchivedIds.length} selected</div>
                  <button
                    className="btn d-inline-flex align-items-center justify-content-center"
                    style={{ background: selectedArchivedIds.length > 0 ? "#123458" : "#D4C9BE", color: "#F1EFEC", minWidth: 44 }}
                    disabled={selectedArchivedIds.length === 0 || bulkActionLoading}
                    onClick={unarchiveSelected}
                    title="Unarchive selected"
                  >
                    Unarchive
                  </button>
                </div>
              )}

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
            filteredItems.map((item, idx) => {
              const isExpanded = expandedId === item._id;
              const statusColor =
                item.status === "Deposited" ? "#D4C9BE" :
                item.status === "Claimed" ? "#90EE90" :
                item.status === "Unclaimed" ? "#F08080" : "#FFD700";

              return (
                <div key={item._id} className="rounded p-3 mb-2 shadow-sm" style={{ background: "#FFFFFF", border: "1px solid #D4C9BE" }}>
                  <div className="d-flex">
                    <div style={{ marginRight: 10 }}>
                      {advancedFilters.archived && (
                        <input
                          type="checkbox"
                          checked={selectedArchivedIds.includes(item._id)}
                          onChange={() => toggleSelectArchived(item._id)}
                          aria-label={`Select archived item ${item.description}`}
                        />
                      )}
                    </div>

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
                        </div>
                        <div className="d-flex align-items-center" style={{gap: "3px"}}> 
                          <small style={{ color: item.penalty > 0 ? "red" : "#D4C9BE", fontWeight: item.penalty > 0 ? "bold" : "normal", backgroundColor: item.penalty > 0 ? "#ffe5e5" : "transparent", padding: "2px 6px", borderRadius: 4, border: item.penalty > 0 ? "1px solid red" : "none" }}>
                            {item.penalty || 0}P
                          </small>
                          <button className="btn btn-sm d-flex align-items-center justify-content-center" style={{ color: "#123458" }} onClick={() => setExpandedId(isExpanded ? null : item._id)}>
                            {isExpanded ? <IoIosArrowDown size={20} /> : <MdOutlineKeyboardArrowRight size={20} />}
                          </button>
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mt-2">
                        <button className="btn btn-sm" style={{ background: statusColor, color: item.status === "Unclaimed" ? "white" : "#030303", border: "1px solid #D4C9BE" }}>
                          {item.status}
                        </button>

                        <div className="d-flex gap-2">
                          {advancedFilters.archived ? (
                            <button
                              className="btn btn-sm"
                              style={{ border: "1px solid #123458", color: "#123458" }}
                              onClick={() => performUnarchive(item._id)}
                            >
                              Unarchive
                            </button>
                          ) : (
                            <>
                              <button
                                className="btn btn-sm"
                                style={{ background: "#123458", color: "#F1EFEC", opacity: item.status === "Claimed" ? 0.7 : 1 }}
                                disabled={item.status === "Claimed"}
                                onClick={() => openConfirm(item, "verify")}
                              >
                                <IoCheckmarkCircleOutline /> Verify
                              </button>

                              <button className="btn btn-sm btn-outline-danger" onClick={() => openConfirm(item, "archive")} style={{ border: "1px solid #D4C9BE" }}>
                                <LuArchiveX />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-2 pt-2 border-top" style={{ borderColor: "#D4C9BE" }}>
                      <p className="mb-1">{item.description}</p>
                      <small className="text-muted">{formatDate(advancedFilters.archived && item.archivedAt ? item.archivedAt : item.createdAt)}</small>
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
                    <th style={{ width: 48 }} className="text-center">
                      {advancedFilters.archived ? (
                        <input type="checkbox" checked={isAllSelected()} onChange={toggleSelectAll} aria-label="Select all archived items" />
                      ) : "#"}
                    </th>
                    <th style={{ width: 80 }} className="text-center">Photo</th>
                    <th>Owner</th>
                    <th>Description</th>
                    <th style={{ width: 140 }}>{advancedFilters.archived ? "Archived Date" : "Date"}</th>
                    <th style={{ width: 120 }} className="text-center">Status</th>
                    <th style={{ width: 100 }} className="text-center">Penalty</th>
                    <th style={{ width: 210 }} className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, index) => {
                    const statusColor =
                      item.status === "Deposited" ? "#D4C9BE" :
                      item.status === "Claimed" ? "#90EE90" :
                      item.status === "Unclaimed" ? "#F08080" : "#FFD700";

                    return (
                      <tr key={item._id}>
                        <td className="text-center" style={{ verticalAlign: "middle" }}>
                          {advancedFilters.archived ? (
                            <input
                              type="checkbox"
                              checked={selectedArchivedIds.includes(item._id)}
                              onChange={() => toggleSelectArchived(item._id)}
                              aria-label={`Select archived item ${item.description}`}
                            />
                          ) : (
                            index + 1
                          )}
                        </td>

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

                        <td><small className="text-muted">{formatDate(advancedFilters.archived && item.archivedAt ? item.archivedAt : item.createdAt)}</small></td>

                        <td className="text-center">
                          <span className="badge" style={{ background: statusColor, color: item.status === "Unclaimed" ? "#fff" : "#000" }}>
                            {item.status}
                          </span>
                        </td>

                        <td className="text-center">
                          <small style={{ color: item.penalty > 0 ? "red" : "#6c757d", fontWeight: item.penalty > 0 ? 700 : 400,backgroundColor: item.penalty > 0 ? "#ffe5e5" : "transparent", padding: "2px 6px", borderRadius: 4, border: item.penalty > 0 ? "1px solid red" : "none"   }}>
                            {item.penalty || 0}P
                          </small>
                        </td>

                        <td className="text-center">
                          <div className="d-flex justify-content-center gap-2">
                            {advancedFilters.archived ? (
                              <button
                                className="btn btn-sm"
                                style={{ border: "1px solid #123458", color: "#123458", minWidth: 84 }}
                                onClick={() => performUnarchive(item._id)}
                                title="Unarchive item"
                              >
                                Unarchive
                              </button>
                            ) : (
                              <>
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
                                  onClick={() => openConfirm(item, "archive")}
                                  style={{ border: "1px solid #D4C9BE", minWidth: 56 }}
                                  title="Archive item"
                                >
                                  <LuArchiveX />
                                </button>
                              </>
                            )}
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
                    {confirmMode === "verify" ? "Confirm Verification" : confirmMode === "archive" ? "Confirm Archive" : "Confirm Download"}
                  </h6>
                  <button className="btn-close" onClick={closeConfirm} />
                </div>

                <div className="text-muted p-3">
                  <p>
                    {confirmMode === "verify"
                      ? "Are you sure you want to verify this item?"
                      : confirmMode === "archive"
                      ? "Are you sure you want to archive this item?"
                      : "Do you want to download the PDF report?"}
                  </p>
                </div>

                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={closeConfirm}>No</button>
                  <button className="btn" style={{ background: "#123458", color: "#F1EFEC" }} onClick={handleConfirm}>{confirmMode === "archive" ? "Yes, Archive" : "Yes"}</button>
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