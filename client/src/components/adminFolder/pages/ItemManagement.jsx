import React, { useEffect, useRef, useState } from "react";
import { TiArrowUnsorted } from "react-icons/ti";
import { FaSortUp } from "react-icons/fa6";
import { FaSortDown } from "react-icons/fa6";
import { CiFilter } from "react-icons/ci";
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);

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
  });

  const filterButtonRef = useRef(null);

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
  }, [API_BASE_URL]);

  /* ---------- SORT / FILTER ---------- */
  let filteredItems = items.filter((i) => {
    const matchSearch =
      !search ||
      i.description?.toLowerCase().includes(search.toLowerCase()) ||
      `${i.firstname} ${i.lastname}`.toLowerCase().includes(search.toLowerCase());

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
    // name (owner)
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

    // date range (compare YYYY-MM-DD)
    const itemDate = i.createdAt ? new Date(i.createdAt).toISOString().slice(0, 10) : "";
    if (dateFrom && itemDate) {
      if (itemDate < dateFrom) return false;
    }
    if (dateTo && itemDate) {
      if (itemDate > dateTo) return false;
    }

    return true;
  });

  // Custom status order for sorting
  const statusOrderAsc = ["Deposited", "Claimed", "Unclaimed"];
  const statusOrderDesc = [...statusOrderAsc].reverse();

  if (sortField && sortOrder) {
    filteredItems = [...filteredItems].sort((a, b) => {
      if (sortField === "createdAt") {
        const A = new Date(a.createdAt);
        const B = new Date(b.createdAt);
        return sortOrder === "asc" ? A - B : B - A;
      } else if (sortField === "status") {
        const order = sortOrder === "asc" ? statusOrderAsc : statusOrderDesc;
        return order.indexOf(a.status) - order.indexOf(b.status);
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

  const handleDelete = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/items/${deleteItemId}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i._id !== deleteItemId));
      showToast("Item deleted");
    } catch {
      showToast("Delete failed", "danger");
    } finally {
      setDeleteItemId(null);
      setShowDeleteModal(false);
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

  const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getLastUpdated = () =>
    items.length
      ? Math.max(...items.map((i) => new Date(i.updatedAt || i.createdAt)))
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
    });
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
    });
    showToast("Advanced filters cleared", "success");
  };

  const handleClearAll = () => {
    setSearch("");
    setStatusFilter("All");
    handleClearAdvancedFilters();
    setFilterPanelOpen(false);
    showToast("Filters cleared", "success");
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
    
    return c;
  })();

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
            className="btn border"
            style={{ height: "37px" }}
            onClick={handleClearAll}
            title="Clear filters"
          >
            Clear
          </button>

          <input
            className="form-control"
            placeholder="Search item"
            style={{ maxWidth: 240, border: "1px solid #D4C9BE", height: "37px" }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
          className="px-3 py-2 fw-semibold"
          style={{ borderBottom: "1px solid #D4C9BE", color: "#030303" }}
        >
          Item Records Overview
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
                <col style={{ width: "32%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "16%" }} />
              </colgroup>
              <thead>
                <tr style={{ color: "#D4C9BE", fontSize: "0.9rem" }}>
                  <th style={{ position: "sticky", top: 0, background: "#FFF", zIndex: 2 }}>#</th>
                  <th style={{ position: "sticky", top: 0, background: "#FFF", zIndex: 2 }}>Photo</th>
                  <th style={{ position: "sticky", top: 0, background: "#FFF", zIndex: 2 }}>Description</th>
                  <th style={{ position: "sticky", top: 0, background: "#FFF", zIndex: 2 }}>Owner</th>
                  <th
                    style={{ cursor: "pointer", position: "sticky", top: 0, background: "#FFF", zIndex: 2 }}
                    onClick={() => toggleSort("createdAt")}
                  >
                    Date {renderSortIcon("createdAt")}
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
                    <td>{idx + 1}</td>
                    <td>
                      <img
                        src={i.photoUrl}
                        alt=""
                        style={{ width: 50, height: 50, objectFit: "cover" }}
                        className="rounded"
                      />
                    </td>
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
                        new Date(i.createdAt).toLocaleDateString()
                      )}
                    </td>
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
                    <td className="text-center">
                      {editingItemId === i._id ? (
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

                          {i.status !== "Claimed" && (
                            <button
                              className="btn btn-sm me-2"
                              style={{ border: "1px solid green", color: "green" }}
                              onClick={() => {
                                setVerifyItemId(i._id);
                                setShowVerifyModal(true);
                              }}
                            >
                              Verify
                            </button>
                          )}

                          <button
                            className="btn btn-sm"
                            style={{ border: "1px solid #F08080", color: "#F08080" }}
                            onClick={() => {
                              setDeleteItemId(i._id);
                              setShowDeleteModal(true);
                            }}
                          >
                            Archive
                          </button>
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
          Showing {filteredItems.length} of {items.length} items • Updated{" "}
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

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div
          className="modal fade show d-block"
          style={{ background: "rgba(0,0,0,.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Confirm Delete</h5>
              </div>
              <div className="modal-body">Are you sure you want to delete this item?</div>
              <div className="modal-footer">
                <button
                  className="btn btn-sm border"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-sm btn-danger" onClick={handleDelete}>
                  Delete
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
              <div className="modal-body">Confirm item verification?</div>
              <div className="modal-footer">
                <button
                  className="btn btn-sm border"
                  onClick={() => setShowVerifyModal(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-sm btn-success" onClick={handleVerify}>
                  Verify
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