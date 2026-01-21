import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import { BsSearch } from "react-icons/bs";
import "react-datepicker/dist/react-datepicker.css";
import { fetchWithAuth } from "../../../utils/fetchWithAuth";

function GuardHistoryLog() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState(""); // YYYY-MM-DD string
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

  const goBack = () => navigate(-1);
  const handleViewDetails = (id) => setSelectedCard(selectedCard === id ? null : id);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetchWithAuth(`${API_BASE_URL}/api/guardlogs`);
        if (!response.ok) throw new Error("Failed to fetch guard logs");
        const data = await response.json();
        setLogs(data);
      } catch (error) {
        console.error("Error fetching guard logs:", error);
      }
    };
    fetchLogs();
  }, [API_BASE_URL]);

  const filteredLogs = logs.filter((log) => {
    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      (log.description && log.description.toLowerCase().includes(term)) ||
      (log.action && log.action.toLowerCase().includes(term)) ||
      (log.owner && log.owner.firstname && log.owner.firstname.toLowerCase().includes(term)) ||
      (log.owner && log.owner.lastname && log.owner.lastname.toLowerCase().includes(term));

    const matchesDate = !dateFilter
      ? true
      : new Date(log.createdAt).toISOString().slice(0, 10) === dateFilter;

    return matchesSearch && matchesDate;
  });

  const truncate = (text, length = 60) =>
    !text ? "" : text.length > length ? text.slice(0, length) + "..." : text;

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.text("🛡️ Guard History Log Report", 20, 20);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 28);
    doc.line(20, 32, 190, 32);

    let y = 40;
    const pageWidth = 170;

    if (filteredLogs.length === 0) {
      doc.text("No logs available.", 20, y);
    } else {
      filteredLogs.forEach((log, index) => {
        const date = new Date(log.createdAt).toLocaleString();
        const description = log.description || "No description";
        const action = log.action || "No action";
        const owner = log.owner ? `${log.owner.firstname} ${log.owner.lastname}` : "N/A";

        const header = `${index + 1}. ${owner} — ${date}`;
        const headerLines = doc.splitTextToSize(header, pageWidth);
        headerLines.forEach((line) => {
          doc.text(line, 20, y);
          y += 7;
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
        });

        const descriptionLines = doc.splitTextToSize(`Description: ${description}`, pageWidth);
        descriptionLines.forEach((line) => {
          doc.text(line, 20, y);
          y += 7;
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
        });

        doc.text(`Action: ${action}`, 20, y);
        y += 7;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        y += 4;
      });
    }
    doc.save("Guard_History_Log.pdf");
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", backgroundColor: "#F1EFEC" }}>
      {/* Header area (responsive: mobile stacked, desktop inline) */}
      <div
        className="bg-white"
        style={{
          borderBottom: "1px solid #D4C9BE",
          padding: "12px 16px",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
        }}
      >
        {/* MOBILE: stacked layout */}
        <div className="d-flex flex-column gap-2 d-md-none">
          <div>
            <h5 className="mb-0" style={{ color: "#123458", fontWeight: 600 }}>
              Guard History Log
            </h5>
          </div>

          <div style={{ position: "relative" }}>
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
              type="text"
              placeholder="Search description, action or owner"
              className="form-control"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                paddingLeft: "34px",
                border: "1px solid #D4C9BE",
              }}
              aria-label="Search logs"
            />
          </div>

          <div className="d-flex gap-2 flex-wrap">
            <input
              type="date"
              className="form-control"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ border: "1px solid #D4C9BE", maxWidth: 200 }}
              aria-label="Filter by date"
            />

            <button
              className="btn"
              onClick={() => {
                setSearch("");
                setDateFilter("");
              }}
              style={{ border: "1px solid #D4C9BE", background: "#fff" }}
              aria-label="Clear filters"
            >
              Clear
            </button>

            <button
              className="btn fw-semibold"
              style={{ backgroundColor: "#123458", color: "#F1EFEC" }}
              onClick={handleDownloadPDF}
            >
              PDF
            </button>
          </div>
        </div>

        {/* DESKTOP: single-line layout with title left and controls right */}
        <div className="d-none d-md-flex align-items-center justify-content-between">
          <div>
            <h5 className="mb-0" style={{ color: "#123458", fontWeight: 600 }}>
              Guard History Log
            </h5>
          </div>

          <div className="d-flex align-items-center gap-2" style={{ width: "100%", maxWidth: 900 }}>
            <div style={{ position: "relative", width: "100%", maxWidth: 360 }}>
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
                type="text"
                placeholder="Search description, action or owner"
                className="form-control"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  paddingLeft: "34px",
                  border: "1px solid #D4C9BE",
                  minWidth: 0,
                }}
                aria-label="Search logs"
              />
            </div>

            <input
              type="date"
              className="form-control"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ border: "1px solid #D4C9BE", maxWidth: 170 }}
              aria-label="Filter by date"
            />

            <button
              className="btn"
              onClick={() => {
                setSearch("");
                setDateFilter("");
              }}
              style={{ border: "1px solid #D4C9BE", background: "#fff" }}
              aria-label="Clear filters"
            >
              Clear
            </button>

            <button
              className="btn fw-semibold"
              style={{ backgroundColor: "#123458", color: "#F1EFEC" }}
              onClick={handleDownloadPDF}
            >
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Content area: table on md+, stacked cards on mobile. Only this area scrolls. */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {/* Desktop table */}
        <div className="d-none d-md-flex p-3" style={{ flex: 1, minHeight: 0 }}>
          <div
            className="table-responsive"
            style={{
              width: "100%",
              border: "1px solid #D4C9BE",
              borderRadius: 8,
              background: "#FFFFFF",
              overflowY: "auto",
              minHeight: 0,
            }}
          >
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 48 }}>#</th>
                  <th style={{ width: 120 }}>Date</th>
                  <th>Owner</th>
                  <th>Description</th>
                  <th style={{ width: 160 }}>Action</th>
                  <th style={{ width: 140 }} className="text-end">Details</th>
                </tr>
              </thead>

              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4">
                      No logs found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, idx) => {
                    const ownerName = log.owner ? `${log.owner.firstname} ${log.owner.lastname}` : "N/A";
                    return (
                      <tr key={log._id}>
                        <td style={{ verticalAlign: "middle" }}>{idx + 1}</td>
                        <td style={{ verticalAlign: "middle" }}>
                          <div style={{ fontSize: ".9rem", fontWeight: 600, color: "#030303" }}>
                            {new Date(log.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-muted" style={{ fontSize: ".8rem" }}>
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </div>
                        </td>

                        <td>
                          <div style={{ fontWeight: 600 }}>{ownerName}</div>
                          {log.owner?.email && <div className="text-muted" style={{ fontSize: ".85rem" }}>{log.owner.email}</div>}
                        </td>

                        <td style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", maxWidth: 420 }}>
                          {truncate(log.description, 160)}
                        </td>

                        <td style={{ verticalAlign: "middle" }}>
                          <div style={{ fontWeight: 600 }}>{log.action || "-"}</div>
                        </td>

                        <td className="text-end">
                          <button
                            className="btn btn-sm"
                            onClick={() => handleViewDetails(log._id)}
                            style={{
                              border: "1px solid #123458",
                              color: "#123458",
                              background: "transparent",
                              minWidth: 110,
                            }}
                          >
                            {selectedCard === log._id ? "Hide Details" : "View Details"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="d-md-none p-3" style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
          {filteredLogs.length === 0 ? (
            <div className="text-center text-muted">No logs found.</div>
          ) : (
            filteredLogs.map((log, idx) => {
              const ownerName = log.owner ? `${log.owner.firstname} ${log.owner.lastname}` : "N/A";
              return (
                <div
                  key={log._id}
                  className="card mb-3"
                  style={{
                    border: "1px solid #D4C9BE",
                    borderRadius: "12px",
                    backgroundColor: "#FFFFFF",
                  }}
                >
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: "#123458" }}>
                          {ownerName} • <span style={{ fontWeight: 500 }}>{new Date(log.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="text-muted" style={{ fontSize: ".85rem", marginTop: 6 }}>
                          {truncate(log.description, 140)}
                        </div>
                      </div>

                      <div style={{ marginLeft: 12 }}>
                        <button
                          className="btn btn-sm"
                          onClick={() => handleViewDetails(log._id)}
                          style={{
                            border: "1px solid #123458",
                            color: "#123458",
                            background: "transparent",
                          }}
                        >
                          {selectedCard === log._id ? "Hide" : "Details"}
                        </button>
                      </div>
                    </div>

                    {selectedCard === log._id && (
                      <div className="mt-3" style={{ color: "#030303" }}>
                        <p style={{ marginBottom: 6 }}><strong>Action:</strong> {log.action || "-"}</p>
                        <p style={{ marginBottom: 6 }}><strong>Timestamp:</strong> {new Date(log.createdAt).toLocaleString()}</p>
                        {log.owner && (
                          <p style={{ marginBottom: 0 }}>
                            <strong>Owner contact:</strong> {log.owner.email || "N/A"}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default GuardHistoryLog;