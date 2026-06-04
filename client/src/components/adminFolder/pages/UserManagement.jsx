import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import UserFilterPanel from "./UserFilterPanel";
import { BsSearch, BsArrowCounterclockwise } from "react-icons/bs";
import { CiFilter } from "react-icons/ci";
import { FaSortUp, FaSortDown, FaUser, FaEnvelope, FaUserTag, FaShieldAlt, FaToggleOn, FaSave, FaTimes, FaArchive, FaFilter, FaEdit, FaUndo, FaEllipsisV, FaCalendarAlt } from "react-icons/fa";
import { TiArrowUnsorted } from "react-icons/ti";
import { fetchWithAuth } from "../../../utils/fetchWithAuth";

/**
 * Responsive UserManagement:
 * - Desktop (md+): table view (unchanged visually).
 * - Mobile (below md): stacked card list with the same actions.
 * - Header controls wrap and stretch on small screens for usability.
 * - Guest accounts are excluded from display (both desktop & mobile)
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
  const [showEditModal, setShowEditModal] = useState(false);

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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);
  const [activeMenuId, setActiveMenuId] = useState(null);

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
      setLoading(true);
      try {
        const url = userAdvancedFilters.archived
          ? `${API_BASE_URL}/api/users?archived=true`
          : `${API_BASE_URL}/api/users`;

        const res = await fetchWithAuth(url, { credentials: "include" });
        const data = await res.json();

        if (isMounted) {
          if (Array.isArray(data)) {
            setUsers(data);
          } else {
            console.error("Invalid response format:", data);
            setUsers([]);
            showToast("Failed to load users format", "danger");
          }
        }
      } catch {
        if (isMounted) showToast("Failed to load users", "danger");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, [API_BASE_URL, userAdvancedFilters.archived]);

  /* ---------------- ACTIONS ---------------- */
  const handleEditClick = (user) => {
    setEditingUserId(user._id);
    setEditedUser(JSON.parse(JSON.stringify(user)));
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingUserId(null);
    setEditedUser({});
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
    // For non-students: check length between 8 and 16 characters
    return typeof username === "string" && username.trim().length >= 8 && username.trim().length <= 16;
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
      // Build a flat body that matches what the backend updateUser expects
      const creds = editedUser.userCredentials || {};
      const payload = {
        firstname: editedUser.firstname,
        lastname: editedUser.lastname,
        username: creds.username,  // ✅ ADD THIS
        email: creds.email,
        status: creds.status,
        type: creds.type,
        institute: creds.institute,
        program: creds.program,
      };

      const res = await fetchWithAuth(
        `${API_BASE_URL}/api/users/${editedUser._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const updated = await res.json();

      if (!res.ok) {
        showToast(updated.error || updated.errorMessage || "Update failed", "danger");
        return;
      }

      setUsers((prev) =>
        prev.map((u) => (u._id === updated._id ? updated : u))
      );

      setEditingUserId(null);
      setEditedUser({});
      setShowEditModal(false);
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

  /* ---------------- FILTERING (EXCLUDING GUESTS) ---------------- */
  const visibleUsers = useMemo(() => {
    return users.filter((u) => {
      // ✅ EXCLUDE GUEST ACCOUNTS
      if (u.isGuest) return false;
      
      return userAdvancedFilters.archived ? Boolean(u.archivedAt) : !u.archivedAt;
    });
  }, [users, userAdvancedFilters.archived]);

  const isoDateFor = useCallback((u) => {
    if (userAdvancedFilters.archived && u.archivedAt) {
      try {
        return new Date(u.archivedAt).toISOString().slice(0, 10);
      } catch {}
    }
    const possible = u.createdAt || u.registeredAt || u.updatedAt || "";
    try {
      return new Date(possible).toISOString().slice(0, 10);
    } catch {
      return "";
    }
  }, [userAdvancedFilters.archived]);

  const filteredUsers = useMemo(() => {
    return visibleUsers.filter((u) => {
      const fullName = `${u.firstname || ""} ${u.lastname || ""}`.toLowerCase();
      if (search && !fullName.includes(search.toLowerCase())) return false;

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
  }, [visibleUsers, search, dateFilter, userAdvancedFilters, isoDateFor]);

  /* ---------------- SORTING ---------------- */
  const sortedUsers = useMemo(() => {
    const typeOrderAsc = ["student", "faculty", "visitor", "guard", "admin"];
    const typeOrderDesc = [...typeOrderAsc].reverse();

    const statusOrderAsc = ["Active", "Inactive"];
    const statusOrderDesc = [...statusOrderAsc].reverse();

    let sorted = [...filteredUsers];

    if (sortField && sortOrder) {
      sorted.sort((a, b) => {
        if (sortField === "date") {
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
          return order.indexOf(a.userCredentials.type) - order.indexOf(b.userCredentials.type);
        }

        if (sortField === "status") {
          const order = sortOrder === "asc" ? statusOrderAsc : statusOrderDesc;
          return order.indexOf(a.userCredentials.status) - order.indexOf(b.userCredentials.status);
        }

        return 0;
      });
    }
    return sorted;
  }, [filteredUsers, sortField, sortOrder, userAdvancedFilters.archived]);

  /* ---------------- PAGINATION LOGIC ---------------- */
  useEffect(() => {
    setCurrentPage(1);
  }, [search, dateFilter, userAdvancedFilters]);

  const totalPages = Math.ceil(sortedUsers.length / usersPerPage);
  
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * usersPerPage;
    return sortedUsers.slice(start, start + usersPerPage);
  }, [sortedUsers, currentPage, usersPerPage]);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

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

  const activeUserFilterCount = useMemo(() => {
    let c = 0;
    if (userAdvancedFilters.username) c++;
    if (userAdvancedFilters.email) c++;
    if (userAdvancedFilters.types?.length) c += userAdvancedFilters.types.length;
    if (userAdvancedFilters.statuses?.length) c += userAdvancedFilters.statuses.length;
    if (userAdvancedFilters.archived) c++;
    return c;
  }, [userAdvancedFilters]);

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

  const clearAllSelected = () => setSelectedArchivedIds([]);

  const toggleSelectAll = () => {
    const ids = sortedUsers.map((u) => u._id);
    if (ids.length === 0) return;
    const allSelected = ids.every((id) => selectedArchivedIds.includes(id));
    if (allSelected) clearAllSelected();
    else setSelectedArchivedIds(ids);
  };

  const isAllSelected = useMemo(() => {
    const ids = sortedUsers.map((u) => u._id);
    return ids.length > 0 && ids.every((id) => selectedArchivedIds.includes(id));
  }, [sortedUsers, selectedArchivedIds]);

  return (
    <div className="container-fluid p-2 d-flex flex-column" style={{ height: "100%" }}>
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
          {/* Date filter with icon */}
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <FaCalendarAlt
              style={{
                position: "absolute",
                left: "10px",
                color: "#6b6b6b",
                pointerEvents: "none",
                zIndex: 1,
              }}
              size={14}
            />
            <input
              type="date"
              className="form-control"
              style={{ 
                maxWidth: 160, 
                height: "37px", 
                border: "1px solid #D4C9BE",
                paddingLeft: "36px", // Make room for icon
              }}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="Filter by date"
              title="Filter by date"
            />
          </div>

          {/* Advanced filters button */}
          <button
            ref={filterButtonRef}
            className="btn d-inline-flex align-items-center position-relative"
            onClick={() => setUserFilterOpen((v) => !v)}
            title="Advanced filters"
            style={{
              border: userFilterOpen ? "2px solid #123458" : "1px solid #D4C9BE",
              background: activeUserFilterCount > 0 ? "#123458" : "#fff",
              color: activeUserFilterCount > 0 ? "#fff" : "#123458",
              height: "37px",
              padding: "0 10px",
              whiteSpace: "nowrap",
            }}
            aria-expanded={userFilterOpen}
            aria-pressed={userFilterOpen}
          >
            <CiFilter size={20} />
            <span className="d-none d-md-inline ms-1">Filters</span>
            {activeUserFilterCount > 0 && (
              <span
                className="position-absolute badge rounded-pill"
                style={{ 
                  top: "-4px",
                  right: "2px",
                  background: "#F08080", 
                  color: "#030303",
                  fontSize: "0.65rem",
                  border: "2px solid #fff",
                  zIndex: 1,
                  padding: "4px 6px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                }}
              >
                {activeUserFilterCount}
              </span>
            )}
          </button>

          {/* Clear filters */}
          <button
            className="form-control btn d-flex align-items-center justify-content-center"
            onClick={handleClearAll}
            title="Clear filters/search"
            style={{ height: "37px", width: "auto", minWidth: "42px", border: "1px solid #D4C9BE" }}
          >
            <BsArrowCounterclockwise className="d-md-none" />
            <span className="d-none d-md-inline">Clear</span>
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
      <div className="rounded d-flex flex-column flex-grow-1 shadow-sm" style={{ background: "#fff", border: "1px solid #D4C9BE", minHeight: 0, overflow: "hidden" }}>
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

        <div className="flex-grow-1 overflow-auto" style={{ minHeight: 0 }}>
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
                  </colgroup>                   <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#FFF" }}>
                    <tr style={{ color: "#D4C9BE", fontSize: "0.9rem" }}>
                      <th style={{ background: "#FFF", padding: "12px 8px", borderBottom: "2px solid #f0f2f5" }}>
                        {userAdvancedFilters.archived ? (
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={toggleSelectAll}
                            aria-label="Select all displayed archived users"
                          />
                        ) : (
                          "#"
                        )}
                      </th>
                      <th style={{ background: "#FFF", padding: "12px 8px", borderBottom: "2px solid #f0f2f5" }}>Full Name</th>
                      <th style={{ background: "#FFF", padding: "12px 8px", borderBottom: "2px solid #f0f2f5" }}>Login ID</th>
                      <th style={{ background: "#FFF", padding: "12px 8px", borderBottom: "2px solid #f0f2f5" }}>Email</th>
                      <th
                        onClick={() => toggleSort("date")}
                        style={{ cursor: "pointer", background: "#FFF", padding: "12px 8px", borderBottom: "2px solid #f0f2f5" }}
                      >
                        {userAdvancedFilters.archived ? "Archived Date" : "Date"} {renderSortIcon("createdAt")}
                      </th>
                      <th
                        onClick={() => toggleSort("type")}
                        style={{ cursor: "pointer", background: "#FFF", padding: "12px 8px", borderBottom: "2px solid #f0f2f5" }}
                      >
                        Type {renderSortIcon("type")}
                      </th>

                      <th
                        className="text-center"
                        onClick={() => toggleSort("status")}
                        style={{ cursor: "pointer", background: "#FFF", padding: "12px 8px", borderBottom: "2px solid #f0f2f5" }}
                      >
                        Status {renderSortIcon("status")}
                      </th>

                      <th
                        className="text-center"
                        style={{ background: "#FFF", padding: "12px 8px", borderBottom: "2px solid #f0f2f5" }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedUsers.map((u, i) => {
                      const creds = u.userCredentials || {};
                      return (
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
                              i + 1 + (currentPage - 1) * usersPerPage
                            )}
                          </td>

                          {/* FULL NAME */}
                          <td>{u.firstname} {u.lastname}</td>

                          {/* USERNAME */}
                          <td>{creds.username || ""}</td>

                          {/* EMAIL */}
                          <td>{creds.email || ""}</td>

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
                          </td>

                          {/* STATUS */}
                          <td className="text-center">
                            <span
                              className="px-2 py-1 rounded small"
                              style={{
                                background:
                                  creds.status === "Active" ? "#90EE90" : "#D4C9BE",
                              }}
                            >
                              {creds.status || ""}
                            </span>
                          </td>

                          {/* ACTIONS */}
                          <td className="text-center">
                            <div className="d-flex justify-content-center gap-1">
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
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile list (below md): stacked cards */}
              <div className="d-block d-md-none">
                {paginatedUsers.length === 0 && <p className="text-center p-2">No users found.</p>}
                {paginatedUsers.map((u, idx) => {
                  const creds = u.userCredentials || {};
                  const isEditing = editingUserId === u._id;
                  const actualIdx = idx + 1 + (currentPage - 1) * usersPerPage;
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
                                <span className="text-muted">#{actualIdx}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="d-flex gap-2 flex-nowrap align-items-center mt-2 justify-content-between">
                          <div className="d-flex gap-1 align-items-center flex-shrink-1 overflow-hidden">
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
                        </div>

                          <div className="d-flex gap-2 align-items-center position-relative flex-shrink-0">
                            {userAdvancedFilters.archived ? (
                              <button
                                className="btn btn-sm d-flex align-items-center justify-content-center p-2 rounded-2 shadow-sm"
                                style={{ border: "1px solid #123458", color: "#123458", width: "32px", height: "32px" }}
                                onClick={() => performUnarchive(u._id)}
                                title="Unarchive"
                              >
                                <FaUndo size={14} />
                              </button>
                            ) : (
                                <>
                                  <button
                                    className="btn btn-sm d-flex align-items-center justify-content-center p-2 rounded-2 shadow-sm"
                                    style={{ border: "1px solid #123458", color: "#123458", width: "32px", height: "32px" }}
                                    onClick={() => handleEditClick(u)}
                                    title="Edit User"
                                  >
                                    <FaEdit size={14} />
                                  </button>
                                  <button
                                    className="btn btn-sm d-flex align-items-center justify-content-center p-2 rounded-2 shadow-sm"
                                    style={{ border: "1px solid #F08080", color: "#F08080", width: "32px", height: "32px" }}
                                    onClick={() => handleArchive(u._id)}
                                    disabled={creds.type === "admin"}
                                    title="Archive User"
                                  >
                                    <FaArchive size={14} />
                                  </button>
                                </>
                            )}
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
              <span className="d-none d-sm-inline text-muted fw-normal">Found</span> {sortedUsers.length}{" "}
              <span className="d-none d-sm-inline text-muted fw-normal">users.</span>{" "}
              <span className="fw-bold">{sortedUsers.length === 0 ? 0 : (currentPage - 1) * usersPerPage + 1}-{Math.min(currentPage * usersPerPage, sortedUsers.length)}</span>
              <span className="text-muted fw-normal ms-1">of {sortedUsers.length}</span>
            </div>

            <div className="d-flex align-items-center gap-1 ms-auto ms-sm-2">
              <small className="text-muted d-none d-sm-inline" style={{ fontSize: "0.75rem" }}>Rows:</small>
              <select
                className="form-select form-select-sm py-0 px-1"
                style={{ width: "55px", fontSize: "0.75rem", height: "24px", border: "1px solid #D4C9BE" }}
                value={usersPerPage}
                onChange={(e) => {
                  setUsersPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                {[5, 10, 15, 20, 50].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="d-flex align-items-center gap-1">
            <button
              className="btn btn-sm py-1 px-2 border d-flex align-items-center gap-1 shadow-none"
              style={{ fontSize: "0.8rem", background: "#fff", borderColor: "#D4C9BE", color: "#123458" }}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            >
              Prev
            </button>

            <div className="d-none d-sm-flex gap-1 mx-1">
              {getPageNumbers().map((num, idx) => (
                <React.Fragment key={idx}>
                  {num === "..." ? (
                    <span className="text-muted px-1 small">...</span>
                  ) : (
                    <button
                      className={`btn btn-sm py-0 px-2 shadow-none ${currentPage === num ? "btn-dark" : "btn-light border"}`}
                      style={{ 
                        fontSize: "0.75rem", 
                        height: "24px", 
                        minWidth: "24px",
                        color: currentPage === num ? "#fff" : "#123458"
                      }}
                      onClick={() => typeof num === "number" && setCurrentPage(num)}
                    >
                      {num}
                    </button>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Mobile simplified page indicator */}
            <div className="d-flex d-sm-none align-items-center px-2 small text-muted" style={{ fontSize: "0.75rem" }}>
              Page {currentPage} of {totalPages || 1}
            </div>

            <button
              className="btn btn-sm py-1 px-2 border d-flex align-items-center gap-1 shadow-none"
              style={{ fontSize: "0.8rem", background: "#fff", borderColor: "#D4C9BE", color: "#123458" }}
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            >
              Next
            </button>
          </div>
        </div>

        <div className="px-3 py-1 small border-top text-muted text-center" style={{ background: "#fdfdfd", fontSize: "0.7rem" }}>
          Updated {timeAgo(getLastUpdated())}
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
      )}      {/* Edit User Modal */}
      {showEditModal && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,.5)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: "15px" }}>
              <div className="modal-header border-0 px-4 pt-4">
                <h5 className="modal-title fw-bold" style={{ color: "#123458" }}>Edit User Profile</h5>
                <button type="button" className="btn-close shadow-none" onClick={handleCloseEditModal}></button>
              </div>
              <div className="modal-body px-4">
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-bold text-muted text-uppercase">First Name</label>
                    <input
                      className="form-control rounded-3"
                      placeholder="First name"
                      value={editedUser.firstname || ""}
                      onChange={(e) => setEditedUser(prev => ({ ...prev, firstname: e.target.value }))}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-bold text-muted text-uppercase">Last Name</label>
                    <input
                      className="form-control rounded-3"
                      placeholder="Last name"
                      value={editedUser.lastname || ""}
                      onChange={(e) => setEditedUser(prev => ({ ...prev, lastname: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted text-uppercase">Username (Login ID)</label>
                  <input
                    className="form-control rounded-3"
                    value={editedUser.userCredentials?.username || ""}
                    onChange={(e) => handleCredChange("username", e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted text-uppercase">Email Address</label>
                  <input
                    className="form-control rounded-3"
                    type="email"
                    value={editedUser.userCredentials?.email || ""}
                    onChange={(e) => handleCredChange("email", e.target.value)}
                  />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-bold text-muted text-uppercase">Account Type</label>
                    <select
                      className="form-select rounded-3"
                      disabled={editedUser.userCredentials?.type === "admin" || editedUser.userCredentials?.type === "guard"}
                      value={editedUser.userCredentials?.type || ""}
                      onChange={(e) => handleCredChange("type", e.target.value)}
                    >
                      <option value="student">Student</option>
                      <option value="faculty">Faculty</option>
                      <option value="visitor">Visitor</option>
                      {(editedUser.userCredentials?.type === "admin" || editedUser.userCredentials?.type === "guard") && (
                        <option value={editedUser.userCredentials.type}>{editedUser.userCredentials.type}</option>
                      )}
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-bold text-muted text-uppercase">Status</label>
                    <select
                      className="form-select rounded-3"
                      value={editedUser.userCredentials?.status || "Active"}
                      onChange={(e) => handleCredChange("status", e.target.value)}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 px-4 pb-4">
                <button className="btn btn-light px-4 flex-grow-1 fw-bold" onClick={handleCloseEditModal} style={{ borderRadius: "10px" }}>
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

export default UserManagement;
