import React, { useEffect, useRef, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import UserFilterPanel from "./UserFilterPanel";
import { BsSearch } from "react-icons/bs";
import { CiFilter } from "react-icons/ci";
import { TiArrowUnsorted } from "react-icons/ti";
import { FaSortUp, FaSortDown } from "react-icons/fa6";
import { fetchWithAuth } from "../../../utils/fetchWithAuth";

/**
 * Responsive UserManagement:
 * - Desktop (md+): table view (unchanged visually).
 * - Mobile (below md): stacked card list with the same actions.
 * - Header controls wrap and stretch on small screens for usability.
 */

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editedUser, setEditedUser] = useState({});
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [userToArchive, setUserToArchive] = useState(null);

  const [sortField, setSortField] = useState(null); // "date" | "type" | "status"
  const [sortOrder, setSortOrder] = useState(null); // "asc" | "desc"

  // Advanced user filter
  const [userFilterOpen, setUserFilterOpen] = useState(false);
  const [userAdvancedFilters, setUserAdvancedFilters] = useState({
    username: "",
    email: "",
    types: [],
    statuses: [],
    archived: false, // NEW: archived toggle
  });
  const filterButtonRef = useRef(null);

  const [selectedArchivedIds, setSelectedArchivedIds] = useState([]); // NEW: selection for archived users

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

  /* ---------------- TOAST ---------------- */
  const showToast = (message, type = "success", duration = 3000) => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      duration
    );
  };

  /* ---------------- FETCH USERS ---------------- */
  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      try {
        const url = userAdvancedFilters.archived
          ? `${API_BASE_URL}/api/users?archived=true`
          : `${API_BASE_URL}/api/users`;

        const res = await fetchWithAuth(url, { credentials: "include" });
        const data = await res.json();

        if (isMounted) {
          setUsers(data);
        }
      } catch {
        showToast("Failed to load users", "danger");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUsers();

    const interval = setInterval(fetchUsers, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [API_BASE_URL, userAdvancedFilters.archived]);

  /* ---------------- ACTIONS ---------------- */
  const handleEditClick = (user) => {
    setEditingUserId(user._id);
    setEditedUser(JSON.parse(JSON.stringify(user)));
  };

  const handleCredChange = (field, value) => {
    setEditedUser((prev) => ({
      ...prev,
      userCredentials: {
        ...prev.userCredentials,
        [field]: value,
      },
    }));
  };

  const toggleSort = (field) => {
    if (sortField !== field) {
      setSortField(field);
      setSortOrder("asc");
    } else {
      if (sortOrder === "asc") setSortOrder("desc");
      else if (sortOrder === "desc") {
        setSortField(null);
        setSortOrder(null);
      } else setSortOrder("asc");
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field || !sortOrder) return <TiArrowUnsorted />;
    return sortOrder === "asc" ? <FaSortUp /> : <FaSortDown />;
  };

  const openArchiveModal = (id) => {
    setUserToArchive(id);
    setShowArchiveModal(true);
  };

  const isValidUsername = (username, type) => {
    if (type === "student") {
      return /^\d{4}-\d{4}$/.test(username);
    }
    const MAX_LENGTH = 16;
    const MIN_LENGTH = 8;
    return typeof username === "string" && username.length <= MAX_LENGTH && username.length >= MIN_LENGTH;
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSave = async () => {
    const { username, email, type } = editedUser.userCredentials || {};

    if (!isValidUsername(username, type)) {
      showToast(
        `Invalid Login ID format. Use 0000-0000 for student.
        For non-students, ensure length is between 8 and 16 characters.`,
        "danger"
      );
      return;
    }

    if (!isValidEmail(email)) {
      showToast("Invalid email format.", "danger");
      return;
    }

    try {
      const res = await fetchWithAuth(
        `${API_BASE_URL}/api/users/${editedUser._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(editedUser),
        }
      );

      const updated = await res.json();

      if (!res.ok) {
        showToast(updated.errorMessage || "Update failed", "danger");
        return;
      }

      setUsers((prev) =>
        prev.map((u) => (u._id === updated._id ? updated : u))
      );

      setEditingUserId(null);
      setEditedUser({});
      showToast("User updated successfully");
    } catch {
      showToast("Update failed", "danger");
    }
  };

  // perform archive (called when modal confirm pressed)
  const performArchive = async () => {
    if (!userToArchive) return;
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/users/${userToArchive}/archive`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        showToast(err.error || "Archive failed", "danger");
        return;
      }

      const updated = await res.json();
      // Update single user in list (backend should return updated user)
      setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
      showToast("User archived");
    } catch (err) {
      showToast("Archive failed", "danger");
    } finally {
      setShowArchiveModal(false);
      setUserToArchive(null);
    }
  };

  const handleArchive = (id) => {
    openArchiveModal(id);
  };

  /* ---------------- UNARCHIVE ---------------- */
  // unarchive a single user
  const performUnarchive = async (id) => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/users/${id}/unarchive`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        showToast(err.error || "Unarchive failed", "danger");
        return false;
      }
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
      return true;
    } catch (err) {
      showToast("Unarchive failed", "danger");
      return false;
    }
  };

  // bulk unarchive selected archived users
  const unarchiveSelected = async () => {
    if (selectedArchivedIds.length === 0) return;
    const ids = [...selectedArchivedIds];
    try {
      const results = await Promise.all(
        ids.map((id) =>
          fetchWithAuth(`${API_BASE_URL}/api/users/${id}/unarchive`, { 
            method: "PATCH", credentials: "include" 
          }).then(async (res) => {
            if (!res.ok) {
              const err = await res.json();
              return { id, ok: false, error: err.error || "Unarchive failed" };
            }
            const updated = await res.json();
            return { id, ok: true, updated };
          }).catch(() => ({ id, ok: false, error: "Unarchive failed" }))
        )
      );

      // apply successful updates
      setUsers((prev) =>
        prev.map((u) => {
          const r = results.find((res) => res.id === u._id);
          return r && r.ok ? r.updated : u;
        })
      );

      const failed = results.filter((r) => !r.ok);
      if (failed.length === 0) {
        showToast(`Unarchived ${ids.length} user(s)`);
      } else {
        showToast(`${failed.length} user(s) failed to unarchive`, "danger");
      }
    } catch {
      showToast("Bulk unarchive failed", "danger");
    } finally {
      setSelectedArchivedIds([]);
    }
  };

  /* ---------------- FILTERING ---------------- */
  // show archived users only when the advanced filter archived is true
  const visibleUsers = users.filter((u) =>
    userAdvancedFilters.archived ? Boolean(u.archivedAt) : !u.archivedAt
  );

  // helper to extract date portion (YYYY-MM-DD) from possible date fields
  const isoDateFor = (u) => {
    // when showing archived users, use archivedAt as primary date
    if (userAdvancedFilters.archived && u.archivedAt) {
      try {
        return new Date(u.archivedAt).toISOString().slice(0, 10);
      } catch {
        // fallthrough
      }
    }
    const possible = u.createdAt || u.registeredAt || u.updatedAt || "";
    try {
      return new Date(possible).toISOString().slice(0, 10);
    } catch {
      return "";
    }
  };

  // Apply search text + date + advanced user filters
  const filteredUsers = visibleUsers.filter((u) => {
    // search by full name
    const fullName = `${u.firstname || ""} ${u.lastname || ""}`.toLowerCase();
    if (search && !fullName.includes(search.toLowerCase())) return false;

    // date filter (matches user's created/registered/updated date or archivedAt when archived mode)
    if (dateFilter) {
      const userDate = isoDateFor(u);
      if (!userDate || userDate !== dateFilter) return false;
    }

    const { username, email, types, statuses } = userAdvancedFilters;

    if (username) {
      const uname = (u.userCredentials?.username || "").toLowerCase();
      if (!uname.includes(username.toLowerCase())) return false;
    }

    if (email) {
      const uemail = (u.userCredentials?.email || "").toLowerCase();
      if (!uemail.includes(email.toLowerCase())) return false;
    }

    if (types?.length > 0) {
      if (!types.includes(u.userCredentials?.type)) return false;
    }

    if (statuses?.length > 0) {
      if (!statuses.includes(u.userCredentials?.status)) return false;
    }
    return true;
  });

  /* ---------------- SORTING ---------------- */
  const typeOrderAsc = ["student", "faculty", "visitor", "guard", "admin"];
  const typeOrderDesc = [...typeOrderAsc].reverse();

  const statusOrderAsc = ["Active", "Inactive"];
  const statusOrderDesc = [...statusOrderAsc].reverse();

  let sortedUsers = [...filteredUsers];

  if (sortField && sortOrder) {
    sortedUsers.sort((a, b) => {
      if (sortField === "date") {
        // if viewing archived users, sort by archivedAt, else by created/registered/updated
        const getDateVal = (obj) => {
          if (userAdvancedFilters.archived && obj.archivedAt) return new Date(obj.archivedAt);
          return new Date(obj.createdAt || obj.registeredAt || obj.updatedAt || 0);
        };
        const A = getDateVal(a);
        const B = getDateVal(b);
        return sortOrder === "asc" ? A - B : B - A;
      }

      if (sortField === "type") {
        const order = sortOrder === "asc" ? typeOrderAsc : typeOrderDesc;
        return (
          order.indexOf(a.userCredentials.type) -
          order.indexOf(b.userCredentials.type)
        );
      }

      if (sortField === "status") {
        const order = sortOrder === "asc" ? statusOrderAsc : statusOrderDesc;
        return (
          order.indexOf(a.userCredentials.status) -
          order.indexOf(b.userCredentials.status)
        );
      }

      return 0;
    });
  }

  /* ---------------- TIME AGO ---------------- */
  const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getLastUpdated = () => {
    if (!visibleUsers.length) return new Date();
    // when viewing archived users, consider archivedAt for "Updated" indicator
    if (userAdvancedFilters.archived) {
      return new Date(Math.max(...visibleUsers.map((u) => new Date(u.archivedAt || 0))));
    }
    return new Date(Math.max(...visibleUsers.map((u) => new Date(u.updatedAt || u.createdAt || 0))));
  };

  /* ---------------- User filter handlers ---------------- */
  const handleApplyUserFilters = (filters) => {
    setUserAdvancedFilters({
      username: filters.username || "",
      email: filters.email || "",
      types: filters.types || [],
      statuses: filters.statuses || [],
      archived: Boolean(filters.archived),
    });
    // When switching to archived view, clear any selected archived IDs
    setSelectedArchivedIds([]);
    showToast("User filters applied", "success");
  };

  const handleClearUserFilters = () => {
    setUserAdvancedFilters({
      username: "",
      email: "",
      types: [],
      statuses: [],
      archived: false,
    });
    setSelectedArchivedIds([]);
    showToast("User filters cleared", "success");
  };

  const handleClearAll = () => {
    setSearch("");
    setDateFilter("");
    handleClearUserFilters();
    setUserFilterOpen(false);

    setSortField(null);
    setSortOrder(null);

    showToast("All filters & sorting cleared", "success");
  };

  const activeUserFilterCount = (() => {
    let c = 0;

    if (userAdvancedFilters.username) c++;
    if (userAdvancedFilters.email) c++;

    if (userAdvancedFilters.types?.length)
      c += userAdvancedFilters.types.length;

    if (userAdvancedFilters.statuses?.length)
      c += userAdvancedFilters.statuses.length;

    if (userAdvancedFilters.archived) c++;

    return c;
  })();

  const formatDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  /* ---------------- Selection for archived users ---------------- */
  const toggleSelectArchived = (id) => {
    setSelectedArchivedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // const selectAllVisible = () => {
  //   const ids = sortedUsers.map((u) => u._id);
  //   setSelectedArchivedIds(ids);
  // };

  const clearAllSelected = () => setSelectedArchivedIds([]);

  const toggleSelectAll = () => {
    const ids = sortedUsers.map((u) => u._id);
    if (ids.length === 0) return;
    const allSelected = ids.every((id) => selectedArchivedIds.includes(id));
    if (allSelected) clearAllSelected();
    else setSelectedArchivedIds(ids);
  };

  const isAllSelected = () => {
    const ids = sortedUsers.map((u) => u._id);
    return ids.length > 0 && ids.every((id) => selectedArchivedIds.includes(id));
  };

  return (
    <div className="container-fluid p-2">
      {/* PAGE HEADER */}
      <div
        className="d-flex justify-content-between mb-2 p-3 rounded flex-wrap"
        style={{ background: "#FFF", border: "1px solid #D4C9BE" }}
      >
        <div className="me-2 flex-grow-1" style={{ minWidth: 220 }}>
          <h4 className="fw-semibold mb-1">User Account Management</h4>
          <small style={{ color: "#6b6b6b" }}>
            Manage, edit, and monitor all user accounts
          </small>
        </div>

        <div className="d-flex gap-2 align-items-center mt-2 mt-md-0 flex-wrap">
          {/* Date filter */}
          <input
            type="date"
            className="form-control"
            style={{ maxWidth: 160, height: "37px", border: "1px solid #D4C9BE" }}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            aria-label="Filter by date"
            title="Filter by date"
          />

          {/* Advanced filters button */}
          <button
            ref={filterButtonRef}
            className="btn d-inline-flex align-items-center"
            onClick={() => setUserFilterOpen((v) => !v)}
            title="Advanced filters"
            style={{
              border: userFilterOpen ? "2px solid #123458" : "1px solid #D4C9BE",
              background: activeUserFilterCount > 0 ? "#123458" : "#fff",
              color: activeUserFilterCount > 0 ? "#F1EFEC" : "#030303",
              height: "37px",
              padding: "0 10px",
              whiteSpace: "nowrap",
            }}
            aria-expanded={userFilterOpen}
            aria-pressed={userFilterOpen}
          >
            <CiFilter style={{ marginRight: 8 }} /> Filters{activeUserFilterCount > 0 ? ` (${activeUserFilterCount})` : ""}
          </button>

          {/* Clear filters */}
          <button
            className="form-control btn"
            onClick={handleClearAll}
            title="Clear filters/search"
            style={{ height: "37px", width: "62px", border: "1px solid #D4C9BE" }}
          >
            Clear
          </button>

          {/* Search */}
          <div style={{ position: "relative", minWidth: 180, maxWidth: 300 }} className="ms-0 ms-md-0">
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
              placeholder="Search user"
              style={{ width: "100%", border: "1px solid #D4C9BE", height: "37px", paddingLeft: "32px" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search users by name"
            />
          </div>
        </div>
      </div>

      {/* TABLE CARD (responsive) */}
      <div className="rounded" style={{ background: "#fff", border: "1px solid #D4C9BE" }}>
        <div className="px-3 py-2 fw-semibold border-bottom d-flex justify-content-between align-items-center">
          <div>User Accounts Overview</div>

          {/* When viewing archived users, show Unarchive selected button */}
          <div className="d-flex gap-2 align-items-center">
            {userAdvancedFilters.archived && (
              <>
                <div className="small text-muted me-2">
                  {selectedArchivedIds.length} selected
                </div>
                <button
                  className="btn btn-sm"
                  style={{ background: "#123458", color: "#fff" }}
                  onClick={unarchiveSelected}
                  disabled={selectedArchivedIds.length === 0}
                  title="Unarchive selected users"
                >
                  Unarchive selected
                </button>
              </>
            )}
          </div>
        </div>

        <div className="d-flex flex-column flex-grow-1 p-2">
          {loading ? (
            <p className="text-center p-3">Loading users…</p>
          ) : (
            <>
              {/* Desktop table (md+) */}
              <div className="d-none d-md-block">
                <table className="table mb-0 align-middle">
                  <colgroup>
                    <col style={{ width: "4%" }} />   {/* # OR checkbox */}
                    <col style={{ width: "20%" }} />  {/* Full Name */}
                    <col style={{ width: "12%" }} />  {/* Username */}
                    <col style={{ width: "24%" }} />  {/* Email */}
                    <col style={{ width: "12%" }} />   {/* Date */}
                    <col style={{ width: "8%" }} />   {/* Type */}
                    <col style={{ width: "8%" }} />   {/* Status */}
                    <col style={{ width: "20%" }} />  {/* Actions */}
                  </colgroup>
                  <thead>
                    <tr style={{ color: "#D4C9BE", fontSize: "0.9rem" }}>
                      <th style={{ position: "sticky", top: 0, background: "#FFF", zIndex: 2 }}>
                        {userAdvancedFilters.archived ? (
                          <input
                            type="checkbox"
                            checked={isAllSelected()}
                            onChange={toggleSelectAll}
                            aria-label="Select all displayed archived users"
                          />
                        ) : (
                          "#"
                        )}
                      </th>
                      <th style={{ position: "sticky", top: 0, background: "#FFF", zIndex: 2 }}>Full Name</th>
                      <th style={{ position: "sticky", top: 0, background: "#FFF", zIndex: 2 }}>Login ID</th>
                      <th style={{ position: "sticky", top: 0, background: "#FFF", zIndex: 2 }}>Email</th>
                      <th
                        onClick={() => toggleSort("date")}
                        style={{ cursor: "pointer", position: "sticky", top: 0, background: "#FFF" }}
                      >
                        {userAdvancedFilters.archived ? "Archived Date" : "Date"} {renderSortIcon("createdAt")}
                      </th>
                      <th
                        onClick={() => toggleSort("type")}
                        style={{ cursor: "pointer", position: "sticky", top: 0, background: "#FFF" }}
                      >
                        Type {renderSortIcon("type")}
                      </th>

                      <th
                        className="text-center"
                        onClick={() => toggleSort("status")}
                        style={{ cursor: "pointer", position: "sticky", top: 0, background: "#FFF" }}
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
                    {sortedUsers.map((u, i) => (
                      <tr key={u._id}>
                        <td>
                          {userAdvancedFilters.archived ? (
                            <input
                              type="checkbox"
                              checked={selectedArchivedIds.includes(u._id)}
                              onChange={() => toggleSelectArchived(u._id)}
                              aria-label={`Select archived user ${u.firstname} ${u.lastname}`}
                            />
                          ) : (
                            i + 1
                          )}
                        </td>

                        {/* FULL NAME */}
                        <td>
                          {editingUserId === u._id ? (
                            <div className="d-flex gap-1">
                              <input
                                className="form-control form-control-sm"
                                placeholder="First name"
                                value={editedUser.firstname || ""}
                                onChange={(e) =>
                                  setEditedUser((prev) => ({
                                    ...prev,
                                    firstname: e.target.value,
                                  }))
                                }
                              />
                              <input
                                className="form-control form-control-sm"
                                placeholder="Last name"
                                value={editedUser.lastname || ""}
                                onChange={(e) =>
                                  setEditedUser((prev) => ({
                                    ...prev,
                                    lastname: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          ) : (
                            `${u.firstname} ${u.lastname}`
                          )}
                        </td>

                        {/* USERNAME */}
                        <td>
                          {editingUserId === u._id ? (
                            <input
                              className="form-control form-control-sm"
                              value={editedUser.userCredentials?.username || ""}
                              onChange={(e) =>
                                handleCredChange("username", e.target.value)
                              }
                            />
                          ) : (
                            u.userCredentials?.username || ""
                          )}
                        </td>

                        {/* EMAIL */}
                        <td>
                          {editingUserId === u._id ? (
                            <input
                              type="email"
                              className="form-control form-control-sm"
                              value={editedUser.userCredentials?.email || ""}
                              onChange={(e) =>
                                handleCredChange("email", e.target.value)
                              }
                            />
                          ) : (
                            u.userCredentials?.email || ""
                          )}
                        </td>

                        {/* DATE */}
                        <td>
                          <small className="text-muted">
                            {formatDate(
                              userAdvancedFilters.archived && u.archivedAt
                                ? u.archivedAt
                                : u.createdAt || u.registeredAt || u.updatedAt
                            )}
                          </small>
                        </td>

                        {/* TYPE */}
                        <td>
                          {editingUserId === u._id && u.userCredentials?.type !== "admin" && u.userCredentials?.type !== "guard" ? (
                            <select
                              className="form-select form-select-sm"
                              value={editedUser.userCredentials?.type || ""}
                              onChange={(e) =>
                                handleCredChange("type", e.target.value)
                              }
                            >
                              <option value="student">student</option>
                              <option value="faculty">faculty</option>
                              <option value="visitor">visitor</option>
                            </select>
                          ) : (
                            <span className="px-2 py-1 rounded small border">
                              {u.userCredentials?.type === "student"
                                ? "Student"
                                : u.userCredentials?.type === "faculty"
                                ? "Faculty"
                                : u.userCredentials?.type === "guard"
                                ? "Guard"
                                : u.userCredentials?.type === "admin"
                                ? "Admin"
                                : "Visitor"}
                            </span>
                          )}
                        </td>

                        {/* STATUS */}
                        <td className="text-center">
                          {editingUserId === u._id ? (
                            <select
                              className="form-select form-select-sm"
                              value={editedUser.userCredentials?.status || "Active"}
                              onChange={(e) =>
                                handleCredChange("status", e.target.value)
                              }
                            >
                              <option value="Active">Active</option>
                              <option value="Inactive">Inactive</option>
                            </select>
                          ) : (
                            <span
                              className="px-2 py-1 rounded small"
                              style={{
                                background:
                                  u.userCredentials?.status === "Active"
                                    ? "#90EE90"
                                    : "#D4C9BE",
                              }}
                            >
                              {u.userCredentials?.status || ""}
                            </span>
                          )}
                        </td>

                        {/* ACTIONS */}
                        <td className="text-center">
                          {userAdvancedFilters.archived ? (
                            // Archived view: show Unarchive button for each row
                            <div className="d-flex justify-content-center gap-2">
                              <button
                                className="btn btn-sm"
                                style={{
                                  border: "1px solid #123458",
                                  color: "#123458",
                                }}
                                onClick={() => performUnarchive(u._id)}
                              >
                                Unarchive
                              </button>
                            </div>
                          ) : editingUserId === u._id ? (
                            <>
                              <button
                                className="btn btn-sm me-2"
                                style={{
                                  background: "#123458",
                                  color: "#F1EFEC",
                                }}
                                onClick={handleSave}
                              >
                                Save
                              </button>
                              <button
                                className="btn btn-sm border"
                                onClick={() => setEditingUserId(null)}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="btn btn-sm me-2"
                                style={{
                                  border: "1px solid #123458",
                                  color: "#123458",
                                }}
                                onClick={() => handleEditClick(u)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-sm"
                                style={{
                                  border: "1px solid #F08080",
                                  color: "#F08080",
                                }}
                                onClick={() => handleArchive(u._id)}
                                disabled={u.userCredentials?.type === "admin"}
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
              </div>

              {/* Mobile list (below md): stacked cards */}
              <div className="d-block d-md-none">
                {sortedUsers.length === 0 && <p className="text-center p-2">No users found.</p>}
                {sortedUsers.map((u, idx) => {
                  const creds = u.userCredentials || {};
                  const isEditing = editingUserId === u._id;
                  return (
                    <div key={u._id} className="card mb-2">
                      <div className="card-body p-2">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <strong>{u.firstname} {u.lastname}</strong>
                            <div className="small text-muted">
                              {creds.username || ""} • {creds.email || ""}
                            </div>
                          </div>

                          <div className="text-end small">
                            <div>{formatDate(
                              userAdvancedFilters.archived && u.archivedAt
                                ? u.archivedAt
                                : u.createdAt || u.registeredAt || u.updatedAt
                            )}</div>
                            <div className="mt-1">
                              {userAdvancedFilters.archived ? (
                                <input
                                  type="checkbox"
                                  checked={selectedArchivedIds.includes(u._id)}
                                  onChange={() => toggleSelectArchived(u._id)}
                                  aria-label={`Select archived user ${u.firstname} ${u.lastname}`}
                                />
                              ) : (
                                <span className="text-muted">#{idx + 1}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="d-flex gap-2 flex-wrap align-items-center mt-2">
                          <span className="px-2 py-1 rounded small border">
                            {creds.type === "student"
                              ? "Student"
                              : creds.type === "faculty"
                              ? "Faculty"
                              : creds.type === "guard"
                              ? "Guard"
                              : creds.type === "admin"
                              ? "Admin"
                              : "Visitor"}
                          </span>

                          <span
                            className="px-2 py-1 rounded small"
                            style={{
                              background: creds.status === "Active" ? "#90EE90" : "#D4C9BE",
                            }}
                          >
                            {creds.status || ""}
                          </span>

                          <div className="ms-auto d-flex gap-1">
                            {userAdvancedFilters.archived ? (
                              <button
                                className="btn btn-sm"
                                style={{
                                  border: "1px solid #123458",
                                  color: "#123458",
                                }}
                                onClick={() => performUnarchive(u._id)}
                              >
                                Unarchive
                              </button>
                            ) : isEditing ? (
                              <>
                                <button
                                  className="btn btn-sm"
                                  style={{ background: "#123458", color: "#fff" }}
                                  onClick={handleSave}
                                >
                                  Save
                                </button>
                                <button className="btn btn-sm border" onClick={() => setEditingUserId(null)}>
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className="btn btn-sm"
                                  style={{ border: "1px solid #123458", color: "#123458" }}
                                  onClick={() => handleEditClick(u)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="btn btn-sm"
                                  style={{ border: "1px solid #F08080", color: "#F08080" }}
                                  onClick={() => handleArchive(u._id)}
                                  disabled={creds.type === "admin"}
                                >
                                  Archive
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Inline edit fields on mobile */}
                        {isEditing && (
                          <div className="mt-2">
                            <div className="mb-1">
                              <input
                                className="form-control form-control-sm"
                                placeholder="First name"
                                value={editedUser.firstname || ""}
                                onChange={(e) =>
                                  setEditedUser((prev) => ({
                                    ...prev,
                                    firstname: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div className="mb-1">
                              <input
                                className="form-control form-control-sm"
                                placeholder="Last name"
                                value={editedUser.lastname || ""}
                                onChange={(e) =>
                                  setEditedUser((prev) => ({
                                    ...prev,
                                    lastname: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div className="mb-1">
                              <input
                                className="form-control form-control-sm"
                                value={editedUser.userCredentials?.username || ""}
                                onChange={(e) => handleCredChange("username", e.target.value)}
                                placeholder="Login ID"
                              />
                            </div>
                            <div className="mb-1">
                              <input
                                className="form-control form-control-sm"
                                value={editedUser.userCredentials?.email || ""}
                                onChange={(e) => handleCredChange("email", e.target.value)}
                                placeholder="Email"
                                type="email"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="px-3 py-2 small border-top text-muted">
          Showing {filteredUsers.length} of {visibleUsers.length} users • Updated{" "}
          {timeAgo(getLastUpdated())}
        </div>
      </div>

      {/* Archive confirmation modal */}
      {showArchiveModal && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Confirm Archive</h5>
              </div>
              <div className="modal-body">Are you sure you want to archive this user?</div>
              <div className="modal-footer">
                <button className="btn border" onClick={() => { setShowArchiveModal(false); setUserToArchive(null); }}>
                  Cancel
                </button>
                <button className="btn" style={{ backgroundColor: "#123458", color: "#fff" }} onClick={performArchive}>
                  Yes, Archive
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User filter panel portal */}
      <UserFilterPanel
        show={userFilterOpen}
        anchorRef={filterButtonRef}
        onClose={() => setUserFilterOpen(false)}
        onApply={(f) => handleApplyUserFilters(f)}
        onClear={() => {
          handleClearUserFilters();
          setUserFilterOpen(false);
        }}
        initialFilters={userAdvancedFilters}
      />

      {/* TOAST */}
      {toast.show && (
        <div
          className="position-fixed bottom-0 end-0 m-3 p-3 rounded"
          style={{
            background: toast.type === "danger" ? "#F08080" : "#90EE90",
            color: "#030303",
            zIndex: 2000,
            minWidth: 240,
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default UserManagement;