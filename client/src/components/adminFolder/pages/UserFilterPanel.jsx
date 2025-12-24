import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function UserFilterPanel({
  show,
  onClose,
  onApply,
  onClear,
  initialFilters = {},
}) {
  const userTypeOptions = ["student", "faculty", "visitor"];
  const statusOptions = ["Active", "Inactive"];

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [types, setTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const panelRef = useRef(null);

  useEffect(() => {
    setUsername(initialFilters.username || "");
    setEmail(initialFilters.email || "");
    setTypes(initialFilters.types || []);
    setStatuses(initialFilters.statuses || []);
  }, [initialFilters]);

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
      className="position-fixed p-3 rounded"
      style={{
        top: 120,
        right: 20,
        zIndex: 3000,
        width: 320,
        background: "#FFFFFF",
        border: "1px solid #030303",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      }}
      role="dialog"
      aria-modal="true"
    >
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <strong>Advanced Filter</strong>
        <button className="btn btn-sm" onClick={onClose} style={{
            border: "1px solid #D4C9BE",
            background: "#F1EFEC",
          }}>✕</button>
      </div>

      {/* Username */}
      <div className="mb-2">
        <label className="small">Username</label>
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

      {/* User Type (CHECKBOX UI) */}
      <div className="mb-3">
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
                id={`type-${type}`}
                checked={types.includes(type)}
                onChange={() => toggleType(type)}
              />
              <label
                className="form-check-label"
                htmlFor={`type-${type}`}
                style={{ fontSize: ".85rem" }}
              >
                {type}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Status (CHECKBOX UI) */}
      <div className="mb-3">
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
                id={`status-${status}`}
                checked={statuses.includes(status)}
                onChange={() => toggleStatus(status)}
              />
              <label
                className="form-check-label"
                htmlFor={`status-${status}`}
                style={{ fontSize: ".85rem" }}
              >
                {status}
              </label>
            </div>
          ))}
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
            onApply?.({
              username,
              email,
              types,
              statuses,
            });
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
