import React, { useEffect, useState } from "react";
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

/**
 * Summary component is already responsive via Recharts' ResponsiveContainer
 * and Bootstrap grid classes. Small tweaks:
 * - Cards stack on mobile (Bootstrap does this by default with col-* classes).
 * - Reduce the number of columns on very small screens by using col-12 / col-sm / col-md breakpoints.
 */
function Summary() {
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsRes, usersRes] = await Promise.all([
          fetchWithAuth(`${API_BASE_URL}/api/items`, { credentials: "include" }),
          fetchWithAuth(`${API_BASE_URL}/api/users`, { credentials: "include" }),
        ]);

        setItems(await itemsRes.json());
        setUsers(await usersRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [API_BASE_URL]);

  if (loading)
    return (
      <p style={{ color: "#D4C9BE" }} className="text-center mt-4">
        Loading summary data…
      </p>
    );

  // UTC-safe isToday
  const isToday = (date) => {
    if (!date) return false;

    const d = new Date(date);
    const now = new Date();

    return (
      d.getUTCFullYear() === now.getUTCFullYear() &&
      d.getUTCMonth() === now.getUTCMonth() &&
      d.getUTCDate() === now.getUTCDate()
    );
  };

  const todayDeposited = items.filter((i) => isToday(i.depositedAt)).length;
  const todayClaimed = items.filter((i) => isToday(i.claimedAt)).length;
  const todayUnclaimed = items.filter((i) => isToday(i.unclaimedAt)).length;
  const todayPenalized = items.filter((i) => i.penalty !== 0 && isToday(i.lastPenaltyAt)).length;

  const visibleUsers = users.filter(
    (u) =>
      u.userCredentials?.type !== "admin" &&
      u.userCredentials?.type !== "guard"
  );

  const activeUsers = visibleUsers.filter(
    (u) => u.userCredentials?.status === "Active"
  );

  const studentCount = visibleUsers.filter(
    (u) => u.userCredentials?.type === "student"
  ).length;

  const facultyCount = visibleUsers.filter(
    (u) => u.userCredentials?.type === "faculty"
  ).length;

  const visitorCount = visibleUsers.filter(
    (u) => u.userCredentials?.type === "visitor"
  ).length;

  const barData = [
    { name: "Deposited", value: todayDeposited, color: "#D4C9BE" },
    { name: "Claimed", value: todayClaimed, color: "#90EE90" },
    { name: "Unclaimed", value: todayUnclaimed, color: "#F08080" },
    { name: "Penalized", value: todayPenalized, color: "#FFD700" },
  ];

  const pieData = [
    { name: "Students", value: studentCount, color: "#123458" },
    { name: "Faculty", value: facultyCount, color: "#D4C9BE" },
    { name: "Visitors", value: visitorCount, color: "#FFD700" },
  ];

  return (
    <div className="container-fluid p-2">
      {/* Summary Cards: responsive cols; on xs they stack full width */}
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
              className="h-100 text-center p-3 rounded"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #D4C9BE",
              }}
            >
              <p
                className="mb-1 fw-semibold"
                style={{ color: "#D4C9BE", fontSize: "0.85rem" }}
              >
                {item.label}
              </p>
              <h4 className="fw-bold" style={{ color: item.color }}>
                {item.value}
              </h4>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="row g-3">
        <div className="col-12 col-lg-5">
          <div
            className="p-3 h-100 rounded"
            style={{ backgroundColor: "#FFFFFF", border: "1px solid #D4C9BE" }}
          >
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
          <div
            className="p-3 h-100 rounded"
            style={{ backgroundColor: "#FFFFFF", border: "1px solid #D4C9BE" }}
          >
            <h6 className="fw-semibold mb-3" style={{ color: "#030303" }}>
              Today's Item Actions
            </h6>
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid stroke="#D4C9BE" strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
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
          <div
            className="p-3 rounded"
            style={{ backgroundColor: "#FFFFFF", border: "1px solid #D4C9BE" }}
          >
            <h6 className="fw-semibold mb-3" style={{ color: "#030303" }}>
              Recently Deposited / Claimed
            </h6>

            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>User</th>
                    <th>Status</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {items
                    .filter(
                      (i) =>
                        isToday(i.depositedAt) ||
                        isToday(i.claimedAt) ||
                        isToday(i.unclaimedAt) ||
                        (i.penalty !== 0 && isToday(i.lastPenaltyAt))
                    )
                    .sort((a, b) => {
                      const getTime = (x) =>
                        new Date(
                          x.depositedAt ||
                            x.claimedAt ||
                            x.unclaimedAt ||
                            x.lastPenaltyAt
                        );
                      return getTime(b) - getTime(a);
                    })
                    .slice(0, 5)
                    .map((item) => {
                      const timestamp =
                        item.depositedAt ||
                        item.claimedAt ||
                        item.unclaimedAt ||
                        item.lastPenaltyAt;

                      return (
                        <tr key={item._id}>
                          <td>{item.description}</td>
                          <td>
                            {item.firstname} {item.lastname}
                          </td>
                          <td>{item.status}</td>
                          <td>
                            {new Date(timestamp).toLocaleTimeString()}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Summary;