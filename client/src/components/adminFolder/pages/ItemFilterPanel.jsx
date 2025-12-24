import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Floating Item advanced filter panel.
 * Props:
 *  - show: boolean
 *  - onClose: () => void
 *  - onApply: (filters) => void
 *  - onClear: () => void
 *  - initialFilters: { name, descriptions, penaltyMode, penaltyMin, penaltyMax, dateFrom, dateTo }
 *  - anchorRef: ref of element to anchor the panel to (optional)
 */
export default function ItemFilterPanel({
  show,
  onClose,
  onApply,
  onClear,
  initialFilters = {},
  anchorRef,
}) {
  const descriptionOptions = [
    "Disposable Water Bottle",
    "Reusable Water Bottle",
    "Reusable Tupperware",
    "Disposable Straw",
    "Disposable Snack",
    "Disposable Plastic Utensil",
    "Disposable Plastic Gloves",
    "Disposable Plastic",
    "Non-disposable Item",
    "Disposable Beverage",
  ];

  const [name, setName] = useState(initialFilters.name || "");
  const [descriptions, setDescriptions] = useState(initialFilters.descriptions || []);
  const [penaltyMode, setPenaltyMode] = useState(initialFilters.penaltyMode || "any");
  const [penaltyMin, setPenaltyMin] = useState(initialFilters.penaltyMin ?? "");
  const [penaltyMax, setPenaltyMax] = useState(initialFilters.penaltyMax ?? "");
  const [dateFrom, setDateFrom] = useState(initialFilters.dateFrom || "");
  const [dateTo, setDateTo] = useState(initialFilters.dateTo || "");

  const panelRef = useRef(null);
  const [position, setPosition] = useState({ left: 0, top: 0, transformOrigin: "top left" });
  const PANEL_WIDTH = 320;
  const VIEWPORT_PADDING = 8;

  useEffect(() => {
    setName(initialFilters.name || "");
    setDescriptions(initialFilters.descriptions || []);
    setPenaltyMode(initialFilters.penaltyMode || "any");
    setPenaltyMin(initialFilters.penaltyMin ?? "");
    setPenaltyMax(initialFilters.penaltyMax ?? "");
    setDateFrom(initialFilters.dateFrom || "");
    setDateTo(initialFilters.dateTo || "");
  }, [initialFilters]);

  // position logic similar to other FilterPanel (anchors to anchorRef if provided)
  useEffect(() => {
    if (!show) return;
    const computePosition = () => {
      const anchor = anchorRef?.current;
      if (!anchor) {
        setPosition({ left: VIEWPORT_PADDING, top: VIEWPORT_PADDING + 42, transformOrigin: "top left" });
        return;
      }

      const rect = anchor.getBoundingClientRect();
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;
      let left = rect.left + scrollX;
      let top = rect.bottom + scrollY + 8;

      // ensure left within viewport
      if (left + PANEL_WIDTH + VIEWPORT_PADDING > scrollX + window.innerWidth) {
        left = Math.max(VIEWPORT_PADDING + scrollX, scrollX + window.innerWidth - PANEL_WIDTH - VIEWPORT_PADDING);
      }
      left = Math.max(left, VIEWPORT_PADDING + scrollX);

      const panelHeight = panelRef.current ? panelRef.current.offsetHeight : 260;
      const viewportBottom = scrollY + window.innerHeight - VIEWPORT_PADDING;
      if (top + panelHeight > viewportBottom) {
        const aboveTop = rect.top + scrollY - panelHeight - 8;
        if (aboveTop >= scrollY + VIEWPORT_PADDING) {
          top = aboveTop;
          setPosition((p) => ({ ...p, transformOrigin: "bottom left" }));
        } else {
          top = Math.max(scrollY + VIEWPORT_PADDING, viewportBottom - panelHeight);
          setPosition((p) => ({ ...p, transformOrigin: "top left" }));
        }
      } else {
        setPosition((p) => ({ ...p, transformOrigin: "top left" }));
      }

      setPosition({ left, top, transformOrigin: (panelRef.current && top < rect.top + scrollY) ? "bottom left" : "top left" });
    };

    const raf = requestAnimationFrame(computePosition);
    const onResize = () => computePosition();
    const onScroll = () => computePosition();

    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
    };
  }, [show, anchorRef]);

  const toggleDescription = (option) => {
    setDescriptions((prev) => (prev.includes(option) ? prev.filter((d) => d !== option) : [...prev, option]));
  };

  const handleApply = () => {
    onApply?.({
      name: name.trim(),
      descriptions,
      penaltyMode,
      penaltyMin: penaltyMin === "" ? "" : Number(penaltyMin),
      penaltyMax: penaltyMax === "" ? "" : Number(penaltyMax),
      dateFrom: dateFrom || "",
      dateTo: dateTo || "",
    });
    onClose?.();
  };

  const handleClear = () => {
    setName("");
    setDescriptions([]);
    setPenaltyMode("any");
    setPenaltyMin("");
    setPenaltyMax("");
    setDateFrom("");
    setDateTo("");
    onClear?.();
    onClose?.();
  };

  if (!show) return null;

  const panel = (
    <div
      ref={panelRef}
      className="position-absolute p-3 rounded"
      style={{
        zIndex: 3000,
        width: PANEL_WIDTH,
        background: "#FFFFFF",
        border: "1px solid #030303",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        color: "#030303",
        left: position.left,
        top: position.top,
        transformOrigin: position.transformOrigin,
      }}
      role="dialog"
      aria-modal="true"
    >
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <strong style={{ fontSize: "0.95rem" }}>Advanced Filter</strong>
        <button
          className="btn btn-sm"
          onClick={onClose}
          aria-label="Close filter"
          style={{
            border: "1px solid #D4C9BE",
            background: "#F1EFEC",
          }}
        >
          ✕
        </button>
      </div>

      {/* Owner name */}
      <div className="mb-3">
        <label className="form-label mb-1" style={{ fontSize: ".8rem" }}>
          Owner name
        </label>
        <input
          className="form-control form-control-sm"
          placeholder="Owner name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ border: "1px solid #D4C9BE" }}
        />
      </div>

      {/* Description (checkbox list) */}
      <div className="mb-3">
        <label className="form-label mb-1" style={{ fontSize: ".8rem" }}>
          Description
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
          {descriptionOptions.map((opt) => (
            <div className="form-check" key={opt}>
              <input
                id={`desc-${opt}`}
                className="form-check-input"
                type="checkbox"
                checked={descriptions.includes(opt)}
                onChange={() => toggleDescription(opt)}
              />
              <label className="form-check-label" htmlFor={`desc-${opt}`} style={{ fontSize: ".85rem" }}>
                {opt}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Penalty */}
      <div className="mb-3">
        <label className="form-label mb-1" style={{ fontSize: ".8rem" }}>
          Penalty
        </label>

        <div className="d-flex gap-3">
          {["any", "penalty", "no-penalty"].map((mode) => (
            <div className="form-check" key={mode}>
              <input
                className="form-check-input"
                type="radio"
                name="penaltyMode"
                id={`pen-${mode}`}
                checked={penaltyMode === mode}
                onChange={() => setPenaltyMode(mode)}
              />
              <label className="form-check-label" htmlFor={`pen-${mode}`} style={{ fontSize: ".85rem" }}>
                {mode === "any" ? "Any" : mode === "penalty" ? "Penalty" : "No Penalty"}
              </label>
            </div>
          ))}
        </div>

        <div className="d-flex gap-2 mt-2">
          <input
            type="number"
            className="form-control form-control-sm"
            placeholder="Min"
            value={penaltyMin}
            onChange={(e) => setPenaltyMin(e.target.value)}
            min={0}
            style={{ maxWidth: 100, border: "1px solid #D4C9BE" }}
          />
          <input
            type="number"
            className="form-control form-control-sm"
            placeholder="Max"
            value={penaltyMax}
            onChange={(e) => setPenaltyMax(e.target.value)}
            min={0}
            style={{ maxWidth: 100, border: "1px solid #D4C9BE" }}
          />
        </div>
      </div>

      {/* Date range */}
      <div className="mb-3">
        <label className="form-label mb-1" style={{ fontSize: ".8rem" }}>
          Date range
        </label>
        <div className="d-flex gap-2">
          <input
            type="date"
            className="form-control form-control-sm"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{ border: "1px solid #D4C9BE" }}
          />
          <input
            type="date"
            className="form-control form-control-sm"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{ border: "1px solid #D4C9BE" }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="d-flex justify-content-end gap-2 mt-2">
        <button
          className="btn btn-sm"
          onClick={handleClear}
          style={{
            border: "1px solid #D4C9BE",
            background: "#FFFFFF",
            color: "#030303",
          }}
        >
          Clear
        </button>
        <button
          className="btn btn-sm"
          onClick={handleApply}
          style={{
            background: "#123458",
            color: "#F1EFEC",
          }}
        >
          Apply
        </button>
      </div>
    </div>
  );

  return createPortal(panel, document.body);
}