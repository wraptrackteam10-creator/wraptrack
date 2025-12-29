import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function UserFilterPanel({
  show,
  onClose,
  onApply,
  onClear,
  initialFilters = {},
  anchorRef,
}) {
  const userTypeOptions = ["student", "faculty", "visitor", "guard", "admin"];
  const statusOptions = ["Active", "Inactive"];

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [types, setTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [archived, setArchived] = useState(false); // NEW: archived toggle
  const [position, setPosition] = useState({ left: 0, top: 0 });

  const panelRef = useRef(null);

  useEffect(() => {
    setUsername(initialFilters.username || "");
    setEmail(initialFilters.email || "");
    setTypes(initialFilters.types || []);
    setStatuses(initialFilters.statuses || []);
    setArchived(Boolean(initialFilters.archived)); // initialize archived toggle
  }, [initialFilters]);

  // POSITION UNDER BUTTON
  useEffect(() => {
    if (!show || !anchorRef?.current) return;

    const rect = anchorRef.current.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    setPosition({
      left: rect.left + scrollX,
      top: rect.bottom + scrollY + 8,
    });
  }, [show, anchorRef]);

  const toggleType = (type) => {
    setTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleStatus = (status) => {
    setStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  if (!show) return null;

  return createPortal(
    <div
      ref={panelRef}
      className="position-absolute p-3 rounded"
      style={{
        left: position.left,
        top: position.top,
        zIndex: 3000,
        width: 320,
        background: "#FFFFFF",
        border: "1px solid #030303",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      }}
      role="dialog"
      aria-modal="true"
    >
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <strong>Advanced Filter</strong>
        <button
          className="btn btn-sm"
          onClick={onClose}
          style={{
            border: "1px solid #D4C9BE",
            background: "#F1EFEC",
          }}
          aria-label="Close filters"
        >
          ✕
        </button>
      </div>

      {/* Login ID */}
      <div className="mb-2">
        <label className="small">Login ID</label>
        <input
          className="form-control form-control-sm"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      {/* Email */}
      <div className="mb-3">
        <label className="small">Email</label>
        <input
          className="form-control form-control-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="d-flex justify-content-between gap-2">
        {/* User Type */}
        <div className="mb-3 flex-grow-1">
          <label className="form-label mb-1" style={{ fontSize: ".8rem" }}>
            User Type
          </label>
          <div
            style={{
              maxHeight: 110,
              overflowY: "auto",
              border: "1px solid #D4C9BE",
              padding: 8,
              borderRadius: 4,
            }}
          >
            {userTypeOptions.map((type) => (
              <div className="form-check" key={type}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={types.includes(type)}
                  onChange={() => toggleType(type)}
                />
                <label className="form-check-label" style={{ fontSize: ".85rem" }}>
                  {type}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="mb-3 flex-grow-1">
          <label className="form-label mb-1" style={{ fontSize: ".8rem" }}>
            Status
          </label>
          <div
            style={{
              border: "1px solid #D4C9BE",
              padding: 8,
              borderRadius: 4,
            }}
          >
            {statusOptions.map((status) => (
              <div className="form-check" key={status}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={statuses.includes(status)}
                  onChange={() => toggleStatus(status)}
                />
                <label className="form-check-label" style={{ fontSize: ".85rem" }}>
                  {status}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Archived toggle */}
      <div
        className="d-flex justify-content-between align-items-center mt-2 mb-3 px-2 py-2 rounded"
        style={{ border: "1px solid #D4C9BE", background: "#F9F8F6" }}
      >
        <div>
          <div style={{ fontSize: ".85rem", fontWeight: 500 }}>
            Archived users
          </div>
          <small style={{ fontSize: ".75rem", color: "#6b6b6b" }}>
            Show only archived accounts 
          </small>
        </div>
        <div className="form-check form-switch m-0">
          <input
            className="form-check-input"
            type="checkbox"
            checked={archived}
            onChange={(e) => setArchived(e.target.checked)}
            aria-label="Show archived users only"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="d-flex justify-content-end gap-2">
        <button
          className="btn btn-sm border"
          onClick={() => {
            setUsername("");
            setEmail("");
            setTypes([]);
            setStatuses([]);
            setArchived(false);
            onClear?.();
            onClose?.();
          }}
        >
          Clear
        </button>
        <button
          className="btn btn-sm"
          style={{ background: "#123458", color: "#F1EFEC" }}
          onClick={() => {
            onApply?.({ username, email, types, statuses, archived });
            onClose?.();
          }}
        >
          Apply
        </button>
      </div>
    </div>,
    document.body
  );
}