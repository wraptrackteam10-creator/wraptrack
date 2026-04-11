import React, { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { fetchWithAuth } from "../../../utils/fetchWithAuth";

function Summary() {
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsRes, usersRes] = await Promise.all([
          fetchWithAuth(`${API_BASE_URL}/api/items`, { credentials: "include" }),
          fetchWithAuth(`${API_BASE_URL}/api/users`, { credentials: "include" }),
        ]);

        const itemsData = await itemsRes.json();
        const usersData = await usersRes.json();

        // 1. Safe array checks to prevent app crash if API fails implicitly
        if (Array.isArray(itemsData)) {
          setItems(itemsData);
        } else {
          setItems([]);
          console.error("Invalid items format:", itemsData);
        }

        if (Array.isArray(usersData)) {
          setUsers(usersData);
        } else {
          setUsers([]);
          console.error("Invalid users format:", usersData);
        }
      } catch (err) {
        console.error("Summary fetch error:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [API_BASE_URL]);

  // 2. Safe local timezone checking function
  const isToday = useMemo(() => {
    return (dateString) => {
      if (!dateString) return false;
      const d = new Date(dateString);
      const now = new Date();
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    };
  }, []);

  // 3. Performance optimizations: Math and mapping only recompute when data changes
  const { todayDeposited, todayClaimed, todayUnclaimed, todayPenalized } = useMemo(() => {
    let dep = 0, claim = 0, unclaim = 0, pen = 0;
    items.forEach((i) => {
      if (isToday(i.depositedAt)) dep++;
      if (isToday(i.claimedAt)) claim++;
      if (isToday(i.unclaimedAt)) unclaim++;
      if (i.penalty !== 0 && isToday(i.lastPenaltyAt)) pen++;
    });
    return { todayDeposited: dep, todayClaimed: claim, todayUnclaimed: unclaim, todayPenalized: pen };
  }, [items, isToday]);

  const { visibleUsers, activeUsers, studentCount, facultyCount, visitorCount } = useMemo(() => {
    const visible = users.filter(
      (u) =>
        u.userCredentials?.type !== "admin" &&
        u.userCredentials?.type !== "guard"
    );
    const active = visible.filter((u) => u.userCredentials?.status === "Active");
    
    let students = 0, faculty = 0, visitors = 0;
    visible.forEach(u => {
      if (u.userCredentials?.type === "student") students++;
      else if (u.userCredentials?.type === "faculty") faculty++;
      else if (u.userCredentials?.type === "visitor") visitors++;
    });

    return { 
      visibleUsers: visible, 
      activeUsers: active, 
      studentCount: students, 
      facultyCount: faculty, 
      visitorCount: visitors 
    };
  }, [users]);

  const recentItems = useMemo(() => {
    return items
      .filter((i) =>
        isToday(i.depositedAt) ||
        isToday(i.claimedAt)
      )
      .sort((a, b) => {
        const getTime = (x) => new Date(x.depositedAt || x.claimedAt).getTime();
        return (getTime(b) || 0) - (getTime(a) || 0);
      })
      .slice(0, 5);
  }, [items, isToday]);

  const barData = useMemo(() => [
    { name: "Deposited", value: todayDeposited, color: "#D4C9BE" },
    { name: "Claimed", value: todayClaimed, color: "#90EE90" },
    { name: "Unclaimed", value: todayUnclaimed, color: "#F08080" },
    { name: "Penalized", value: todayPenalized, color: "#FFD700" },
  ], [todayDeposited, todayClaimed, todayUnclaimed, todayPenalized]);

  const pieData = useMemo(() => [
    { name: "Students", value: studentCount, color: "#123458" },
    { name: "Faculty", value: facultyCount, color: "#D4C9BE" },
    { name: "Visitors", value: visitorCount, color: "#FFD700" },
  ], [studentCount, facultyCount, visitorCount]);

  // Loading Skeleton / Spinner State
  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center w-100" style={{ minHeight: "60vh" }}>
        <div className="spinner-border mb-3" role="status" style={{ color: "#123458" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p style={{ color: "#D4C9BE" }} className="fw-semibold">
          Building dashboard...
        </p>
      </div>
    );
  }

  // Error State Handling
  if (error) {
    return (
      <div className="container-fluid p-2 mt-4">
        <div className="alert alert-danger shadow-sm text-center border-0 p-4" role="alert">
          <h5 className="alert-heading fw-bold mb-3">Oops! Something went wrong.</h5>
          <p>{error}</p>
          <button className="btn btn-outline-danger shadow-none mt-2 px-4" onClick={() => window.location.reload()}>
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-2">
      {/* Summary Cards */}
      <div className="row g-2 mb-2">
        {[
          { label: "Today's Deposited", value: todayDeposited, color: "#123458" },
          { label: "Today's Claimed", value: todayClaimed, color: "#90EE90" },
          { label: "Today's Unclaimed", value: todayUnclaimed, color: "#F08080" },
          { label: "Today's Penalized", value: todayPenalized, color: "#FFD700" },
          { label: "Active Users", value: activeUsers.length, color: "#123458" },
          { label: "Total Users", value: visibleUsers.length, color: "#90EE90" },
        ].map((item, i) => (
          <div key={i} className="col-6 col-sm-6 col-md-4 col-lg-2">
            <div
              className="h-100 text-center p-3 rounded shadow-sm"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #e2ece9",
              }}
            >
              <p className="mb-1 fw-semibold text-muted" style={{ fontSize: "0.85rem" }}>
                {item.label}
              </p>
              <h4 className="fw-bold m-0" style={{ color: item.color }}>
                {item.value}
              </h4>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="row g-3">
        <div className="col-12 col-lg-5">
          <div className="p-3 h-100 rounded shadow-sm" style={{ backgroundColor: "#FFFFFF", border: "1px solid #e2ece9" }}>
            <h6 className="fw-semibold mb-3" style={{ color: "#030303" }}>
              User Type Distribution
            </h6>
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" outerRadius={75} label>
                    {pieData.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <div className="p-3 h-100 rounded shadow-sm" style={{ backgroundColor: "#FFFFFF", border: "1px solid #e2ece9" }}>
            <h6 className="fw-semibold mb-3" style={{ color: "#030303" }}>
              Today's Item Actions
            </h6>
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid stroke="#e2ece9" strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fill: "#6c757d" }} />
                  <Tooltip cursor={{ fill: "#f8f9fa", opacity: 0.6 }} />
                  <Legend />
                  <Bar dataKey="value" barSize={20}>
                    {barData.map((e, i) => (
                      <Cell key={i} fill={e.color} radius={[0, 8, 8, 0]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Recently Deposited / Claimed */}
      <div className="row mt-2">
        <div className="col-12">
          <div className="p-3 rounded shadow-sm" style={{ backgroundColor: "#FFFFFF", border: "1px solid #e2ece9" }}>
            <h6 className="fw-semibold mb-3" style={{ color: "#030303" }}>
              Recently Deposited / Claimed
            </h6>

            {recentItems.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted fw-semibold mb-0">No actions recorded for today yet.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="border-0">Item</th>
                      <th className="border-0">User</th>
                      <th className="border-0">Status</th>
                      <th className="border-0 text-end">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="border-top-0">
                    {recentItems.map((item) => {
                      const timestamp =
                        item.depositedAt || item.claimedAt || item.unclaimedAt || item.lastPenaltyAt;

                      return (
                        <tr key={item._id}>
                          <td className="fw-semibold text-dark">{item.description}</td>
                          <td>
                            {item.firstname} {item.lastname}
                          </td>
                          <td>
                            <span 
                              className={`badge rounded-pill text-white bg-${item.status === "Claimed" ? "success" : item.status === "Deposited" ? "primary" : item.status === "Unclaimed" ? "danger" : "warning"}`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="text-muted text-end">
                            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Summary;