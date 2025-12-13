import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { LuArrowLeft, LuHistory, LuRefreshCw } from "react-icons/lu";
import { FaBoxOpen } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";

function UserHistoryLog() {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [loading, setLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));

  const goBack = () => navigate(-1);

  // ✅ Fetch user-specific logs
  const fetchLogs = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/logs/${user.id}`);
      const data = await res.json();

      if (res.ok) {
        // ✅ Only allow these three types
        const allowed = ["Deposited", "Claimed", "Unclaimed"];

        const filteredLogs = data.filter((log) =>
          allowed.includes(log.status)
        );

        setLogs(filteredLogs);
      } else {
        console.error("Failed to fetch logs:", data.message);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleViewDetails = (id) => {
    setSelectedLog(selectedLog === id ? null : id);
  };

  return (
    <div className="min-vh-100 bg-light d-flex flex-column">
      {/* Header */}
      <div className="text-center py-4 bg-dark text-white shadow-sm position-sticky top-0 z-3">
        <div className="d-flex align-items-center justify-content-between px-3">
          <button
            className="btn btn-link text-white p-0"
            onClick={goBack}
            style={{ textDecoration: "none" }}
          >
            <LuArrowLeft size={22} />
          </button>
          <h4 className="fw-bold mb-0 flex-grow-1 text-center d-flex align-items-center justify-content-center gap-2">
            <LuHistory size={22} />
            History Log
          </h4>
          <button
            className="btn btn-link text-white p-0"
            onClick={fetchLogs}
            disabled={loading}
            title="Refresh Logs"
          >
            <LuRefreshCw
              size={22}
              className={loading ? "spin" : ""}
              style={{ transition: "transform 0.3s ease" }}
            />
          </button>
        </div>
        <small>Track your past deposited and claimed items</small>
      </div>

      {/* Scrollable List */}
      <div
        className="container flex-grow-1 py-3"
        style={{
          maxHeight: "calc(100vh - 140px)",
          overflowY: "auto",
        }}
      >
        {loading ? (
          <div className="text-center text-muted mt-5">
            <div className="spinner-border text-secondary mb-3" role="status" />
            <h6>Loading logs...</h6>
          </div>
        ) : logs.length > 0 ? (
          <div className="row g-3">
            {logs.map((log) => (
              <div key={log._id} className="col-12">
                <div
                  className="card border-0 shadow rounded-4"
                  style={{
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    backgroundColor: "#fff",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "scale(1.02)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                >
                  <div className="card-body">
                    <h6 className="fw-bold mb-1 text-dark">
                      {log.description || "No Description"}
                    </h6>

                    <div>
                      <small className="text-muted d-block mb-2">
                        {new Date(log.createdAt).toLocaleString([], {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                        <span
                          className={`ms-2 badge px-3 py-2 rounded-pill fw-semibold ${
                            log.status === "Unclaimed"
                              ? "bg-danger-subtle text-danger"
                              : log.status === "Claimed"
                              ? "bg-success-subtle text-success"
                              : "bg-primary-subtle text-secondary"
                          }`}
                        >
                          {log.status}
                        </span>
                      </small>
                    </div>

                    {/* ✅ Show photo from log document */}
                    {selectedLog === log._id && (
                      <div className="mt-3 text-center">
                        {log.photo?.data ? (
                          <img
                            src={`${API_BASE_URL}/api/logs/${log._id}/photo`}
                            alt="Item"
                            className="rounded"
                            style={{
                              width: "150px",
                              height: "150px",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <FaBoxOpen size={60} color="#6c757d" />
                        )}
                        <p className="mt-2 text-muted small">
                          Status: {log.status || "Unknown"}
                        </p>
                      </div>
                    )}

                    <div className="mt-3 d-grid">
                      <button
                        className="btn btn-sm btn-outline-dark rounded-pill"
                        onClick={() => handleViewDetails(log._id)}
                      >
                        {selectedLog === log._id
                          ? "Hide Details"
                          : "View Details"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted mt-5">
            <FaBoxOpen size={60} className="mb-3" />
            <h6>No history logs yet</h6>
            <p className="small">
              Your past deposits and claims will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserHistoryLog;
