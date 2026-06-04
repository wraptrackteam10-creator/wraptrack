import { useEffect, useState, useMemo } from "react";
import {
  FaBoxOpen,
  FaCheckCircle,
  FaExclamationTriangle,
  FaListAlt,
  FaHome,
  FaFilter,
} from "react-icons/fa";
import { fetchWithAuth } from "../../../utils/fetchWithAuth";

function GuardHomePage() {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterPeriod, setFilterPeriod] = useState("daily");

  /* FETCH ITEMS */
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const res = await fetchWithAuth(`${API_BASE_URL}/api/items`, {
          credentials: "include",
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setItems(data);
        } else {
          setItems([]);
        }
      } catch (error) {
        console.error("Error fetching items:", error);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (API_BASE_URL) fetchItems();
  }, [API_BASE_URL]);

  // Date checking helpers
  const isToday = (dateString) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };

  const isThisWeek = (dateString) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return d >= weekStart && d <= weekEnd;
  };

  const isThisMonth = (dateString) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  };

  const isThisYear = (dateString) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    const now = new Date();
    return d.getFullYear() === now.getFullYear();
  };

  // Helper function to check if date matches filter period
  const matchesPeriod = (dateString) => {
    if (!dateString) return false;
    if (filterPeriod === "daily") return isToday(dateString);
    if (filterPeriod === "weekly") return isThisWeek(dateString);
    if (filterPeriod === "monthly") return isThisMonth(dateString);
    if (filterPeriod === "yearly") return isThisYear(dateString);
    return false;
  };

  // Calculate summary stats based on filter period
  const { totalDeposited, totalClaimed, totalUnclaimed } = useMemo(() => {
    let deposited = 0,
      claimed = 0,
      unclaimed = 0;

    items.forEach((item) => {
      if (item.depositedAt && matchesPeriod(item.depositedAt)) deposited++;
      if (item.claimedAt && matchesPeriod(item.claimedAt)) claimed++;
      if (item.unclaimedAt && matchesPeriod(item.unclaimedAt)) unclaimed++;
    });

    return { totalDeposited: deposited, totalClaimed: claimed, totalUnclaimed: unclaimed };
  }, [items, filterPeriod]);

  // Filter recent activity
  const recentActivity = useMemo(() => {
    let filtered = [];

    items.forEach((it) => {
      const userName =
        `${(it.userId?.firstname || "").trim()} ${(it.userId?.lastname || "").trim()}`.trim() ||
        "Unknown user";
      const desc = it.description || "Item";

      const createEvent = (when, type, text) => {
        const ts = new Date(when);
        if (!isNaN(ts) && matchesPeriod(when)) {
          return {
            id: `${it._id}-${type}`,
            itemId: it._id,
            type,
            status: type,
            timestamp: ts,
            text,
          };
        }
        return null;
      };

      if (it.depositedAt) {
        const ev = createEvent(it.depositedAt, "Deposited", `${userName} deposited ${desc}`);
        if (ev) filtered.push(ev);
      }

      if (it.claimedAt) {
        const ev = createEvent(it.claimedAt, "Claimed", `${userName} claimed ${desc}`);
        if (ev) filtered.push(ev);
      }

      if (it.unclaimedAt) {
        const ev = createEvent(
          it.unclaimedAt,
          "Unclaimed",
          `${userName} has an unclaimed item (${desc})`
        );
        if (ev) filtered.push(ev);
      }
    });

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }, [items, filterPeriod]);

  // Summary cards data - ONLY 3 CARDS
  const summaryCards = [
    {
      label: "Total Deposited",
      value: totalDeposited,
      color: "#123458",
      icon: <FaBoxOpen />,
      bg: "rgba(18, 52, 88, 0.1)",
    },
    {
      label: "Total Claimed",
      value: totalClaimed,
      color: "#10b981",
      icon: <FaCheckCircle />,
      bg: "rgba(16, 185, 129, 0.1)",
    },
    {
      label: "Unclaimed Items",
      value: totalUnclaimed,
      color: "#ef4444",
      icon: <FaExclamationTriangle />,
      bg: "rgba(239, 68, 68, 0.1)",
    },
  ];

  // Status color mapping
  const statusColor = (status) => {
    switch (status) {
      case "Claimed":
        return "#10b981";
      case "Unclaimed":
        return "#ef4444";
      case "Deposited":
        return "#3b82f6";
      default:
        return "#D4C9BE";
    }
  };

  const statusBgColor = (status) => {
    switch (status) {
      case "Claimed":
        return "rgba(16, 185, 129, 0.15)";
      case "Unclaimed":
        return "rgba(239, 68, 68, 0.15)";
      case "Deposited":
        return "rgba(59, 130, 246, 0.15)";
      default:
        return "rgba(212, 201, 190, 0.15)";
    }
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const getPeriodLabel = () => {
    const now = new Date();
    switch (filterPeriod) {
      case "daily":
        return `Today, ${now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;
      case "weekly":
        return `This Week (${now.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`;
      case "monthly":
        return `${now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
      case "yearly":
        return `Year ${now.getFullYear()}`;
      default:
        return "All Time";
    }
  };

  // Loading state
  if (loading) {
    return (
      <div
        className="d-flex flex-column justify-content-center align-items-center w-100"
        style={{ minHeight: "60vh" }}
      >
        <div className="spinner-border mb-3" role="status" style={{ color: "#123458" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p style={{ color: "#D4C9BE" }} className="fw-semibold">
          Loading dashboard...
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container-fluid p-3 p-md-4">
        <div className="alert alert-danger shadow-sm text-center border-0 p-4" role="alert">
          <h5 className="alert-heading fw-bold mb-3">⚠️ Oops! Something went wrong.</h5>
          <p>{error}</p>
          <button
            className="btn btn-outline-danger shadow-none mt-2 px-4"
            onClick={() => window.location.reload()}
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        minHeight: "100%",
        backgroundColor: "#f8fafc",
        padding: "12px",
        paddingBottom: "100px",
        overflowY: "auto",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        {/* PAGE HEADER */}
        <div
          className="d-flex justify-content-between align-items-center mb-3 p-4 rounded-4 shadow-sm flex-wrap gap-2"
          style={{ background: "#FFF", border: "1px solid #e2e8f0" }}
        >
          <div className="d-flex align-items-center gap-3">
            <div
              className="p-3 rounded-3"
              style={{ background: "rgba(18, 52, 88, 0.1)", color: "#123458" }}
            >
              <FaHome size={24} />
            </div>
            <div>
              <h4 className="fw-bold mb-0 text-dark">Guard Dashboard</h4>
              <p className="text-muted small mb-0">Overview of item management activities</p>
            </div>
          </div>
        </div>

        {/* SUMMARY CARDS - 3 ONLY, HORIZONTAL ON MOBILE */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          {summaryCards.map((card, i) => (
            <div
              key={i}
              className="card border-0 shadow-sm rounded-4 p-3"
              style={{
                background: "#fff",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div className="d-flex align-items-center gap-3">
                <div
                  className="p-3 rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    background: card.bg,
                    color: card.color,
                    width: "60px",
                    height: "60px",
                  }}
                >
                  {card.icon}
                </div>
                <div className="flex-grow-1">
                  <p
                    className="text-muted small fw-bold text-uppercase mb-1"
                    style={{ fontSize: "0.7rem", letterSpacing: "0.5px" }}
                  >
                    {card.label}
                  </p>
                  <h4 className="fw-bold mb-0" style={{ color: "#334155", fontSize: "28px" }}>
                    {card.value}
                  </h4>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* RECENT ACTIVITY SECTION */}
        <div className="card border-0 shadow-sm rounded-4 p-4" style={{ background: "#fff" }}>
          {/* Header with Filters */}
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
            <div className="d-flex align-items-center gap-2">
              <FaListAlt className="text-info" size={20} />
              <h6 className="fw-bold text-dark mb-0">Recent Activity</h6>
            </div>

            {/* Filter Controls */}
            <div className="d-flex align-items-center gap-2">
              <FaFilter size={14} className="text-muted" />
              <select
                className="form-select form-select-sm"
                style={{
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  color: "#334155",
                  fontWeight: "500",
                  minWidth: "140px",
                }}
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
              >
                <option value="daily">Today</option>
                <option value="weekly">This Week</option>
                <option value="monthly">This Month</option>
                <option value="yearly">This Year</option>
              </select>
            </div>
          </div>

          {/* Period Label */}
          <div className="mb-3 p-2 rounded-3" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <small className="text-muted fw-semibold">
              📅 <span style={{ color: "#123458" }}>{getPeriodLabel()}</span>
            </small>
          </div>

          {/* Activity List */}
          {recentActivity.length === 0 ? (
            <div
              className="text-center py-5 rounded-3"
              style={{ background: "#f8fafc", border: "2px dashed #e2e8f0" }}
            >
              <p className="text-muted fw-semibold mb-0">No transactions recorded for this period.</p>
            </div>
          ) : (
            <div
              style={{
                maxHeight: "400px",
                overflowY: "auto",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
              }}
            >
              {recentActivity.map((event, idx) => (
                <div
                  key={event.id}
                  className="d-flex justify-content-between align-items-center p-3"
                  style={{
                    borderBottom: idx !== recentActivity.length - 1 ? "1px solid #f1f5f9" : "none",
                    background: idx % 2 === 0 ? "#fff" : "#f8fafc",
                    transition: "background 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f1f5f9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#f8fafc";
                  }}
                >
                  <div className="d-flex align-items-center gap-3 flex-grow-1">
                    <div
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        backgroundColor: statusColor(event.status),
                        flexShrink: 0,
                      }}
                    />

                    <div className="flex-grow-1">
                      <div style={{ fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
                        {event.text}
                      </div>
                      <div style={{ color: "#94a3b8", fontSize: "12px" }}>
                        {event.type} • {formatDate(event.timestamp)}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      background: statusBgColor(event.status),
                      color: statusColor(event.status),
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                      whiteSpace: "nowrap",
                      marginLeft: "12px",
                    }}
                  >
                    {formatTime(event.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER INFO */}
        <div className="mt-4 p-3 rounded-3" style={{ background: "rgba(18, 52, 88, 0.05)", border: "1px solid #e2e8f0" }}>
          <small className="text-muted fw-semibold">
            💡 <strong>Tip:</strong> Use the filter to view transactions by period. Visit the Guard Office to settle unclaimed items.
          </small>
        </div>
      </div>
    </div>
  );
}

export default GuardHomePage;
