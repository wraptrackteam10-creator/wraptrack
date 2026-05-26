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
import { 
  FaBoxOpen, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaClock, 
  FaUserCheck, 
  FaUsers,
  FaChartPie,
  FaChartBar,
  FaListAlt,
  FaHome
} from "react-icons/fa";

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
    <div className="container-fluid p-3 p-md-4" style={{ background: "#f8fafc", minHeight: "100vh" }}>
      {/* PAGE HEADER */}
      <div
        className="d-flex justify-content-between mb-4 p-4 rounded-4 shadow-sm align-items-center flex-wrap gap-3"
        style={{ background: "#FFF", border: "1px solid #e2e8f0" }}
      >
        <div className="d-flex align-items-center gap-3">
          <div className="p-3 rounded-3" style={{ background: "rgba(18, 52, 88, 0.1)", color: "#123458" }}>
            <FaHome size={24} />
          </div>
          <div>
            <h4 className="fw-bold mb-0 text-dark">Admin Dashboard</h4>
            <p className="text-muted small mb-0">Overview of today's activities and system status</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        {[
          { label: "Today's Deposited", value: todayDeposited, color: "#123458", icon: <FaBoxOpen />, bg: "rgba(18, 52, 88, 0.1)" },
          { label: "Today's Claimed", value: todayClaimed, color: "#10b981", icon: <FaCheckCircle />, bg: "rgba(16, 185, 129, 0.1)" },
          { label: "Today's Unclaimed", value: todayUnclaimed, color: "#ef4444", icon: <FaExclamationTriangle />, bg: "rgba(239, 68, 68, 0.1)" },
          { label: "Today's Penalized", value: todayPenalized, color: "#f59e0b", icon: <FaClock />, bg: "rgba(245, 158, 11, 0.1)" },
          { label: "Active Users", value: activeUsers.length, color: "#10b981", icon: <FaUserCheck />, bg: "rgba(16, 185, 129, 0.1)" },
          { label: "Total Users", value: visibleUsers.length, color: "#3b82f6", icon: <FaUsers />, bg: "rgba(59, 130, 246, 0.1)" },
        ].map((item, i) => (
          <div key={i} className="col-12 col-sm-6 col-md-4 col-lg-2">
            <div
              className="card border-0 shadow-sm rounded-4 h-100 p-2 transition-hover"
              style={{ background: "#fff" }}
            >
              <div className="card-body d-flex align-items-center gap-3 p-2">
                <div className="p-3 rounded-3 d-flex align-items-center justify-content-center" style={{ background: item.bg, color: item.color, width: "48px", height: "48px" }}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-muted small fw-bold text-uppercase mb-0" style={{ fontSize: "0.65rem", letterSpacing: "0.5px" }}>
                    {item.label}
                  </p>
                  <h5 className="fw-bold mb-0" style={{ color: "#334155" }}>
                    {item.value}
                  </h5>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="row g-4 mb-4">
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100" style={{ background: "#fff" }}>
            <h6 className="fw-bold text-dark mb-4 d-flex align-items-center gap-2">
              <FaChartPie className="text-warning" /> User Type Distribution
            </h6>
            <div style={{ width: "100%", height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={60} outerRadius={80} paddingAngle={5} label>
                    {pieData.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                  <Legend verticalAlign="bottom" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100" style={{ background: "#fff" }}>
            <h6 className="fw-bold text-dark mb-4 d-flex align-items-center gap-2">
              <FaChartBar className="text-primary" /> Today's Item Actions
            </h6>
            <div style={{ width: "100%", height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '10px' }} />
                  <Bar dataKey="value" barSize={20}>
                    {barData.map((e, i) => (
                      <Cell key={i} fill={e.color} radius={[0, 4, 4, 0]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Recently Deposited / Claimed */}
      <div className="row g-4 mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-4 p-4" style={{ background: "#fff" }}>
            <h6 className="fw-bold text-dark mb-4 d-flex align-items-center gap-2">
              <FaListAlt className="text-info" /> Recently Deposited / Claimed
            </h6>

            {recentItems.length === 0 ? (
              <div className="text-center py-5 rounded-3" style={{ background: "#f8fafc", border: "2px dashed #e2e8f0" }}>
                <p className="text-muted fw-semibold mb-0">No actions recorded for today yet.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle border-light mb-0">
                  <thead className="bg-light">
                    <tr className="text-muted small text-uppercase fw-bold">
                      <th className="py-3 border-0">Item</th>
                      <th className="py-3 border-0">User</th>
                      <th className="py-3 border-0">Status</th>
                      <th className="py-3 border-0 text-end">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="border-0">
                    {recentItems.map((item) => {
                      const timestamp =
                        item.depositedAt || item.claimedAt || item.unclaimedAt || item.lastPenaltyAt;

                      return (
                        <tr key={item._id}>
                          <td className="fw-semibold text-dark py-3">{item.description}</td>
                          <td>
                            <span className="text-muted small fw-medium">
                              {item.firstname} {item.lastname}
                            </span>
                          </td>
                          <td>
                            <span 
                              className={`badge rounded-pill text-white bg-${item.status === "Claimed" ? "success" : item.status === "Deposited" ? "primary" : item.status === "Unclaimed" ? "danger" : "warning"}`}
                              style={{ padding: "0.4rem 0.8rem", fontWeight: "600" }}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="fw-bold text-dark text-end">
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