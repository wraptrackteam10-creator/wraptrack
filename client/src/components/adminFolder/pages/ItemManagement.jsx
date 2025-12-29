import React, { useEffect, useRef, useState } from "react";
import { TiArrowUnsorted } from "react-icons/ti";
import { FaSortUp } from "react-icons/fa6";
import { FaSortDown } from "react-icons/fa6";
import { CiFilter } from "react-icons/ci";
import { BsSearch } from "react-icons/bs";
import "bootstrap/dist/css/bootstrap.min.css";
import ItemFilterPanel from "./ItemFilterPanel";

function ItemManagement() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortField, setSortField] = useState(null); // null = neutral
  const [sortOrder, setSortOrder] = useState(null); // "asc" | "desc"
  const [editingItemId, setEditingItemId] = useState(null);
  const [editedItem, setEditedItem] = useState({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // ARCHIVE modal state (replaces delete)
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveItemId, setArchiveItemId] = useState(null);

  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyItemId, setVerifyItemId] = useState(null);

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

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

  /* ---------- TOAST ---------- */
  const showToast = (message, type = "success", duration = 3000) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), duration);
  };

  /* ---------- FETCH ITEMS ---------- */
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/items`);
        const data = await res.json();
        setItems(data);
      } catch {
        showToast("Failed to load items", "danger");
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
    const interval = setInterval(fetchItems, 5000); // every 5 seconds

    return () => clearInterval(interval);
  }, [API_BASE_URL]);

  /* ---------- FILTER / VISIBLE SET ---------- */
  // When archived mode is true, show only archived items (archivedAt truthy).
  // Otherwise show non-archived items.
  const visibleItems = items.filter((i) =>
    advancedFilters.archived ? Boolean(i.archivedAt) : !i.archivedAt
  );

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
  const statusOrderAsc = ["Deposited", "Claimed", "Unclaimed"];
  const statusOrderDesc = [...statusOrderAsc].reverse();

  if (sortField && sortOrder) {
    filteredItems = [...filteredItems].sort((a, b) => {
      if (sortField === "createdAt") {
        // if archived mode is on, sort by archivedAt
        const getDate = (obj) =>
          advancedFilters.archived && obj.archivedAt ? new Date(obj.archivedAt) : new Date(obj.createdAt);
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

  /* ---------- ACTIONS ---------- */
  const handleEditClick = (item) => {
    const { photo, ...clean } = item;
    setEditingItemId(item._id);
    setEditedItem(clean);
  };

  const handleSave = async () => {
    try {
      const { photo, ...clean } = editedItem;

      const res = await fetch(`${API_BASE_URL}/api/items/${editedItem._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clean),
      });

      const updated = await res.json();

      setItems((prev) => prev.map((i) => (i._id === updated._id ? updated : i)));
      setEditingItemId(null);
      setEditedItem({});
      showToast("Item updated successfully");
    } catch {
      showToast("Update failed", "danger");
    }
  };

  // ARCHIVE (replaces delete)
  const handleArchive = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/items/${archiveItemId}/action`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
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

  const handleVerify = async () => {
    try {
      setItems((prev) =>
        prev.map((i) => (i._id === verifyItemId ? { ...i, status: "Claimed" } : i))
      );

      const res = await fetch(`${API_BASE_URL}/api/items/${verifyItemId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
      const res = await fetch(`${API_BASE_URL}/api/items/${id}/unarchive`, {
        method: "PATCH",
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
          fetch(`${API_BASE_URL}/api/items/${id}/unarchive`, { method: "PATCH" })
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
  const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getLastUpdated = () =>
    items.length
      ? Math.max(...items.map((i) => new Date(advancedFilters.archived ? (i.archivedAt || i.updatedAt || i.createdAt) : (i.updatedAt || i.createdAt))))
      : new Date();

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
      className="d-flex container-fluid p-2"
      style={{
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
      }}
    >
      {/* HEADER */}
      <div
        className="d-flex justify-content-between mb-2 p-3 rounded"
        style={{ background: "#FFF", border: "1px solid #D4C9BE" }}
      >
        <div>
          <h4 className="fw-semibold mb-1">Item Management</h4>
          <small style={{ color: "#6b6b6b" }}>
            Manage, edit, and monitor all deposited items
          </small>
        </div>

        <div className="d-flex gap-2 align-items-center">
          <select
            className="form-select"
            style={{ maxWidth: 150, height: "37px", border: "1px solid #D4C9BE" }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option>All</option>
            <option>Deposited</option>
            <option>Claimed</option>
            <option>Unclaimed</option>
          </select>

          <div ref={filterButtonRef}>
            <button
              className="btn d-inline-flex align-items-center"
              onClick={() => setFilterPanelOpen((v) => !v)}
              title="Advanced filters"
              style={{
                border: filterPanelOpen ? "2px solid #123458" : "1px solid #D4C9BE",
                background: activeFilterCount > 0 ? "#123458" : "#fff",
                color: activeFilterCount > 0 ? "#F1EFEC" : "#123458",
                height: "37px",
                padding: "0 10px",
                whiteSpace: "nowrap",
              }}
              aria-expanded={filterPanelOpen}
            >
              <CiFilter style={{ marginRight: 8 }} /> Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </button>
          </div>

          <button
            className="form-control btn "
            style={{ height: "37px", width: "62px", border: "1px solid #D4C9BE" }}
            onClick={handleClearAll}
            title="Clear filters"
          >
            Clear
          </button>
          
          <div style={{ position: "relative", width: 264}}>
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
              className="form-control"
              placeholder="Search"
              style={{ maxWidth: 240, border: "1px solid #D4C9BE", height: "37px", paddingLeft: "32px", }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* TABLE CARD */}
      <div
        className="rounded flex-column"
        style={{
          background: "#FFF",
          border: "1px solid #D4C9BE",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflowY: "auto",
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
                {filteredItems.map((i, idx) => (
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
                        idx + 1
                      )}
                    </td>

                    {/* PHOTO */}
                    <td>
                      <img
                        src={i.photoUrl}
                        alt=""
                        style={{ width: 50, height: 50, objectFit: "cover" }}
                        className="rounded"
                      />
                    </td>

                    {/* DESCRIPTION */}
                    <td>
                      {editingItemId === i._id ? (
                        <input
                          className="form-control form-control-sm"
                          value={editedItem.description}
                          onChange={(e) =>
                            setEditedItem({ ...editedItem, description: e.target.value })
                          }
                        />
                      ) : (
                        i.description
                      )}
                    </td>

                    {/* OWNER */}
                    <td>
                      {editingItemId === i._id ? (
                        <div className="d-flex gap-1">
                          <input
                            className="form-control form-control-sm"
                            value={editedItem.firstname}
                            placeholder="First"
                            onChange={(e) =>
                              setEditedItem({ ...editedItem, firstname: e.target.value })
                            }
                          />
                          <input
                            className="form-control form-control-sm"
                            value={editedItem.lastname}
                            placeholder="Last"
                            onChange={(e) =>
                              setEditedItem({ ...editedItem, lastname: e.target.value })
                            }
                          />
                        </div>
                      ) : (
                        `${i.firstname} ${i.lastname}`
                      )}
                    </td>

                    {/* DATE */}
                    <td>
                      {editingItemId === i._id ? (
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          value={editedItem.createdAt?.substring(0, 10)}
                          onChange={(e) =>
                            setEditedItem({
                              ...editedItem,
                              createdAt: new Date(e.target.value).toISOString(),
                            })
                          }
                        />
                      ) : (
                        // show archivedAt when in archived mode and archivedAt exists
                        new Date(advancedFilters.archived && i.archivedAt ? i.archivedAt : i.createdAt).toLocaleDateString()
                      )}
                    </td>

                    {/* PENALTY */}
                    <td className="text-center" >
                      {editingItemId === i._id ? (
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          value={editedItem.penalty || 0}
                          onChange={(e) =>
                            setEditedItem({ ...editedItem, penalty: e.target.value })
                          }
                          
                        />
                      ) : (
                        <small style={{ color: i.penalty > 0 ? "red" : "", fontWeight: i.penalty > 0 ? "bold" : "normal", padding: "2px 6px", }}>
                          {i.penalty || 0}
                        </small>
                      )}
                    </td>
                    
                    {/* STATUS */}
                    <td className="text-center">
                      {editingItemId === i._id ? (
                        <select
                          className="form-select form-select-sm"
                          value={editedItem.status}
                          onChange={(e) =>
                            setEditedItem({ ...editedItem, status: e.target.value })
                          }
                        >
                          <option value="Deposited">Deposited</option>
                          <option value="Claimed">Claimed</option>
                          <option value="Unclaimed">Unclaimed</option>
                        </select>
                      ) : (
                        <span
                          className="px-2 py-1 rounded small"
                          style={{
                            background:
                              i.status === "Claimed"
                                ? "#90EE90"
                                : i.status === "Deposited"
                                ? "#D4C9BE"
                                : "#F08080",
                            color: i.status === "Unclaimed" ? "#F1EFEC" : "",
                          }}
                        >
                          {i.status}
                        </span>
                      )}
                    </td>

                    {/* ACTIONS */}
                    <td className="text-center">
                      {advancedFilters.archived ? (
                        // Archived view: show Unarchive button for each row
                        <div className="d-flex justify-content-center gap-2">
                          <button
                            className="btn btn-sm"
                            style={{
                              border: "1px solid #123458",
                              color: "#123458",
                            }}
                            onClick={() => performUnarchive(i._id)}
                          >
                            Unarchive
                          </button>
                        </div>
                      ) : editingItemId === i._id ? (
                        <>
                          <button
                            className="btn btn-sm me-2"
                            style={{ background: "#123458", color: "#F1EFEC" }}
                            onClick={handleSave}
                          >
                            Save
                          </button>
                          <button
                            className="btn btn-sm"
                            style={{ border: "1px solid #D4C9BE" }}
                            onClick={() => setEditingItemId(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn btn-sm me-2"
                            style={{ border: "1px solid #123458", color: "#123458" }}
                            onClick={() => handleEditClick(i)}
                          >
                            Edit
                          </button>

                          <button
                            className="btn btn-sm me-2"
                            style={{ border: "1px solid #F08080", color: "#F08080" }}
                            onClick={() => {
                              setArchiveItemId(i._id);
                              setShowArchiveModal(true);
                            }}
                          >
                            Archive
                          </button>
                          {i.status !== "Claimed" && (
                            <button
                              className="btn btn-sm "
                              style={{ border: "1px solid green", color: "green" }}
                              onClick={() => {
                                setVerifyItemId(i._id);
                                setShowVerifyModal(true);
                              }}
                            >
                              Verify
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div
          className="px-3 py-2 small"
          style={{ borderTop: "1px solid #D4C9BE", color: "#D4C9BE" }}
        >
          Showing {filteredItems.length} of {visibleItems.length} items • Updated{" "}
          {timeAgo(getLastUpdated())}
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
    </div>
  );
}

export default ItemManagement;