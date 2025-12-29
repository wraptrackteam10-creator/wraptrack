import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function FilterPanel({
  show,
  onClose,
  onApply,
  onClear,
  initialFilters = {},
  anchorRef, // element ref where the button lives
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
  const [archived, setArchived] = useState(Boolean(initialFilters.archived || false)); // NEW

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
    setArchived(Boolean(initialFilters.archived || false));
  }, [initialFilters]);

  // compute position when shown, on resize, scroll
  useEffect(() => {
    if (!show) return;
    const computePosition = () => {
      const anchor = anchorRef?.current;
      if (!anchor) {
        // fallback: center near top-left
        setPosition({ left: VIEWPORT_PADDING, top: VIEWPORT_PADDING + 42, transformOrigin: "top left" });
        return;
      }

      const rect = anchor.getBoundingClientRect();
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;
      // desired left relative to document
      let left = rect.left + scrollX;
      // default top below anchor
      let top = rect.bottom + scrollY + 8;

      // ensure left stays within viewport
      if (left + PANEL_WIDTH + VIEWPORT_PADDING > scrollX + window.innerWidth) {
        // shift to the left so it fits
        left = Math.max(VIEWPORT_PADDING + scrollX, scrollX + window.innerWidth - PANEL_WIDTH - VIEWPORT_PADDING);
      }
      left = Math.max(left, VIEWPORT_PADDING + scrollX);

      // If the panel would go off bottom of viewport, try placing it above anchor
      const panelHeight = panelRef.current ? panelRef.current.offsetHeight : 220; // fallback estimate
      const viewportBottom = scrollY + window.innerHeight - VIEWPORT_PADDING;
      if (top + panelHeight > viewportBottom) {
        // place above anchor
        const aboveTop = rect.top + scrollY - panelHeight - 8;
        if (aboveTop >= scrollY + VIEWPORT_PADDING) {
          top = aboveTop;
          setPosition((p) => ({ ...p, transformOrigin: "bottom left" }));
        } else {
          // not enough space above either -> clamp top so it fits
          top = Math.max(scrollY + VIEWPORT_PADDING, viewportBottom - panelHeight);
          setPosition((p) => ({ ...p, transformOrigin: "top left" }));
        }
      } else {
        setPosition((p) => ({ ...p, transformOrigin: "top left" }));
      }

      setPosition({ left, top, transformOrigin: (panelRef.current && top < rect.top + scrollY) ? "bottom left" : "top left" });
    };

    // compute initially after render, use requestAnimationFrame to ensure DOM mounted
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

  useEffect(() => {
    if (penaltyMode !== "penalty") {
      setPenaltyMin("");
      setPenaltyMax("");
    }
  }, [penaltyMode]);

  const handleApply = () => {
    onApply?.({
      name: name.trim(),
      descriptions,
      penaltyMode,
      penaltyMin: penaltyMin === "" ? "" : Number(penaltyMin),
      penaltyMax: penaltyMax === "" ? "" : Number(penaltyMax),
      archived: Boolean(archived), // NEW
    });
    onClose?.();
  };

  const handleClear = () => {
    setName("");
    setDescriptions([]);
    setPenaltyMode("any");
    setPenaltyMin("");
    setPenaltyMax("");
    setArchived(false);
    onClear?.();
    onClose?.();
  };

  if (!show) return null;

  const panel = (
    <div
      ref={panelRef}
      className="position-absolute p-3 rounded"
      style={{
        zIndex: 2000,
        width: PANEL_WIDTH,
        background: "#FFFFFF",
        border: "1px solid #030303",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
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

      {/* Name */}
      <div className="mb-3">
        <label className="form-label mb-1" style={{ fontSize: ".8rem" }}>
          Name
        </label>
        <input
          className="form-control form-control-sm"
          placeholder="Owner name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            border: "1px solid #D4C9BE",
          }}
        />
      </div>

      {/* Description */}
      <div className="mb-3">
        <label className="form-label mb-1" style={{ fontSize: ".8rem" }}>
          Description
        </label>
        <div
          style={{
            maxHeight: 130,
            overflowY: "auto",
            border: "1px solid #D4C9BE",
            padding: 8,
            borderRadius: 4,
          }}
        >
          {descriptionOptions.map((opt) => (
            <div key={opt} className="form-check">
              <input
                id={`desc-${opt}`}
                className="form-check-input"
                type="checkbox"
                checked={descriptions.includes(opt)}
                onChange={() => toggleDescription(opt)}
              />
              <label
                className="form-check-label"
                htmlFor={`desc-${opt}`}
                style={{ fontSize: ".85rem" }}
              >
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
              <label
                className="form-check-label"
                htmlFor={`pen-${mode}`}
                style={{ fontSize: ".85rem" }}
              >
                {mode === "any" ? "Any" : mode === "penalty" ? "Penalty" : "No Penalty"}
              </label>
            </div>
          ))}
        </div>

        {penaltyMode !== "no-penalty" && (
          <div className="d-flex gap-2 mt-2">
            <input
              type="number"
              className="form-control form-control-sm"
              placeholder="Min"
              value={penaltyMin}
              onChange={(e) => setPenaltyMin(e.target.value)}
              min={0}
              style={{
                maxWidth: 100,
                border: "1px solid #D4C9BE",
              }}
            />
            <input
              type="number"
              className="form-control form-control-sm"
              placeholder="Max"
              value={penaltyMax}
              onChange={(e) => setPenaltyMax(e.target.value)}
              min={0}
              style={{
                maxWidth: 100,
                border: "1px solid #D4C9BE",
              }}
            />
          </div>
        )}
      </div>

      {/* Archived toggle */}
      <div
        className="d-flex justify-content-between align-items-center mt-2 mb-3 px-2 py-2 rounded"
        style={{ border: "1px solid #D4C9BE", background: "#F9F8F6" }}
      >
        <div>
          <div style={{ fontSize: ".85rem", fontWeight: 500 }}>
            Archived items
          </div>
          <small style={{ fontSize: ".75rem", color: "#6b6b6b" }}>
            Show only archived items (date filter will use archived date)
          </small>
        </div>
        <div className="form-check form-switch m-0">
          <input
            className="form-check-input"
            type="checkbox"
            checked={archived}
            onChange={(e) => setArchived(e.target.checked)}
            aria-label="Show archived items only"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="d-flex justify-content-end gap-2 mt-3">
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