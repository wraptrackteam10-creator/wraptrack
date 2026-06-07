// full file — added pagination state, pagination logic, and pagination UI at bottom
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
// import { LuArchiveX } from "react-icons/lu";
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import { FaRegCalendarAlt, FaFilePdf, FaArchive, FaUndo, FaSortDown } from "react-icons/fa";
import { IoIosArrowDown } from "react-icons/io";
import { CiFilter } from "react-icons/ci";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import { BsSearch, BsArrowCounterclockwise } from "react-icons/bs";
import jsPDF from "jspdf";
import "bootstrap/dist/css/bootstrap.min.css";
import FilterPanel from "./FilterPanel";
import { fetchWithAuth } from "../../../utils/fetchWithAuth";

function GuardItemManagement() {
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const [items, setItems] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
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
  const datePickerRef = useRef(null);

  // Selection for archived items
  const [selectedArchivedIds, setSelectedArchivedIds] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // PAGINATION state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, dateFilter, advancedFilters]);

  const guardInfo = JSON.parse(localStorage.getItem("user")) || {};
  const guardId = guardInfo.id;
  const guardName = `${guardInfo.firstname || ""} ${guardInfo.lastname || ""}`.trim();

  // track first load so we only show the full loading UI on initial fetch
  const initialLoadRef = useRef(true);

  const showToast = (message, type = "success", duration = 3000) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), duration);
  };

  const goBack = () => navigate(-1);

  // Fetch settings (once)
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE_URL}/api/settings`, {
          credentials: "include",
        });
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

  /* ---------- helper: shallow-ish equality for items (to avoid re-render churn) ---------- */
  const isSameItem = (a = {}, b = {}) => {
    return (
      a._id === b._id &&
      (a.updatedAt || "") === (b.updatedAt || "") &&
      (a.archivedAt || "") === (b.archivedAt || "") &&
      (a.status || "") === (b.status || "") &&
      Number(a.penalty || 0) === Number(b.penalty || 0) &&
      (a.description || "") === (b.description || "") &&
      (a.firstname || "") === (b.firstname || "") &&
      (a.lastname || "") === (b.lastname || "") &&
      (a.photoUrl || "") === (b.photoUrl || "")
    );
  };

  /**
   * refreshItems now accepts `archived` boolean.
   * When archived === true we call /api/items?archived=true so server returns archived
   * items for the current viewer role (server must support this).
   */
  const refreshItems = async ({ showLoading = false, archived = false } = {}) => {
    if (showLoading || initialLoadRef.current) setLoadingItems(true);
    try {
      const archivedParam = archived ? "?archived=true" : "";
      const url = `${API_BASE_URL}/api/items${archivedParam}`;
      const res = await fetchWithAuth(url, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("Failed to refresh items", "danger");
        return;
      }
      // Merge strategy: keep previous object references when item unchanged to avoid unnecessary rerenders
      setItems((prev) => {
        if (!Array.isArray(data)) return prev;
        const prevById = new Map(prev.map((p) => [p._id, p]));
        let changed = false;
        const merged = data.map((newItem) => {
          const prevItem = prevById.get(newItem._id);
          if (prevItem && isSameItem(prevItem, newItem)) {
            return prevItem; // reuse reference
          } else {
            changed = true;
            return newItem;
          }
        });
        // If nothing changed and lengths equal, keep previous array reference
        if (!changed && merged.length === prev.length) return prev;
        return merged;
      });
    } catch (e) {
      console.error("refreshItems error", e);
      showToast("Failed to refresh items", "danger");
    } finally {
      if (showLoading || initialLoadRef.current) {
        setLoadingItems(false);
        initialLoadRef.current = false;
      }
    }
  };

  // Fetch items on mount and whenever advancedFilters.archived changes.
  // This ensures archived toggle causes a server fetch of archived items.
  useEffect(() => {
    refreshItems({ showLoading: initialLoadRef.current, archived: advancedFilters.archived });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE_URL, advancedFilters.archived]);

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

    const originalItems = [...items]; // cache in case of disconnect

    try {
      if (confirmMode === "verify" && confirmTarget) {
        // optimistic update locally (fast feedback)
        setItems((prev) =>
          prev.map((it) => (it._id === confirmTarget._id ? { ...it, status: "Claimed", claimedAt: new Date().toISOString() } : it))
        );

        const res = await fetchWithAuth(`${API_BASE_URL}/api/items/${confirmTarget._id}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: "Claimed", guardId, guardName }),
        });

        if (!res.ok) {
          // revert by fetching authoritative data (no big loading UI)
          setItems(originalItems);
          await refreshItems({ archived: advancedFilters.archived }).catch(() => {});
          throw new Error("Failed to verify item");
        }

        // reconcile with server without showing the full loading spinner
        await refreshItems({ archived: advancedFilters.archived });
        showToast("Item verified", "success");
      } else if (confirmMode === "archive" && confirmTarget) {
        // optimistic update locally
        setItems((prev) =>
          prev.map((it) =>
            it._id === confirmTarget._id
              ? {
                  ...it,
                  archivedAt: new Date().toISOString(),
                  archivedBy: guardId,
                  action: "Archive",
                }
              : it
          )
        );

        const res = await fetchWithAuth(`${API_BASE_URL}/api/items/${confirmTarget._id}/action`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ action: "Archive" }),
        });

        if (!res.ok) {
          // revert to authoritative state
          setItems(originalItems);
          await refreshItems({ archived: advancedFilters.archived }).catch(() => {});
          throw new Error("Archive failed");
        }

        // reconcile with server
        await refreshItems({ archived: advancedFilters.archived });
        showToast("Item archived", "success");
      } else if (confirmMode === "download") {
        downloadPDF();
      }
    } catch (err) {
      console.error("handleConfirm error", err);
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
      const ownerName =
        (item.userId && `${item.userId.firstname || ""} ${item.userId.lastname || ""}`.trim()) ||
        item.guestName ||
        `${item.firstname || ""} ${item.lastname || ""}`.trim();
      doc.text(`${index + 1}. ${ownerName}`, 10, y);
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
    // Note: useEffect will trigger refreshItems when advancedFilters.archived changes
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
    setFilterPanelOpen(false);
    setStatusDropdownOpen(false);
    showToast("All filters cleared", "success");
  };

  // Visible set: server returns full items (or archived subset when ?archived=true); client decides visible set
  const visibleItems = useMemo(() => {
    return items.filter((item) => (advancedFilters.archived ? Boolean(item.archivedAt) : !item.archivedAt));
  }, [items, advancedFilters.archived]);

  // Filters
  const filteredItems = useMemo(() => {
    return visibleItems.filter((item) => {
      const matchesStatus = statusFilter === "All" || item.status === statusFilter;

      // date filter: when archived view is ON, compare archivedAt; else compare createdAt
      const dateToCompare = advancedFilters.archived && item.archivedAt ? item.archivedAt : item.createdAt;
      const matchesDate = !dateFilter || (dateToCompare && new Date(dateToCompare).toISOString().slice(0, 10) === dateFilter);

      // Build ownerName once (supports guests)
      const ownerName = (
        (item.userId && `${item.userId.firstname || ""} ${item.userId.lastname || ""}`) ||
        item.guestName ||
        `${item.firstname || ""} ${item.lastname || ""}`
      ).toLowerCase();

      const matchesSearch =
        !searchQuery || item.description?.toLowerCase().includes(searchQuery.toLowerCase()) || ownerName.includes(searchQuery.toLowerCase());

      // advanced filters
      const { name, descriptions, penaltyMode, penaltyMin, penaltyMax } = advancedFilters;

      const matchesName = !name || ownerName.includes(name.toLowerCase());

      const matchesDescriptions =
        !descriptions || descriptions.length === 0 ? true : descriptions.some((d) => (item.description || "").toLowerCase().includes(d.toLowerCase()));

      const pp = Number(item.penalty || 0);

      let matchesPenaltyMode = true;
      if (penaltyMode === "penalty") matchesPenaltyMode = pp > 0;
      else if (penaltyMode === "no-penalty") matchesPenaltyMode = pp === 0;

      let matchesPenaltyRange = true;
      if (penaltyMin !== "" && !Number.isNaN(Number(penaltyMin))) matchesPenaltyRange = matchesPenaltyRange && pp >= Number(penaltyMin);
      if (penaltyMax !== "" && !Number.isNaN(Number(penaltyMax))) matchesPenaltyRange = matchesPenaltyRange && pp <= Number(penaltyMax);

      return matchesStatus && matchesDate && matchesSearch && matchesName && matchesDescriptions && matchesPenaltyMode && matchesPenaltyRange;
    });
  }, [visibleItems, statusFilter, dateFilter, searchQuery, advancedFilters]);

  // Paginated set
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (dateFilter) count++;
    if (statusFilter !== "All") count++;
    if (advancedFilters.name) count++;
    if (advancedFilters.descriptions?.length) count += advancedFilters.descriptions.length;
    if (advancedFilters.penaltyMode && advancedFilters.penaltyMode !== "any") count++;
    if (advancedFilters.penaltyMin !== "") count++;
    if (advancedFilters.penaltyMax !== "") count++;
    if (advancedFilters.archived) count++;
    return count;
  }, [dateFilter, statusFilter, advancedFilters]);

  const isAllSelected = useMemo(() => {
    const ids = filteredItems.map((u) => u._id);
    return ids.length > 0 && ids.every((id) => selectedArchivedIds.includes(id));
  }, [filteredItems, selectedArchivedIds]);

  // Guard access disabled
  if (!loadingSettings && !settings?.guardAccess) {
    return (
      <div className="text-center mt-5">
        <h4 style={{ color: "#123458" }}>🚫 Guard access disabled</h4>
        <button type="button" className="btn mt-3" style={{ background: "#123458", color: "#F1EFEC" }} onClick={goBack}>
          Go Back
        </button>
      </div>
    );
  }

  /* ---------- UNARCHIVE single + bulk ---------- */
  const tryUnarchiveEndpoint = async (id) => {
    // Try /unarchive first, fallback to action Unarchive
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/items/${id}/unarchive`, {
        method: "PATCH",
        credentials: "include",
      });
      if (res.ok) {
        const updated = await res.json();
        return { ok: true, updated };
      }
    } catch (e) {
      // ignore and try fallback
    }

    try {
      const res2 = await fetchWithAuth(`${API_BASE_URL}/api/items/${id}/action`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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
    const originalItems = [...items]; // capture current items array for rollback
    // optimistic update: mark as restored in UI (no full loading spinner)
    setItems((prev) => prev.map((it) => (it._id === id ? { ...it, archivedAt: null, action: "Deposited" } : it)));

    const result = await tryUnarchiveEndpoint(id);
    if (result.ok) {
      // authoritative server data -> reconcile (merge)
      setItems((prev) => prev.map((it) => (it._id === result.updated._id ? result.updated : it)));
      showToast("Item restored", "success");
      // ensure selection cleared
      setSelectedArchivedIds((prev) => prev.filter((x) => x !== id));
      return true;
    } else {
      // revert by refreshing server data (no big loading UI)
      setItems(originalItems);
      await refreshItems({ archived: advancedFilters.archived }).catch(() => {});
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
      // apply successful updates: match by id
      setItems((prev) =>
        prev.map((it) => {
          const r = results.find((res) => res && res.ok && res.updated && res.updated._id === it._id);
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
    } catch (e) {
      console.error("unarchiveSelected error", e);
      showToast("Bulk unarchive failed", "danger");
    } finally {
      setSelectedArchivedIds([]);
      setBulkActionLoading(false);
    }
  };

  /* ---------- Selection helpers for archived items ---------- */
  const toggleSelectArchived = (id) => {
    setSelectedArchivedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    const ids = filteredItems.map((u) => u._id);
    if (ids.length === 0) return;
    const allSelected = ids.every((id) => selectedArchivedIds.includes(id));
    if (allSelected) setSelectedArchivedIds([]);
    else setSelectedArchivedIds(ids);
  };

  return (
    <div
      className="container-fluid p-2 d-flex flex-column"
      style={{
        height: "100%",
      }}
    >
      {/* HEADER */}
      <div
        className="d-flex justify-content-between mb-2 p-3 rounded flex-wrap"
        style={{ background: "#FFF", border: "1px solid #D4C9BE" }}
      >
        <div className="me-2" style={{ minWidth: 220 }}>
          <h4 className="fw-semibold mb-1">Guard Item Management</h4>
          <small style={{ color: "#6b6b6b" }}>
            Monitor, verify, and manage all items
          </small>
        </div>

        <div className="d-flex gap-2 align-items-center mt-2 mt-md-0 flex-wrap flex-md-nowrap">
          <div style={{ position: "relative", minWidth: 150 }}>
            <button
              type="button"
              className="btn shadow-sm w-100 d-flex justify-content-between align-items-center"
              style={{
                height: "37px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                color: "#334155",
                backgroundColor: "#fff",
                padding: "0 12px",
              }}
              onClick={() => datePickerRef.current?.showPicker?.()}
              title="Select date"
            >
              <FaRegCalendarAlt size={16} />
              <span className="ms-2 flex-grow-1 text-start" style={{ fontSize: "0.9rem" }}>
                {dateFilter || "Date"}
              </span>
            </button>
            <input
              ref={datePickerRef}
              type="date"
              className="form-control"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ position: "absolute", left: 0, top: 0, opacity: 0, width: 0, height: 0 }}
              aria-label="Filter by date"
            />
          </div>

          <div className="position-relative" style={{ minWidth: 160, zIndex: 1045 }}>
            <button
              className="btn shadow-sm w-100 d-flex justify-content-between align-items-center transition-hover"
              style={{
                height: "37px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                color: "#334155",
                backgroundColor: "#fff",
                padding: "0 12px"
              }}
              onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
            >
              <div className="d-flex align-items-center gap-2">
                {statusFilter}
              </div>
              <FaSortDown className="mb-1 text-muted" />
            </button>
            
            {statusDropdownOpen && (
              <>
                <div 
                  style={{ position: "fixed", inset: 0, zIndex: 1040 }} 
                  onClick={() => setStatusDropdownOpen(false)}
                />
                <div 
                  className="position-absolute shadow-lg p-2" 
                  style={{
                    top: "100%", left: 0, width: "200px", marginTop: "6px",
                    backgroundColor: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    zIndex: 1050,
                    display: "flex", flexDirection: "column", gap: "6px"
                  }}
                >
                  <div className="text-muted small fw-bold px-2 pb-1" style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}>FILTER BY STATUS</div>
                  {[
                    { value: "All", label: "All Statuses", color: "#64748b", bg: "#f1f5f9" },
                    { value: "Deposited", label: "Deposited", color: "#3b82f6", bg: "#eff6ff" },
                    { value: "Claimed", label: "Claimed", color: "#10b981", bg: "#ecfdf5" },
                    { value: "Unclaimed", label: "Unclaimed", color: "#ef4444", bg: "#fef2f2" },
                    { value: "Pending Verification", label: "Claim Request", color: "#f59e0b", bg: "#fffbeb" },
                    { value: "Settled", label: "Settled", color: "#17a2b8", bg: "#faf5ff" }
                  ].map((opt) => (
                    <div
                      key={opt.value}
                      className="p-2 rounded d-flex align-items-center gap-2 transition-hover"
                      style={{
                        cursor: "pointer",
                        backgroundColor: statusFilter === opt.value ? opt.bg : "transparent",
                        color: statusFilter === opt.value ? opt.color : "#475569",
                        fontWeight: statusFilter === opt.value ? "600" : "500",
                        border: statusFilter === opt.value ? `1px solid ${opt.color}40` : "1px solid transparent",
                      }}
                      onClick={() => {
                        setStatusFilter(opt.value);
                        setStatusDropdownOpen(false);
                      }}
                      onMouseEnter={(e) => {
                        if(statusFilter !== opt.value) e.currentTarget.style.backgroundColor = "#f8fafc";
                      }}
                      onMouseLeave={(e) => {
                        if(statusFilter !== opt.value) e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: opt.color }}></div>
                      {opt.label}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div ref={filterContainerRef} style={{ position: "relative" }}>
            <button
              className="btn shadow-sm d-inline-flex align-items-center transition-hover"
              onClick={() => setFilterPanelOpen((v) => !v)}
              title="Advanced filters"
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                background: activeFilterCount > 0 ? "#123458" : filterPanelOpen ? "#f1f5f9" : "#fff",
                color: activeFilterCount > 0 ? "#fff" : "#334155",
                height: "37px",
                padding: "0 14px",
                whiteSpace: "nowrap",
                cursor: "pointer",
              }}
              aria-expanded={filterPanelOpen}
            >
              <CiFilter size={20} />
              <span className="d-none d-md-inline ms-1">Filters</span>
              {activeFilterCount > 0 && (
                <span 
                  className="position-absolute badge rounded-pill"
                  style={{ 
                    top: "-4px",
                    right: "2px",
                    background: "#F08080", 
                    fontSize: "0.65rem",
                    border: "2px solid #fff",
                    zIndex: 1,
                    padding: "4px 6px"
                  }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>

            <FilterPanel
              show={filterPanelOpen}
              onClose={() => setFilterPanelOpen(false)}
              onApply={handleApplyAdvancedFilters}
              onClear={() => {
                handleClearAdvancedFilters();
                setFilterPanelOpen(false);
                showToast("Advanced filters cleared", "success");
              }}
              initialFilters={advancedFilters}
              anchorRef={filterContainerRef}
            />
          </div>

          <button
            className="btn shadow-sm d-inline-flex align-items-center justify-content-center transition-hover"
            style={{ 
              height: "37px", 
              minWidth: "42px", 
              border: "1px solid #e2e8f0", 
              borderRadius: "8px",
              backgroundColor: "#fff",
              color: "#64748b" 
            }}
            onClick={handleClearAll}
            title="Clear filters"
          >
            <BsArrowCounterclockwise className="d-md-none" />
            <span className="d-none d-md-inline">Clear</span>
          </button>
          
          <div className="shadow-sm" style={{ position: "relative", minWidth: 140, maxWidth: 264, borderRadius: "8px" }}>
            <BsSearch
              style={{
                position: "absolute",
                top: "50%",
                left: "12px",
                transform: "translateY(-50%)",
                color: "#94a3b8",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              className="form-control"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search items"
              style={{ 
                width: "100%", 
                border: "1px solid #e2e8f0", 
                borderRadius: "8px",
                height: "37px", 
                paddingLeft: "36px",
                backgroundColor: "#fff",
                color: "#334155"
              }}
            />
          </div>

          <button
            type="button"
            className="btn shadow-sm d-inline-flex align-items-center justify-content-center"
            style={{
              height: "37px",
              minWidth: "42px",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              backgroundColor: filteredItems.length > 0 ? "#123458" : "#D4C9BE",
              color: "#fff",
            }}
            disabled={filteredItems.length === 0}
            onClick={() => openConfirm(null, "download")}
            aria-label="Download PDF"
            title={filteredItems.length > 0 ? "Download PDF" : "No items to download"}
          >
            <FaFilePdf />
          </button>
        </div>
      </div>

      {/* TABLE CARD */}
      <div
        className="rounded d-flex flex-column flex-grow-1 shadow-sm"
        style={{
          background: "#FFF",
          border: "1px solid #D4C9BE",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <div
          className="px-3 py-2 fw-semibold d-flex justify-content-between align-items-center"
          style={{ borderBottom: "1px solid #D4C9BE", color: "#030303" }}
        >
          <div>Guard Items Overview</div>

          {/* When viewing archived items, show Unarchive selected button */}
          {advancedFilters.archived && (
            <div className="d-flex gap-2 align-items-center">
              <div className="small text-muted me-2">
                {selectedArchivedIds.length} selected
              </div>
              <button
                className="btn btn-sm"
                style={{ background: "#123458", color: "#fff" }}
                onClick={unarchiveSelected}
                disabled={selectedArchivedIds.length === 0 || bulkActionLoading}
                title="Unarchive selected items"
              >
                Unarchive selected
              </button>
            </div>
          )}
        </div>

        <div className="table-responsive flex-grow-1" style={{ overflowY: "auto" }}>
          {loadingItems ? (
            <p className="text-center p-3" style={{ color: "#D4C9BE" }}>
              Loading items…
            </p>
          ) : (
            <>
              {/* Desktop table (md+) */}
              <div className="d-none d-md-block">
                <table className="table mb-0 align-middle">
                  <colgroup>
                    <col style={{ width: "4%" }} />
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "18%" }} />
                    <col style={{ width: "28%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "11%" }} />
                    <col style={{ width: "11%" }} />
                    <col style={{ width: "8%" }} />
                  </colgroup>
                  <thead>
                    <tr style={{ color: "#D4C9BE", fontSize: "0.9rem" }}>
                      <th style={{ position: "sticky", top: 0, background: "#FFF", zIndex: 2 }}>
                        {advancedFilters.archived ? (
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={toggleSelectAll}
                            aria-label="Select all displayed archived items"
                          />
                        ) : (
                          "#"
                        )}
                      </th>
                      <th style={{ position: "sticky", top: 0, background: "#FFF", zIndex: 2 }}>Photo</th>
                      <th style={{ position: "sticky", top: 0, background: "#FFF", zIndex: 2 }}>Owner</th>
                      <th style={{ position: "sticky", top: 0, background: "#FFF", zIndex: 2 }}>Description</th>
                      <th style={{ position: "sticky", top: 0, background: "#FFF", zIndex: 2 }}>
                        {advancedFilters.archived ? "Archived Date" : "Date"}
                      </th>
                      <th
                        className="text-center"
                        style={{ position: "sticky", top: 0, background: "#FFF", zIndex: 2 }}
                      >
                        Status
                      </th>
                      <th
                        className="text-center"
                        style={{ position: "sticky", top: 0, background: "#FFF", zIndex: 2 }}
                      >
                        Penalty
                      </th>
                      <th
                        className="text-center"
                        style={{ position: "sticky", top: 0, background: "#FFF", zIndex: 2 }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((item, index) => {
                      const statusColor =
                        item.status === "Deposited"
                          ? "#D4C9BE"
                          : item.status === "Claimed"
                          ? "#90EE90"
                          : item.status === "Settled"
                          ? "#17a2b8"
                          : item.status === "Pending Verification"
                          ? "#f59e0b"
                          : "#F08080";
                      const ownerName =
                        (item.userId && `${item.userId.firstname || ""} ${item.userId.lastname || ""}`.trim()) ||
                        item.guestName ||
                        `${item.firstname || ""} ${item.lastname || ""}`.trim();

                      return (
                        <tr key={item._id}>
                          <td style={{ verticalAlign: "middle" }}>
                            {advancedFilters.archived ? (
                              <input
                                type="checkbox"
                                checked={selectedArchivedIds.includes(item._id)}
                                onChange={() => toggleSelectArchived(item._id)}
                                aria-label={`Select archived item ${item.description}`}
                              />
                            ) : (
                              index + 1 + (currentPage - 1) * itemsPerPage
                            )}
                          </td>

                          <td>
                            <img
                              src={item.photoUrl || "/logo.png"}
                              alt={ownerName}
                              style={{
                                width: 50,
                                height: 50,
                                objectFit: "cover",
                                borderRadius: 6,
                                cursor: "pointer",
                                border: "1px solid #D4C9BE",
                              }}
                              onClick={() => setFullscreenImage(item.photoUrl || "/logo.png")}
                            />
                          </td>

                          <td>
                            <div style={{ fontWeight: 600 }}>{ownerName}</div>
                            <div className="text-muted" style={{ fontSize: ".85rem" }}>
                              {item.userId?.email || ""}
                            </div>
                          </td>

                          <td style={{ wordBreak: "break-word", maxWidth: 360 }}>
                            {item.description || "-"}
                          </td>

                          <td>
                            <small className="text-muted">
                              {formatDate(advancedFilters.archived && item.archivedAt ? item.archivedAt : item.createdAt)}
                            </small>
                          </td>

                          <td className="text-center">
                            <span
                              className="px-2 py-1 rounded small"
                              style={{
                                background: statusColor,
                                color: (item.status === "Unclaimed" || item.status === "Settled") ? "#F1EFEC" : "",
                              }}
                            >
                              {item.status}
                            </span>
                          </td>

                          <td className="text-center">
                            <small
                              style={{
                                color: item.penalty > 0 ? "red" : "#6c757d",
                                fontWeight: item.penalty > 0 ? 700 : 400,
                                padding: "2px 6px",
                                borderRadius: 4,
                                border: "none",
                              }}
                            >
                              ₱{item.penalty || 0}
                            </small>
                          </td>

                          <td className="text-center">
                            {advancedFilters.archived ? (
                              <button
                                type="button"
                                className="btn btn-sm d-flex align-items-center justify-content-center"
                                style={{
                                  border: "1px solid #123458",
                                  color: "#123458",
                                  width: "32px",
                                  height: "32px",
                                  padding: 0,
                                }}
                                onClick={() => performUnarchive(item._id)}
                                title="Unarchive"
                              >
                                <FaUndo size={14} />
                              </button>
                            ) : (
                              <div className="d-flex justify-content-center gap-2">
                                <button
                                  type="button"
                                  className="btn btn-sm d-flex align-items-center justify-content-center"
                                  style={{
                                    background: "#123458",
                                    color: "#F1EFEC",
                                    width: "32px",
                                    height: "32px",
                                    padding: 0,
                                    opacity: item.status === "Claimed" ? 0.5 : 1,
                                  }}
                                  disabled={item.status === "Claimed"}
                                  onClick={() => openConfirm(item, "verify")}
                                  title={item.status === "Claimed" ? "Already verified" : "Verify"}
                                >
                                  <IoCheckmarkCircleOutline size={16} />
                                </button>

                                <button
                                  type="button"
                                  className="btn btn-sm d-flex align-items-center justify-content-center"
                                  style={{
                                    border: "1px solid #F08080",
                                    color: "#F08080",
                                    width: "32px",
                                    height: "32px",
                                    padding: 0,
                                  }}
                                  onClick={() => openConfirm(item, "archive")}
                                  title="Archive"
                                >
                                  <FaArchive size={14} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile list (below md): stacked cards */}
              <div className="d-block d-md-none p-2">
                {paginatedItems.length === 0 ? (
                  <div className="text-center mt-5" style={{ color: "#123458", fontWeight: 500 }}>
                    {items.length === 0 ? "📦 No items currently deposited" : "🔍 No items matched your filter/search"}
                  </div>
                ) : (
                  paginatedItems.map((item) => {
                    const isExpanded = expandedId === item._id;
                    const statusColor =
                      item.status === "Deposited"
                        ? "#D4C9BE"
                        : item.status === "Claimed"
                        ? "#90EE90"
                        : item.status === "Settled"
                        ? "#17a2b8"
                        : item.status === "Pending Verification"
                        ? "#f59e0b"
                        : "#F08080";
                    const ownerName =
                      (item.userId && `${item.userId.firstname || ""} ${item.userId.lastname || ""}`.trim()) ||
                      item.guestName ||
                      `${item.firstname || ""} ${item.lastname || ""}`.trim();

                    return (
                      <div
                        key={item._id}
                        className="card mb-2"
                        style={{ border: "1px solid #D4C9BE", background: "#FFFFFF" }}
                      >
                        <div className="card-body p-2">
                          <div className="d-flex align-items-start gap-2">
                            {advancedFilters.archived && (
                              <div style={{ marginTop: 8 }}>
                                <input
                                  type="checkbox"
                                  checked={selectedArchivedIds.includes(item._id)}
                                  onChange={() => toggleSelectArchived(item._id)}
                                  aria-label={`Select archived item ${item.description}`}
                                />
                              </div>
                            )}

                            <img
                              src={item.photoUrl || "/logo.png"}
                              alt={ownerName}
                              style={{
                                width: 64,
                                height: 64,
                                borderRadius: 8,
                                objectFit: "cover",
                                border: "1px solid #D4C9BE",
                                cursor: "pointer",
                              }}
                              onClick={() => setFullscreenImage(item.photoUrl || "/logo.png")}
                            />
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between align-items-start">
                                <div>
                                  <strong className="d-block">{ownerName}</strong>
                                  <small className="text-muted">{item.userId?.email || ""}</small>
                                </div>
                                <div className="text-end">
                                  <small
                                    style={{
                                      color: item.penalty > 0 ? "red" : "#6c757d",
                                      fontWeight: item.penalty > 0 ? "bold" : "normal",
                                      padding: "2px 6px",
                                      borderRadius: 4,
                                      border: "none",
                                      display: "inline-block",
                                    }}
                                  >
                                    ₱{item.penalty || 0}
                                  </small>
                                </div>
                              </div>

                              <div className="d-flex justify-content-between align-items-center mt-2">
                                <span
                                  className="px-2 py-1 rounded small"
                                  style={{
                                    background: statusColor,
                                    color: (item.status === "Unclaimed" || item.status === "Settled") ? "#F1EFEC" : "",
                                  }}
                                >
                                  {item.status === "Pending Verification" ? "Claim Request" : item.status}
                                </span>

                                <button
                                  type="button"
                                  className="btn btn-sm d-flex align-items-center justify-content-center"
                                  style={{ color: "#123458" }}
                                  onClick={() => setExpandedId(isExpanded ? null : item._id)}
                                >
                                  {isExpanded ? <IoIosArrowDown size={20} /> : <MdOutlineKeyboardArrowRight size={20} />}
                                </button>
                              </div>

                              {isExpanded && (
                                <div className="mt-2 pt-2 border-top" style={{ borderColor: "#D4C9BE" }}>
                                  <p className="mb-1 small">{item.description}</p>
                                  <small className="text-muted">
                                    {formatDate(advancedFilters.archived && item.archivedAt ? item.archivedAt : item.createdAt)}
                                  </small>

                                  <div className="d-flex gap-2 mt-2">
                                    {advancedFilters.archived ? (
                                      <button
                                        type="button"
                                        className="btn btn-sm"
                                        style={{ border: "1px solid #123458", color: "#123458" }}
                                        onClick={() => performUnarchive(item._id)}
                                      >
                                        Unarchive
                                      </button>
                                    ) : (
                                      <>
                                        <button
                                          type="button"
                                          className="btn btn-sm"
                                          style={{
                                            background: "#123458",
                                            color: "#F1EFEC",
                                            opacity: item.status === "Claimed" ? 0.5 : 1,
                                          }}
                                          disabled={item.status === "Claimed"}
                                          onClick={() => openConfirm(item, "verify")}
                                        >
                                          <IoCheckmarkCircleOutline /> Verify
                                        </button>

                                        <button
                                          type="button"
                                          className="btn btn-sm"
                                          style={{ border: "1px solid #F08080", color: "#F08080" }}
                                          onClick={() => openConfirm(item, "archive")}
                                        >
                                          <FaArchive />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {/* PAGINATION FOOTER */}
        <div className="px-2 py-2 border-top d-flex flex-wrap justify-content-between align-items-center gap-2 bg-light mt-auto" style={{ borderRadius: "0 0 8px 8px" }}>
          {/* Result Count & Rows Selector (Compact on Mobile) */}
          <div className="d-flex align-items-center gap-2 flex-grow-1">
            <div className="small fw-medium text-dark text-nowrap d-none d-sm-block" style={{ fontSize: "0.85rem" }}>
              <span className="d-none d-sm-inline text-muted fw-normal">Found</span> {filteredItems.length}{" "}
              <span className="d-none d-sm-inline text-muted fw-normal">items.</span>{" "}
              <span className="fw-bold">{filteredItems.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredItems.length)}</span>
              <span className="text-muted fw-normal ms-1">of {filteredItems.length}</span>
            </div>

            <div className="d-flex align-items-center gap-1 ms-auto ms-sm-2">
              <small className="text-muted d-none d-sm-inline" style={{ fontSize: "0.75rem" }}>Rows:</small>
              <select
                className="form-select form-select-sm py-0 px-1"
                style={{ width: "55px", fontSize: "0.75rem", height: "24px", border: "1px solid #D4C9BE" }}
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="d-flex align-items-center gap-1">
            <button
              className="btn btn-sm py-1 px-2 border d-flex align-items-center gap-1"
              style={{ fontSize: "0.8rem", background: "#fff", borderColor: "#D4C9BE" }}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Prev
            </button>

            <div className="d-none d-sm-flex gap-1 mx-1">
              {Array.from({ length: Math.ceil(filteredItems.length / itemsPerPage) }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === Math.ceil(filteredItems.length / itemsPerPage) || Math.abs(p - currentPage) <= 1)
                .map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-muted px-1 small">...</span>}
                    <button
                      className={`btn btn-sm py-0 px-2 ${currentPage === p ? "btn-dark" : "btn-light border"}`}
                      style={{ fontSize: "0.75rem", height: "24px", minWidth: "24px" }}
                      onClick={() => setCurrentPage(p)}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}
            </div>

            {/* Mobile simplified page indicator */}
            <div className="d-flex d-sm-none align-items-center px-2 small text-muted" style={{ fontSize: "0.75rem" }}>
              Page {currentPage} of {Math.max(1, Math.ceil(filteredItems.length / itemsPerPage))}
            </div>

            <button
              className="btn btn-sm py-1 px-2 border d-flex align-items-center gap-1"
              style={{ fontSize: "0.8rem", background: "#fff", borderColor: "#D4C9BE" }}
              disabled={currentPage >= Math.ceil(filteredItems.length / itemsPerPage)}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
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
          <div
            className="modal-backdrop show"
            onClick={closeConfirm}
            style={{ zIndex: 5000 }}
          />
          <div className="modal d-block" style={{ zIndex: 6000 }}>
            <div className="modal-dialog modal-sm modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "15px" }}>
                <div className="modal-header border-0 px-4 pt-4">
                  <h6
                    className="modal-title fw-bold"
                    style={{ color: "#123458" }}
                  >
                    {confirmMode === "verify"
                      ? "Confirm Verification"
                      : confirmMode === "archive"
                      ? "Confirm Archive"
                      : "Confirm Download"}
                  </h6>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeConfirm}
                  />
                </div>

                <div className="modal-body px-4 text-muted">
                  <p>
                    {confirmMode === "verify"
                      ? "Are you sure you want to verify this item?"
                      : confirmMode === "archive"
                      ? "Are you sure you want to archive this item?"
                      : "Do you want to download the PDF report?"}
                  </p>
                </div>

                <div className="modal-footer border-0 px-4 pb-4">
                  <button
                    type="button"
                    className="btn btn-light px-4 flex-grow-1 fw-bold"
                    onClick={closeConfirm}
                    style={{ borderRadius: "10px" }}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    className="btn px-4 flex-grow-1 fw-bold text-white"
                    style={{ background: "#123458", borderRadius: "10px" }}
                    onClick={handleConfirm}
                  >
                    {confirmMode === "archive" ? "Yes, Archive" : "Yes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* TOAST */}
      {toast.show && (
        <div
          className="position-fixed bottom-0 end-0 m-3 p-3 rounded"
          style={{
            background: toast.type === "danger" ? "#F08080" : "#90EE90",
            color: "#030303",
            minWidth: 240,
            zIndex: 3000,
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default GuardItemManagement;
