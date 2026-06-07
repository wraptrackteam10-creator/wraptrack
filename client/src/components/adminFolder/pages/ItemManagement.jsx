import React, { useEffect, useRef, useState, useMemo } from "react";
import { TiArrowUnsorted } from "react-icons/ti";
import { FaSortUp, FaSortDown, FaUserCircle, FaBoxOpen, FaInfoCircle, FaMoneyBillWave, FaCalendarAlt, FaEdit, FaArchive, FaUndo, FaEye, FaEllipsisV } from "react-icons/fa";
import { BsSearch, BsArrowCounterclockwise } from "react-icons/bs";
import { CiFilter } from "react-icons/ci";
import "bootstrap/dist/css/bootstrap.min.css";
import ItemFilterPanel from "./ItemFilterPanel";
import { fetchWithAuth } from "../../../utils/fetchWithAuth";

function ItemManagement() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [sortField, setSortField] = useState("createdAt"); // default to sorting by createdAt
  const [sortOrder, setSortOrder] = useState("desc"); // default to descending (newest first)
  const [editingItemId, setEditingItemId] = useState(null);
  const [editedItem, setEditedItem] = useState({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // ARCHIVE modal state (replaces delete)
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveItemId, setArchiveItemId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyItemId, setVerifyItemId] = useState(null);

  const [showViewModal, setShowViewModal] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [showUnclaimedConfirm, setShowUnclaimedConfirm] = useState(false);

  // advanced filter state + panel visibility
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    name: "",
    descriptions: [],
    penaltyMode: "any",
    penaltyMin: "",
    penaltyMax: "",
    dateFrom: "",
    dateTo: "",
    archived: false, // NEW: archived toggle
  });

  const filterButtonRef = useRef(null);

  // selection state for archived items
  const [selectedArchivedIds, setSelectedArchivedIds] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // PAGINATION state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset to page 1 when search or status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, advancedFilters]);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

  // track first load so we show loading indicator only initially
  const initialLoadRef = useRef(true);

  /* ---------- TOAST ---------- */
  const showToast = (message, type = "success", duration = 3000) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), duration);
  };

  /* ---------- helper: shallow-ish equality for items ---------- */
  const isSameItem = (a = {}, b = {}) => {
    // Compare a small set of fields that are expected to change when the item updates.
    // If none of these changed, we consider the item "unchanged" and reuse the old reference.
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

  /* ---------- FETCH ITEMS (polling, merge updates to avoid flicker) ---------- */
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchItems = async () => {
      try {
        const archivedParam = advancedFilters.archived ? "?archived=true" : "";
        const res = await fetchWithAuth(`${API_BASE_URL}/api/items${archivedParam}`, {
          credentials: "include",
          signal: controller.signal,
        });
        if (!isMounted) return;
        if (!res.ok) {
          // try to read error but continue gracefully
          try {
            const err = await res.json();
            console.error("Fetch items error:", err);
          } catch (e) {
            console.error("Fetch items error, non-json response");
          }
          return;
        }
        const data = await res.json();

        if (!isMounted) return;

        // Initial load: set items and clear loading
        if (initialLoadRef.current) {
          setItems(data);
          setLoading(false);
          initialLoadRef.current = false;
          return;
        }

        // Merge strategy: keep previous object references when an item is unchanged.
        setItems((prev) => {
          const prevById = new Map(prev.map((p) => [p._id, p]));
          let changed = false;

          // Maintain order from server response
          const merged = data.map((newItem) => {
            const prevItem = prevById.get(newItem._id);
            if (prevItem && isSameItem(prevItem, newItem)) {
              // reuse previous object reference
              return prevItem;
            } else {
              changed = true;
              return newItem;
            }
          });

          // Also check if counts differ (deleted or new items)
          if (!changed && merged.length === prev.length) {
            // no changes detected
            return prev;
          }
          return merged;
        });
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Failed to load items:", err);
        // show toast only on first load to avoid spamming during polling
        if (initialLoadRef.current) showToast("Failed to load items", "danger");
        setLoading(false);
        initialLoadRef.current = false;
      }
    };

    // run immediately
    fetchItems();
    const interval = setInterval(fetchItems, 5000); // every 5 seconds

    return () => {
      isMounted = false;
      controller.abort();
      clearInterval(interval);
    };
  }, [API_BASE_URL, advancedFilters.archived]);

  /* ---------- FILTER / VISIBLE SET ---------- */
  // server now returns items already filtered by archived state for the viewer role,
  // so visibleItems is just items (we still apply local search/status/advanced filters)
  const visibleItems = items;

  // Base filtered list (search + status)
  let filteredItems = visibleItems.filter((i) => {
    const matchSearch =
      !search ||
      (i.description && i.description.toLowerCase().includes(search.toLowerCase())) ||
      `${i.firstname || ""} ${i.lastname || ""}`.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === "All" || i.status === statusFilter;

    return matchSearch && matchStatus;
  });

  // Apply advanced filters
  const {
    name,
    descriptions,
    penaltyMode,
    penaltyMin,
    penaltyMax,
    dateFrom,
    dateTo,
  } = advancedFilters;

  filteredItems = filteredItems.filter((i) => {
    // owner name
    if (name) {
      const owner = `${i.firstname || ""} ${i.lastname || ""}`.toLowerCase();
      if (!owner.includes(name.toLowerCase())) return false;
    }

    // descriptions (any match)
    if (descriptions && descriptions.length > 0) {
      const desc = (i.description || "").toLowerCase();
      const anyMatch = descriptions.some((d) => desc.includes(d.toLowerCase()));
      if (!anyMatch) return false;
    }

    // penalty mode
    const pp = Number(i.penalty || 0);
    if (penaltyMode === "penalty" && pp <= 0) return false;
    if (penaltyMode === "no-penalty" && pp !== 0) return false;

    // penalty range
    if (penaltyMin !== "" && !Number.isNaN(Number(penaltyMin))) {
      if (pp < Number(penaltyMin)) return false;
    }
    if (penaltyMax !== "" && !Number.isNaN(Number(penaltyMax))) {
      if (pp > Number(penaltyMax)) return false;
    }

    // date range (compare YYYY-MM-DD). When archived view, use archivedAt as primary date.
    const itemDate = advancedFilters.archived && i.archivedAt
      ? new Date(i.archivedAt).toISOString().slice(0, 10)
      : i.createdAt
      ? new Date(i.createdAt).toISOString().slice(0, 10)
      : "";

    if (dateFrom && itemDate) {
      if (itemDate < dateFrom) return false;
    }
    if (dateTo && itemDate) {
      if (itemDate > dateTo) return false;
    }

    return true;
  });

  /* ---------- SORT ---------- */
  const statusOrderAsc = ["Deposited", "Claimed", "Settled", "Unclaimed"];
  const statusOrderDesc = [...statusOrderAsc].reverse();

  if (sortField && sortOrder) {
    filteredItems = [...filteredItems].sort((a, b) => {
      if (sortField === "createdAt") {
        // if archived mode is on, sort by archivedAt
        const getDate = (obj) =>
          advancedFilters.archived && obj.archivedAt ? new Date(obj.archivedAt) : new Date(obj.createdAt || 0);
        const A = getDate(a);
        const B = getDate(b);
        return sortOrder === "asc" ? A - B : B - A;
      }

      if (sortField === "status") {
        const order = sortOrder === "asc" ? statusOrderAsc : statusOrderDesc;
        return order.indexOf(a.status) - order.indexOf(b.status);
      }

      if (sortField === "penalty") {
        const A = Number(a.penalty || 0);
        const B = Number(b.penalty || 0);
        return sortOrder === "asc" ? A - B : B - A;
      }

      return 0;
    });
  }

  // Final Paginated Set
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  /* ---------- ACTIONS ---------- */
  const handleEditClick = (item) => {
    const { photo, ...clean } = item;
    setEditingItemId(item._id);
    setEditedItem(clean);
    setShowEditModal(true);
  };

  const handleSave = async () => {
    try {
      const { photo, ...clean } = editedItem;

      const res = await fetchWithAuth(`${API_BASE_URL}/api/items/${editedItem._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(clean),
      });

      const updated = await res.json();

      setItems((prev) => prev.map((i) => (i._id === updated._id ? updated : i)));
      setEditingItemId(null);
      setEditedItem({});
      setShowEditModal(false);
      showToast("Item updated successfully");
    } catch {
      showToast("Update failed", "danger");
    }
  };

  // ARCHIVE (replaces delete)
  const handleArchive = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/items/${archiveItemId}/action`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "Archive" }),
      });

      const data = await res.json();
      const updated = data.item || data;

      setItems((prev) => prev.map((i) => (i._id === updated._id ? updated : i)));
      showToast("Item archived");
    } catch {
      showToast("Archive failed", "danger");
    } finally {
      setArchiveItemId(null);
      setShowArchiveModal(false);
    }
  };

  const handleUnclaimedVerify = async () => {
    try {
      const { photoUrl, ...clean } = viewItem;
      const payload = { ...clean, status: "Settled", penalty: 0 };

      const res = await fetchWithAuth(`${API_BASE_URL}/api/items/${viewItem._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const updated = await res.json();
      setItems((prev) => prev.map((i) => (i._id === updated._id ? updated : i)));
      showToast("Item successfully settled and penalty removed.");
    } catch {
      showToast("Verification failed", "danger");
    } finally {
      setShowUnclaimedConfirm(false);
      setShowViewModal(false);
    }
  };

  const handleVerify = async () => {
    try {
      // optimistic UI change (quick feedback)
      setItems((prev) =>
        prev.map((i) => (i._id === verifyItemId ? { ...i, status: "Claimed" } : i))
      );

      const res = await fetchWithAuth(`${API_BASE_URL}/api/items/${verifyItemId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "Claimed" }),
      });

      const updated = await res.json();

      setItems((prev) => prev.map((i) => (i._id === updated._id ? updated : i)));
      showToast("Item successfully verified");
    } catch {
      showToast("Verification failed", "danger");
    } finally {
      setVerifyItemId(null);
      setShowVerifyModal(false);
    }
  };

  /* ---------- UNARCHIVE (single + bulk) ---------- */
  const performUnarchive = async (id) => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/items/${id}/unarchive`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || "Unarchive failed", "danger");
        return false;
      }
      const updated = await res.json();
      setItems((prev) => prev.map((i) => (i._id === updated._id ? updated : i)));
      showToast("Unarchived item");
      return true;
    } catch {
      showToast("Unarchive failed", "danger");
      return false;
    }
  };

  const unarchiveSelected = async () => {
    if (selectedArchivedIds.length === 0) return;
    const ids = [...selectedArchivedIds];

    try {
      const results = await Promise.all(
        ids.map((id) =>
          fetchWithAuth(`${API_BASE_URL}/api/items/${id}/unarchive`, {
            method: "PATCH",
            credentials: "include",
          })
            .then(async (res) => {
              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                return { id, ok: false, error: err.error || "Unarchive failed" };
              }
              const updated = await res.json();
              return { id, ok: true, updated };
            })
            .catch(() => ({ id, ok: false, error: "Unarchive failed" }))
        )
      );

      // apply successful updates
      setItems((prev) =>
        prev.map((i) => {
          const r = results.find((res) => res.id === i._id);
          return r && r.ok ? r.updated : i;
        })
      );

      const failed = results.filter((r) => !r.ok);
      if (failed.length === 0) {
        showToast(`Unarchived ${ids.length} item(s)`);
      } else {
        showToast(`${failed.length} item(s) failed to unarchive`, "danger");
      }
    } catch {
      showToast("Bulk unarchive failed", "danger");
    } finally {
      setSelectedArchivedIds([]);
    }
  };

  /* ---------- TIME / HELPERS ---------- */
  // const timeAgo = (date) => {
  //   const d = new Date(date);
  //   const diff = Math.floor((Date.now() - d) / 1000);
  //   if (diff < 60) return `${diff}s ago`;
  //   if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  //   if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  //   return `${Math.floor(diff / 86400)}d ago`;
  // };

  // const getLastUpdated = () =>
  //   items.length
  //     ? new Date(Math.max(...items.map((i) => new Date(advancedFilters.archived ? (i.archivedAt || i.updatedAt || i.createdAt) : (i.updatedAt || i.createdAt || 0)).getTime())))
  //     : new Date();

  /* ---------- COLUMN SORT HANDLER (3 states) ---------- */
  const toggleSort = (field) => {
    if (sortField !== field) {
      setSortField(field);
      setSortOrder("asc"); // start with ascending
    } else {
      if (sortOrder === "asc") setSortOrder("desc");
      else if (sortOrder === "desc") {
        setSortField(null);
        setSortOrder(null);
      } else setSortOrder("asc");
    }
  };

  /* ---------- ICON RENDERING ---------- */
  const renderSortIcon = (field) => {
    if (sortField !== field || !sortOrder) return <TiArrowUnsorted />;
    if (sortOrder === "asc") {
      return field === "status" ? <FaSortDown /> : <FaSortUp />;
    }
    if (sortOrder === "desc") {
      return field === "status" ? <FaSortUp /> : <FaSortDown />;
    }
    return <TiArrowUnsorted />;
  };

  /* ---------- Advanced filter handlers ---------- */
  const handleApplyAdvancedFilters = (filters) => {
    setAdvancedFilters({
      name: filters.name || "",
      descriptions: filters.descriptions || [],
      penaltyMode: filters.penaltyMode || "any",
      penaltyMin: filters.penaltyMin ?? "",
      penaltyMax: filters.penaltyMax ?? "",
      dateFrom: filters.dateFrom || "",
      dateTo: filters.dateTo || "",
      archived: Boolean(filters.archived),
    });
    // reset selected archived when toggling archived mode
    setSelectedArchivedIds([]);
    showToast("Advanced filters applied", "success");
  };

  const handleClearAdvancedFilters = () => {
    setAdvancedFilters({
      name: "",
      descriptions: [],
      penaltyMode: "any",
      penaltyMin: "",
      penaltyMax: "",
      dateFrom: "",
      dateTo: "",
      archived: false,
    });
    setSelectedArchivedIds([]);
    showToast("Advanced filters cleared", "success");
  };

  const handleClearAll = () => {
    setSearch("");
    setStatusFilter("All");
    handleClearAdvancedFilters();
    setFilterPanelOpen(false);

    // ✅ Clear sorting
    setSortField(null);
    setSortOrder(null);

    showToast("All filters & sorting cleared", "success");
  };

  const activeFilterCount = (() => {
    let c = 0;
    if (advancedFilters.name) c++;
    if (advancedFilters.descriptions?.length) c += advancedFilters.descriptions.length;
    if (advancedFilters.penaltyMode && advancedFilters.penaltyMode !== "any") c++;
    if (advancedFilters.penaltyMin !== "") c++;
    if (advancedFilters.penaltyMax !== "") c++;
    if (advancedFilters.dateFrom) c++;
    if (advancedFilters.dateTo) c++;
    if (advancedFilters.archived) c++;
    return c;
  })();

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
          <h4 className="fw-semibold mb-1">Item Management</h4>
          <small style={{ color: "#6b6b6b" }}>
            Manage, edit, and monitor all deposited items
          </small>
        </div>

        <div className="d-flex gap-2 align-items-center mt-2 mt-md-0 flex-wrap flex-md-nowrap">
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
                    { value: "Settled", label: "Settled", color: "#17a2b8", bg: "#fffbeb" },
                    { value: "Unclaimed", label: "Unclaimed", color: "#ef4444", bg: "#fef2f2" }
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

          <div ref={filterButtonRef} style={{ position: "relative" }}>
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
              className="form-control"
              placeholder="Search..."
              style={{ 
                width: "100%", 
                border: "1px solid #e2e8f0", 
                borderRadius: "8px",
                height: "37px", 
                paddingLeft: "36px",
                backgroundColor: "#fff",
                color: "#334155"
              }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
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
          <div>Item Records Overview</div>

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
                disabled={selectedArchivedIds.length === 0}
                title="Unarchive selected items"
              >
                Unarchive selected
              </button>
            </div>
          )}
        </div>

        <div className="table-responsive flex-grow-1" style={{ overflowY: "auto" }}>
          {loading ? (
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
                    <col style={{ width: "25%" }} />
                    <col style={{ width: "19%" }} />
                    <col style={{ width: "11%" }} />
                    <col style={{ width: "7%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "16%" }} />
                  </colgroup>
                  <thead>
                    <tr style={{ color: "#D4C9BE", fontSize: "0.9rem" }}>
                      <th style={{ position: "sticky", top: 0, background: "#FFF", zIndex: 2 }}>
                        {advancedFilters.archived ? (
                          <input
                            type="checkbox"
                            checked={isAllSelected()}
                            onChange={toggleSelectAll}
                            aria-label="Select all displayed archived items"
                          />
                        ) : (
                          "#"
                        )}
                      </th>
                      <th style={{ position: "sticky", top: 0, background: "#FFF", zIndex: 2 }}>Photo</th>
                      <th style={{ position: "sticky", top: 0, background: "#FFF", zIndex: 2 }}>Description</th>
                      <th style={{ position: "sticky", top: 0, background: "#FFF", zIndex: 2 }}>Owner</th>
                      <th
                        style={{ cursor: "pointer", position: "sticky", top: 0, background: "#FFF", zIndex: 2 }}
                        onClick={() => toggleSort("createdAt")}
                      >
                        {advancedFilters.archived ? "Archived Date" : "Date"} {renderSortIcon("createdAt")}
                      </th>
                      <th
                        className="text-center"
                        style={{ cursor: "pointer", position: "sticky", top: 0, background: "#FFF", zIndex: 2 }}
                        onClick={() => toggleSort("penalty")}
                      >
                        Penalty {renderSortIcon("penalty")}
                      </th>
                      <th
                        className="text-center"
                        style={{ cursor: "pointer", position: "sticky", top: 0, background: "#FFF", zIndex: 2 }}
                        onClick={() => toggleSort("status")}
                      >
                        Status {renderSortIcon("status")}
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
                    {paginatedItems.map((i, idx) => {
                      const actualIdx = idx + 1 + (currentPage - 1) * itemsPerPage;
                      return (
                        <tr key={i._id}>

                        {/* INDEX OR CHECKBOX */}
                        <td>
                          {advancedFilters.archived ? (
                            <input
                              type="checkbox"
                              checked={selectedArchivedIds.includes(i._id)}
                              onChange={() => toggleSelectArchived(i._id)}
                              aria-label={`Select archived item ${i.description}`}
                            />
                          ) : (
                            actualIdx
                          )}
                        </td>

                        {/* PHOTO */}
                        <td>
                          <img
                            src={i.photoUrl || ""}
                            alt=""
                            style={{ width: 50, height: 50, objectFit: "cover" }}
                            className="rounded"
                          />
                        </td>

                        {/* DESCRIPTION */}
                        <td>
                          <div className="text-truncate" style={{ maxWidth: "200px" }} title={i.description}>
                            {i.description}
                          </div>
                        </td>

                        {/* OWNER */}
                        <td>
                          {`${i.firstname || ""} ${i.lastname || ""}`}
                        </td>

                        {/* DATE */}
                        <td>
                          {new Date(advancedFilters.archived && i.archivedAt ? i.archivedAt : i.createdAt || 0).toLocaleDateString()}
                        </td>

                        {/* PENALTY */}
                        <td className="text-center">
                          <small style={{ color: (i.penalty || 0) > 0 ? "red" : "", fontWeight: (i.penalty || 0) > 0 ? "bold" : "normal", padding: "2px 6px" }}>
                            ₱{i.penalty || 0}
                          </small>
                        </td>
                        
                        {/* STATUS */}
                        <td className="text-center">
                          <span
                            className="px-2 py-1 rounded small"
                            style={{
                              background:
                                i.status === "Claimed"
                                  ? "#90EE90"
                                  : i.status === "Deposited"
                                  ? "#D4C9BE"
                                  : i.status === "Settled"
                                  ? "#17a2b8"
                                  : i.status === "Pending Verification"
                                  ? "#FFD700"
                                  : "#F08080",
                              color: (i.status === "Unclaimed" || i.status === "Settled") ? "#F1EFEC" : "",
                            }}
                          >
                            {i.status === "Pending Verification" ? "Claim Request" : i.status}
                          </span>
                        </td>

                        {/* ACTIONS */}
                        <td className="text-center">
                          {advancedFilters.archived ? (
                            <div className="d-flex justify-content-center gap-2">
                              <button
                                className="btn btn-sm"
                                style={{ border: "1px solid #123458", color: "#123458" }}
                                onClick={() => performUnarchive(i._id)}
                              >
                                Unarchive
                              </button>
                            </div>
                          ) : (
                            <div className="d-flex justify-content-center gap-1">
                              <button
                                className="btn btn-sm rounded-2"
                                style={{ border: "1px solid #17a2b8", color: "#17a2b8" }}
                                onClick={() => {
                                  setViewItem(i);
                                  setShowViewModal(true);
                                }}
                              >
                                View
                              </button>
                              <button
                                className="btn btn-sm rounded-2"
                                style={{ border: "1px solid #123458", color: "#123458" }}
                                onClick={() => handleEditClick(i)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-sm rounded-2"
                                style={{ border: "1px solid #F08080", color: "#F08080" }}
                                onClick={() => {
                                  setArchiveItemId(i._id);
                                  setShowArchiveModal(true);
                                }}
                              >
                                Archive
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
                {paginatedItems.length === 0 && <p className="text-center p-2">No items found.</p>}
                {paginatedItems.map((i, idx) => {
                  // const isEditing = editingItemId === i._id;
                  const actualIdx = idx + 1 + (currentPage - 1) * itemsPerPage;
                  return (
                    <div key={i._id} className="card mb-2">
                      <div className="card-body p-2">
                        <div className="d-flex align-items-start gap-2">
                          <img
                            src={i.photoUrl || ""}
                            alt=""
                            style={{ width: 64, height: 64, objectFit: "cover" }}
                            className="rounded"
                          />
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <strong 
                                  className="d-block text-truncate" 
                                  style={{ maxWidth: "160px" }}
                                  title={i.description}
                                >
                                  {i.description}
                                </strong>
                                <small className="text-muted">{i.firstname || ""} {i.lastname || ""}</small>
                              </div>
                              <div className="text-end">
                                <small className="text-muted">
                                  {new Date(advancedFilters.archived && i.archivedAt ? i.archivedAt : i.createdAt || 0).toLocaleDateString()}
                                </small>
                                <div className="mt-1">
                                  {advancedFilters.archived ? (
                                    <input
                                      type="checkbox"
                                      checked={selectedArchivedIds.includes(i._id)}
                                      onChange={() => toggleSelectArchived(i._id)}
                                      aria-label={`Select archived item ${i.description}`}
                                    />
                                  ) : (
                                    <small className="text-muted">#{actualIdx}</small>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="d-flex gap-2 align-items-center mt-2 flex-nowrap justify-content-between">
                              <div className="d-flex gap-1 align-items-center flex-shrink-1 overflow-hidden">
                                <small 
                                  className="px-2 py-1 rounded-pill border fw-medium text-muted" 
                                  style={{ fontSize: "0.7rem", backgroundColor: "#f8f9fa", whiteSpace: "nowrap" }}
                                >
                                  Penalty: {i.penalty || 0}
                                </small>

                                <span
                                  className="px-2 py-1 rounded-pill fw-medium"
                                  style={{
                                    fontSize: "0.7rem",
                                    background: i.status === "Claimed" ? "#e1f7e1" : i.status === "Deposited" ? "#eeeae5" : i.status === "Settled" ? "#e0f2f1" : "#ffebee",
                                    color: i.status === "Claimed" ? "#2e7d32" : i.status === "Deposited" ? "#5d5d5d" : i.status === "Settled" ? "#00796b" : "#c62828",
                                    border: `1px solid ${i.status === "Claimed" ? "#c3e6cb" : i.status === "Deposited" ? "#d4c9be" : i.status === "Settled" ? "#b2dfdb" : "#ffcdd2"}`,
                                    whiteSpace: "nowrap"
                                  }}
                                >
                                  {i.status}
                                </span>
                              </div>

                              <div className="d-flex gap-2 align-items-center position-relative flex-shrink-0">
                                {advancedFilters.archived ? (
                                  <button
                                    className="btn btn-sm d-flex align-items-center justify-content-center p-2 rounded-2 shadow-sm"
                                    style={{ border: "1px solid #123458", color: "#123458", width: "32px", height: "32px" }}
                                    onClick={() => performUnarchive(i._id)}
                                    title="Unarchive"
                                  >
                                    <FaUndo size={14} />
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      className="btn btn-sm d-flex align-items-center justify-content-center p-2 rounded-2 shadow-sm"
                                      style={{ border: "1px solid #17a2b8", color: "#17a2b8", width: "32px", height: "32px" }}
                                      onClick={() => {
                                        setViewItem(i);
                                        setShowViewModal(true);
                                      }}
                                      title="View Details"
                                    >
                                      <FaEye size={14} />
                                    </button>

                                    <div className="position-relative">
                                      <button
                                        className="btn btn-sm d-flex align-items-center justify-content-center p-2 rounded-2 shadow-sm"
                                        style={{ border: "1px solid #6c757d", color: "#6c757d", width: "32px", height: "32px" }}
                                        onClick={() => setActiveMenuId(activeMenuId === i._id ? null : i._id)}
                                      >
                                        <FaEllipsisV size={14} />
                                      </button>

                                      {activeMenuId === i._id && (
                                        <div 
                                          className="position-absolute bg-white shadow rounded border p-1 d-flex flex-column gap-1"
                                          style={{ right: 0, top: "36px", zIndex: 100, minWidth: "100px" }}
                                        >
                                          <button
                                            className="btn btn-sm d-flex align-items-center gap-2 text-start p-2 hover-bg-light"
                                            style={{ color: "#123458" }}
                                            onClick={() => {
                                              handleEditClick(i);
                                              setActiveMenuId(null);
                                            }}
                                          >
                                            <FaEdit size={12} /> Edit
                                          </button>
                                          <button
                                            className="btn btn-sm d-flex align-items-center gap-2 text-start p-2 text-danger hover-bg-light"
                                            onClick={() => {
                                              setArchiveItemId(i._id);
                                              setShowArchiveModal(true);
                                              setActiveMenuId(null);
                                            }}
                                          >
                                            <FaArchive size={12} /> Archive
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

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

      {/* Advanced filter panel */}
      <ItemFilterPanel
        show={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        onApply={handleApplyAdvancedFilters}
        onClear={() => {
          handleClearAdvancedFilters();
          setFilterPanelOpen(false);
        }}
        initialFilters={advancedFilters}
        anchorRef={filterButtonRef}
      />

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

      {/* ARCHIVE MODAL */}
      {showArchiveModal && (
        <div
          className="modal fade show d-block"
          style={{ background: "rgba(0,0,0,.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Confirm Archive</h5>
              </div>
              <div className="modal-body">Are you sure you want to archive this item?</div>
              <div className="modal-footer">
                <button
                  className="btn border"
                  onClick={() => setShowArchiveModal(false)}
                >
                  Cancel
                </button>
                <button className="btn" style={{backgroundColor: "#123458", color: "#fff"}} onClick={handleArchive}>
                  Yes, Archive
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODAL - Responsive for desktop and mobile */}
      {showViewModal && viewItem && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 1060 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered" style={{ 
            maxWidth: "90vw",
            margin: "auto"
          }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "16px", overflow: "hidden" }}>
              <div className="modal-header border-0 bg-white px-3 px-md-4 pt-3 pt-md-4 pb-0">
                <div className="d-flex align-items-center gap-2">
                  <div className="rounded-circle p-2" style={{ background: "#f0f2f5" }}>
                    <FaInfoCircle size={20} style={{ color: "#123458" }} />
                  </div>
                  <h5 className="modal-title fw-bold" style={{ color: "#123458", fontSize: "1rem" }}>Item Details</h5>
                </div>
                <button 
                  type="button" 
                  className="btn-close shadow-none" 
                  onClick={() => setShowViewModal(false)}
                  style={{ fontSize: "0.8rem" }}
                ></button>
              </div>

              <div className="modal-body p-0">
                <div className="row g-0" style={{ minHeight: "300px" }}>
                  {/* Left Column: Image Area - Smaller on mobile */}
                  <div className="col-lg-5 col-12 d-flex align-items-center justify-content-center" style={{ background: "#f8fafc", padding: "1rem" }}>
                    <div className="w-100 d-flex flex-column align-items-center justify-content-center">
                      <div className="position-relative w-100 shadow-sm rounded-4 overflow-hidden" style={{ 
                        aspectRatio: "1/1", 
                        border: "4px solid #fff",
                        maxWidth: "150px"
                      }}>
                        <img
                          src={viewItem.photoUrl || "/logo.png"}
                          alt={viewItem.description}
                          className="w-100 h-100"
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                      <div className="mt-3 text-center">
                        <span className="badge px-2 px-md-3 py-1 py-md-2 rounded-pill shadow-sm" style={{
                          fontSize: "0.75rem",
                          background: viewItem.status === "Claimed" ? "#e6f4ea" : 
                                     viewItem.status === "Deposited" ? "#f1f3f4" : 
                                     viewItem.status === "Settled" ? "#e8f0fe" : "#fce8e6",
                          color: viewItem.status === "Claimed" ? "#1e7e34" : 
                                 viewItem.status === "Deposited" ? "#5f6368" : 
                                 viewItem.status === "Settled" ? "#1a73e8" : "#d93025",
                          fontWeight: "600",
                          border: `1px solid ${
                            viewItem.status === "Claimed" ? "#ceead6" : 
                            viewItem.status === "Deposited" ? "#dadce0" : 
                            viewItem.status === "Settled" ? "#d2e3fc" : "#fad2cf"
                          }`
                        }}>
                          {viewItem.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Details Area - Adjusted for both desktop and mobile */}
                  <div className="col-lg-7 col-12 bg-white p-3 p-lg-4 d-flex flex-column justify-content-between">
                    <div className="d-flex flex-column gap-3">
                      {/* Description Section */}
                      <div className="detail-item">
                        <label className="text-muted small fw-bold text-uppercase mb-2 d-block" style={{ fontSize: "0.65rem" }}>
                          <FaBoxOpen className="me-2" /> Description
                        </label>
                        <h5 className="fw-bold mb-0" style={{ color: "#1e293b", lineHeight: "1.4", fontSize: "0.95rem" }}>
                          {viewItem.description}
                        </h5>
                      </div>

                      {/* Details Grid */}
                      <div className="row g-2">
                        {/* Owner Section */}
                        <div className="col-sm-6">
                          <label className="text-muted small fw-bold text-uppercase mb-1 d-block" style={{ fontSize: "0.65rem" }}>
                            <FaUserCircle className="me-1" style={{ fontSize: "0.8rem" }} /> Owner
                          </label>
                          <div className="fw-semibold text-dark" style={{ fontSize: "0.85rem" }}>
                            {viewItem.firstname || "Unknown"} {viewItem.lastname || ""}
                          </div>
                        </div>

                        {/* Date Section */}
                        <div className="col-sm-6">
                          <label className="text-muted small fw-bold text-uppercase mb-1 d-block" style={{ fontSize: "0.65rem" }}>
                            <FaCalendarAlt className="me-1" style={{ fontSize: "0.8rem" }} /> Date
                          </label>
                          <div className="fw-semibold text-dark" style={{ fontSize: "0.85rem" }}>
                            {new Date(viewItem.createdAt || 0).toLocaleDateString("en-PH", { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                        </div>

                        {/* Penalty Section */}
                        <div className="col-sm-6">
                          <label className="text-muted small fw-bold text-uppercase mb-1 d-block" style={{ fontSize: "0.65rem" }}>
                            <FaMoneyBillWave className="me-1" style={{ fontSize: "0.8rem" }} /> Penalty
                          </label>
                          <div className={`fw-bold ${Number(viewItem.penalty) > 0 ? 'text-danger' : 'text-success'}`} style={{ fontSize: "0.9rem" }}>
                            ₱{viewItem.penalty || 0}
                          </div>
                        </div>
                      </div>

                      {/* Item ID */}
                      <div className="p-2 rounded-3" style={{ background: "#f8fafc", border: "1px dashed #e2e8f0" }}>
                        <div className="d-flex justify-content-between align-items-center gap-2">
                          <span className="text-muted small" style={{ fontSize: "0.7rem" }}>Item ID:</span>
                          <span className="font-monospace small fw-medium" style={{ fontSize: "0.7rem" }}>{viewItem._id.slice(-8).toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer with buttons */}
              <div className="modal-footer border-0 bg-white p-3 p-md-4 gap-2">
                <button 
                  className="btn btn-light px-3 px-md-4 fw-semibold flex-grow-1" 
                  onClick={() => setShowViewModal(false)}
                  style={{ borderRadius: "8px", height: "40px", fontSize: "0.9rem" }}
                >
                  Close
                </button>
                {viewItem.status === "Deposited" && (
                  <button
                    className="btn px-3 px-md-4 fw-semibold flex-grow-1"
                    style={{ background: "#123458", color: "#fff", borderRadius: "8px", height: "40px", fontSize: "0.9rem" }}
                    onClick={() => {
                      setShowViewModal(false);
                      setVerifyItemId(viewItem._id);
                      setShowVerifyModal(true);
                    }}
                  >
                    Verify
                  </button>
                )}
                {viewItem.status === "Unclaimed" && (
                  <button
                    className="btn px-3 px-md-4 fw-semibold flex-grow-1"
                    style={{ background: "#1e7e34", color: "#fff", borderRadius: "8px", height: "40px", fontSize: "0.9rem" }}
                    onClick={() => {
                      setShowViewModal(false);
                      setShowUnclaimedConfirm(true);
                    }}
                  >
                    Settle
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UNCLAIMED VERIFY CONFIRM MODAL */}
      {showUnclaimedConfirm && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Confirm Verification</h5>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to verify this Unclaimed item?</p>
                <p className="text-muted small">This will change the status to "Settled" and remove any penalty.</p>
              </div>
              <div className="modal-footer">
                <button className="btn border" onClick={() => setShowUnclaimedConfirm(false)}>
                  Cancel
                </button>
                <button className="btn" style={{backgroundColor: "#123458", color: "#fff"}} onClick={handleUnclaimedVerify}>
                  Yes, Verify
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VERIFY MODAL */}
      {showVerifyModal && (
        <div
          className="modal fade show d-block"
          style={{ background: "rgba(0,0,0,.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Verify Item</h5>
              </div>
              <div className="modal-body">Mark Item as Claimed?</div>
              <div className="modal-footer">
                <button
                  className="btn border"
                  onClick={() => setShowVerifyModal(false)}
                >
                  Cancel
                </button>
                <button className="btn" style={{backgroundColor: "#123458", color: "#fff"}} onClick={handleVerify}>
                  Yes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,.5)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "15px" }}>
              <div className="modal-header border-0 px-4 pt-4">
                <h5 className="modal-title fw-bold" style={{ color: "#123458" }}>Edit Item</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <div className="modal-body px-4">
                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted text-uppercase">Description</label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    value={editedItem.description || ""}
                    onChange={(e) => setEditedItem({ ...editedItem, description: e.target.value })}
                  />
                </div>
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-bold text-muted text-uppercase">First Name</label>
                    <input
                      type="text"
                      className="form-control rounded-3"
                      value={editedItem.firstname || ""}
                      onChange={(e) => setEditedItem({ ...editedItem, firstname: e.target.value })}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-bold text-muted text-uppercase">Last Name</label>
                    <input
                      type="text"
                      className="form-control rounded-3"
                      value={editedItem.lastname || ""}
                      onChange={(e) => setEditedItem({ ...editedItem, lastname: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted text-uppercase">Status</label>
                  <select
                    className="form-select rounded-3"
                    value={editedItem.status || ""}
                    onChange={(e) => setEditedItem({ ...editedItem, status: e.target.value })}
                  >
                    <option value="Deposited">Deposited</option>
                    <option value="Claimed">Claimed</option>
                    <option value="Unclaimed">Unclaimed</option>
                    <option value="Settled">Settled</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted text-uppercase">Penalty (₱)</label>
                  <input
                    type="number"
                    className="form-control rounded-3"
                    value={editedItem.penalty || 0}
                    onChange={(e) => setEditedItem({ ...editedItem, penalty: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer border-0 px-4 pb-4">
                <button className="btn btn-light px-4 flex-grow-1 fw-bold" onClick={() => setShowEditModal(false)} style={{ borderRadius: "10px" }}>
                  Cancel
                </button>
                <button className="btn px-4 flex-grow-1 fw-bold text-white" onClick={handleSave} style={{ backgroundColor: "#123458", borderRadius: "10px" }}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ItemManagement;
