import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import UserFilterPanel from "./UserFilterPanel";
import { CiFilter } from "react-icons/ci";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editedUser, setEditedUser] = useState({});
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // Advanced user filter
  const [userFilterOpen, setUserFilterOpen] = useState(false);
  const [userAdvancedFilters, setUserAdvancedFilters] = useState({
    username: "",
    email: "",
    types: [],
    statuses: [],
  });

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
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users`);
        const data = await res.json();
        setUsers(data);
      } catch {
        showToast("Failed to load users", "danger");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [API_BASE_URL]);

  /* ---------------- ACTIONS ---------------- */
  const handleEditClick = (user) => {
    setEditingUserId(user._id);
    // deep copy so nested edits work properly
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

  const isValidUsername = (username, type) => {
    if (type === "visitor") return true;
    return /^\d{4}-\d{4}$/.test(username);
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSave = async () => {
    const { username, email, type } = editedUser.userCredentials;

    if (!isValidUsername(username, type)) {
      showToast(
        "Invalid username format. Use 0000-0000 for non-visitors.",
        "danger"
      );
      return;
    }

    if (!isValidEmail(email)) {
      showToast("Invalid email format.", "danger");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/users/${editedUser._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
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

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await fetch(`${API_BASE_URL}/api/users/${id}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u._id !== id));
      showToast("User deleted");
    } catch {
      showToast("Delete failed", "danger");
    }
  };

  /* ---------------- FILTERING ---------------- */
  const visibleUsers = users.filter(
    (u) =>
      u.userCredentials.type !== "admin" &&
      u.userCredentials.type !== "guard"
  );

  // helper to extract date portion (YYYY-MM-DD) from possible date fields
  const isoDateFor = (u) => {
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

    // date filter (matches user's created/registered/updated date)
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

    if (types.length > 0) {
      if (!types.includes(u.userCredentials?.type)) return false;
    }

    if (statuses.length > 0) {
      if (!statuses.includes(u.userCredentials?.status)) return false;
    }
    return true;
  });

  /* ---------------- TIME AGO ---------------- */
  const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getLastUpdated = () =>
    visibleUsers.length
      ? Math.max(...visibleUsers.map((u) => new Date(u.updatedAt)))
      : new Date();

  /* ---------------- User filter handlers ---------------- */
  const handleApplyUserFilters = (filters) => {
    setUserAdvancedFilters({
      username: filters.username || "",
      email: filters.email || "",
      types: filters.types || [],
      statuses: filters.statuses || [],
    });
    showToast("User filters applied", "success");
  };

  const handleClearUserFilters = () => {
    setUserAdvancedFilters({
      username: "",
      email: "",
      types: [],
      statuses: [],
    });
    showToast("User filters cleared", "success");
  };

  const handleClearAll = () => {
    setSearch("");
    setDateFilter("");
    handleClearUserFilters();
    setUserFilterOpen(false);
    showToast("All filters cleared", "success");
  };

  const activeUserFilterCount = (() => {
    let c = 0;

    if (userAdvancedFilters.username) c++;
    if (userAdvancedFilters.email) c++;

    if (userAdvancedFilters.types?.length)
      c += userAdvancedFilters.types.length;

    if (userAdvancedFilters.statuses?.length)
      c += userAdvancedFilters.statuses.length;

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

  return (
    <div className="container-fluid p-2">
      {/* PAGE HEADER */}
      <div
        className="d-flex justify-content-between mb-2 p-3 rounded"
        style={{ background: "#FFFFFF", border: "1px solid #D4C9BE" }}
      >
        <div>
          <h4 className="fw-semibold mb-1">User Account Management</h4>
          <small style={{ color: "#6b6b6b" }}>
            Manage, edit, and monitor all user accounts
          </small>
        </div>

        <div className="d-flex gap-2 align-items-center">
          {/* Date filter */}
          <input
            type="date"
            className="form-control mt-2"
            style={{ maxWidth: 170, height: "37px",  }}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            aria-label="Filter by date"
            title="Filter by date"
          />

          {/* Advanced filters button */}
          <button
            className="form-control border btn mt-2 d-flex align-items-center"
            onClick={() => setUserFilterOpen((v) => !v)}
            title="Advanced filters"
            style={{
              background: activeUserFilterCount > 0 ? "#123458" : "#fff",
              color: activeUserFilterCount > 0 ? "#F1EFEC" : "#030303",
              height: "37px",
              width: "auto",
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
            className="form-control btn border mt-2"
            onClick={handleClearAll}
            title="Clear filters/search"
            style={{ height: "37px", width: "100px" }}
          >
            Clear
          </button>

          {/* Search */}
          <input
            className="form-control mt-2"
            placeholder="Search user"
            style={{ maxWidth: 240, height: "37px", }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search users by name"
          />
        </div>
      </div>

      {/* TABLE CARD */}
      <div className="rounded" style={{ background: "#fff", border: "1px solid #D4C9BE" }}>
        <div className="px-3 py-2 fw-semibold border-bottom">
          User Accounts Overview
        </div>

        <div className="d-flex flex-column flex-grow-1">
          {loading ? (
            <p className="text-center p-3">Loading users…</p>
          ) : (
            <table className="table mb-0 align-middle">
              <colgroup>
                <col style={{ width: "4%" }} />   {/* # */}
                <col style={{ width: "24%" }} />  {/* Full Name */}
                <col style={{ width: "12%" }} />  {/* Username */}
                <col style={{ width: "24%" }} />  {/* Email */}
                <col style={{ width: "8%" }} />   {/* Date */}
                <col style={{ width: "8%" }} />   {/* Type */}  
                <col style={{ width: "8%" }} />   {/* Status */}
                <col style={{ width: "20%" }} />  {/* Actions */}
              </colgroup>
              <thead>
                <tr style={{ color: "#D4C9BE", fontSize: "0.9rem" }}>
                  <th style={{ position: "sticky", top: 0, background: "#FFF", zIndex: 2 }}>#</th>
                  <th style={{ position: "sticky", top: 0, background: "#FFF", zIndex: 2 }}>Full Name</th>
                  <th style={{ position: "sticky", top: 0, background: "#FFF", zIndex: 2 }}>Username</th>
                  <th style={{ position: "sticky", top: 0, background: "#FFF", zIndex: 2 }}>Email</th>
                  <th title="account creation date" style={{ position: "sticky", top: 0, background: "#FFF", zIndex: 2 }}>Date</th>
                  <th style={{ position: "sticky", top: 0, background: "#FFF", zIndex: 2 }}>Type</th>
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, i) => (
                  <tr key={u._id}>
                    <td>{i + 1}</td>
                    
                    {/* FULL NAME */}
                    <td>
                      {editingUserId === u._id ? (
                        <div className="d-flex gap-1">
                          <input
                            className="form-control form-control-sm"
                            placeholder="First name"
                            value={editedUser.firstname}
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
                            value={editedUser.lastname}
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
                          value={editedUser.userCredentials.username}
                          onChange={(e) =>
                            handleCredChange("username", e.target.value)
                          }
                        />
                      ) : (
                        u.userCredentials.username
                      )}
                    </td>

                    {/* EMAIL */}
                    <td>
                      {editingUserId === u._id ? (
                        <input
                          type="email"
                          className="form-control form-control-sm"
                          value={editedUser.userCredentials.email}
                          onChange={(e) =>
                            handleCredChange("email", e.target.value)
                          }
                        />
                      ) : (
                        u.userCredentials.email
                      )}
                    </td>

                    {/* DATE */}
                    <td>
                      <small className="text-muted">{formatDate(u.createdAt || u.registeredAt || u.updatedAt)}</small>
                    </td>

                    {/* TYPE */}
                    <td>
                      {editingUserId === u._id ? (
                        <select
                          className="form-select form-select-sm"
                          value={editedUser.userCredentials.type}
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
                          {u.userCredentials.type}
                        </span>
                      )}
                    </td>

                    {/* STATUS */}
                    <td className="text-center">
                      {editingUserId === u._id ? (
                        <select
                          className="form-select form-select-sm"
                          value={editedUser.userCredentials.status}
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
                              u.userCredentials.status === "Active"
                                ? "#90EE90"
                                : "#D4C9BE",
                          }}
                        >
                          {u.userCredentials.status}
                        </span>
                      )}
                    </td>

                    {/* ACTIONS */}
                    <td className="text-center">
                      {editingUserId === u._id ? (
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
                            onClick={() => handleDelete(u._id)}
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

        <div className="px-3 py-2 small border-top text-muted">
          Showing {filteredUsers.length} of {visibleUsers.length} users • Updated{" "}
          {timeAgo(getLastUpdated())}
        </div>
      </div>

      {/* User filter panel portal */}
      <UserFilterPanel
        show={userFilterOpen}
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