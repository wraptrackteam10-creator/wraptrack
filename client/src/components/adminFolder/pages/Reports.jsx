import { useEffect, useState, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

function Reports() {
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef(null);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

  const classNames = [
    "Disposable Beverage",
    "Non-disposable Item",
    "Disposable Plastic",
    "Disposable Plastic Gloves",
    "Disposable Plastic Utensil",
    "Disposable Snack",
    "Disposable Straw",
    "Reusable Tupperware",
    "Disposable Water Bottle",
    "Reusable Water Bottle",
  ];

  const lineColors = [
    "#0d6efd",
    "#198754",
    "#dc3545",
    "#ffc107",
    "#6f42c1",
    "#fd7e14",
    "#20c997",
    "#0dcaf0",
    "#d63384",
    "#343a40",
  ];

  // helper to escape class names when making regex
  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsRes, usersRes] = await Promise.all([fetch(`${API_BASE_URL}/api/items`), fetch(`${API_BASE_URL}/api/users`)]);
        const itemsData = await itemsRes.json();
        const usersData = await usersRes.json();
        setItems(itemsData);
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching report data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [API_BASE_URL]);

  if (loading) return <p className="text-center mt-4" style={{ color: "#D4C9BE" }}>Loading reports...</p>;

  // --- SUMMARY METRICS using timestamps ---
  const depositedCount = items.filter((i) => i.depositedAt).length;
  const claimedCount = items.filter((i) => i.claimedAt).length;
  const unclaimedCount = items.filter((i) => i.unclaimedAt).length;
  const penalizedCount = items.filter((i) => i.penalty && i.penalty > 0).length;
  const totalUsers = users.filter((u) => u.userCredentials.type !== "admin" && u.userCredentials.type !== "guard").length;
  const activeUsers = users.filter((u) => u.userCredentials.type !== "admin" && u.userCredentials.type !== "guard" && u.userCredentials.status === "Active");

  // Average claim time in hours (only for items that have both depositedAt and claimedAt)
  const claimedItems = items.filter((i) => i.depositedAt && i.claimedAt);
  const totalClaimTime = claimedItems.reduce((sum, item) => {
    const depositedTime = new Date(item.depositedAt).getTime();
    const claimedTime = new Date(item.claimedAt).getTime();
    return sum + (claimedTime - depositedTime);
  }, 0);
  const avgClaimHours = claimedItems.length > 0 ? (totalClaimTime / claimedItems.length / (1000 * 60 * 60)).toFixed(2) : 0;

  const summary = {
    totalDeposited: depositedCount,
    totalClaimed: claimedCount,
    unclaimed: unclaimedCount,
    penalized: penalizedCount,
    totalUsers,
    activeUsers: activeUsers.length,
    avgClaimTime: avgClaimHours,
  };

  // Pie chart
  const pieData = [
    { name: "Claimed", value: claimedCount },
    { name: "Unclaimed", value: unclaimedCount },
    { name: "Penalized", value: penalizedCount },
  ];
  const COLORS = ["#90EE90", "#F08080", "#FFA500"]; // Added color for penalized

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentYear = new Date().getFullYear();

  // --- Monthly Line Chart ---
  const monthlyDataLine = monthNames.map((month, i) => {
    const monthItems = items.filter(
      (it) => it.action === "Deposited" && new Date(it.createdAt).getFullYear() === currentYear && new Date(it.createdAt).getMonth() === i
    );
    const classCounts = {};
    classNames.forEach((c) => (classCounts[c] = 0));
    monthItems.forEach((it) => {
      if (!it.description) return;
      classNames.forEach((cls) => {
        const escaped = escapeRegExp(cls);
        const regex = new RegExp(`${escaped}s?\\s*\\(\\s*(?:x\\s*)?(\\d+)(?:\\s*x)?\\s*\\)`, "i");
        const match = it.description.match(regex);
        if (match) classCounts[cls] += parseInt(match[1], 10);
      });
    });
    return { month, ...classCounts };
  });

  // --- Monthly Bar Chart (quantities from descriptions) ---
  const monthlyDataBar = monthNames.map((month, i) => {
    const depositedMap = {};
    const claimedMap = {};
    const unclaimedMap = {};
    classNames.forEach((c) => {
      depositedMap[c] = 0;
      claimedMap[c] = 0;
      unclaimedMap[c] = 0;
    });

    items.forEach((it) => {
      if (!it.description) return;
      classNames.forEach((cls) => {
        const escaped = escapeRegExp(cls);
        const regex = new RegExp(`${escaped}s?\\s*\\(\\s*(?:x\\s*)?(\\d+)(?:\\s*x)?\\s*\\)`, "i");
        const match = it.description.match(regex);
        if (!match) return;
        const qty = parseInt(match[1], 10) || 0;

        if (it.depositedAt) {
          const d = new Date(it.depositedAt);
          if (d.getFullYear() === currentYear && d.getMonth() === i) {
            depositedMap[cls] += qty;
          }
        }
        if (it.claimedAt) {
          const d = new Date(it.claimedAt);
          if (d.getFullYear() === currentYear && d.getMonth() === i) {
            claimedMap[cls] += qty;
          }
        }
        if (it.unclaimedAt) {
          const d = new Date(it.unclaimedAt);
          if (d.getFullYear() === currentYear && d.getMonth() === i) {
            unclaimedMap[cls] += qty;
          }
        }
      });
    });

    const depositedTotal = Object.values(depositedMap).reduce((a, b) => a + b, 0);
    const claimedTotal = Object.values(claimedMap).reduce((a, b) => a + b, 0);
    const unclaimedTotal = Object.values(unclaimedMap).reduce((a, b) => a + b, 0);

    return {
      month,
      depositedValue: depositedTotal,
      claimedValue: claimedTotal,
      unclaimedValue: unclaimedTotal,
    };
  });

  // --- Weekly Bar Chart (FIXED) ---
  const weeklyDataBar = [];
  const startOfYear = new Date(currentYear, 0, 1);
  for (let w = 0; w < 52; w++) {
    const startWeek = new Date(startOfYear);
    startWeek.setDate(startWeek.getDate() + w * 7);
    const endWeek = new Date(startWeek);
    endWeek.setDate(endWeek.getDate() + 6);
    startWeek.setHours(0, 0, 0, 0);
    endWeek.setHours(23, 59, 59, 999);

    let deposited = 0;
    let claimed = 0;
    let unclaimed = 0;

    items.forEach((it) => {
      if (it.depositedAt) {
        const d = new Date(it.depositedAt);
        if (d.getFullYear() === currentYear && d >= startWeek && d <= endWeek) deposited += 1;
      }
      if (it.claimedAt) {
        const d = new Date(it.claimedAt);
        if (d.getFullYear() === currentYear && d >= startWeek && d <= endWeek) claimed += 1;
      }
      if (it.unclaimedAt) {
        const d = new Date(it.unclaimedAt);
        if (d.getFullYear() === currentYear && d >= startWeek && d <= endWeek) unclaimed += 1;
      }
    });

    const label = `W${w + 1} (${startWeek.toISOString().slice(5, 10)}-${endWeek.toISOString().slice(5, 10)})`;
    weeklyDataBar.push({
      week: label,
      deposited,
      claimed,
      unclaimed,
      _start: startWeek.toISOString(),
      _end: endWeek.toISOString(),
    });
  }

  // --- Interpreters ---
  const pieInterpreter = () => {
    const total = claimedCount + unclaimedCount + penalizedCount;
    if (total === 0) return "No data available.";
    const unclaimedPercent = ((unclaimedCount / total) * 100).toFixed(0);
    return `About ${unclaimedPercent}% of deposited items remain unclaimed. This suggests follow-up or notification improvements may help reunite owners with their items.`;
  };

  const monthlyBarInterpreter = () => {
    const totalDeposits = {};
    classNames.forEach((c) => (totalDeposits[c] = 0));
    items.forEach((it) => {
      if (!it.description || !it.depositedAt) return;
      classNames.forEach((cls) => {
        const escaped = escapeRegExp(cls);
        const regex = new RegExp(`${escaped}s?\\s*\\(\\s*(?:x\\s*)?(\\d+)(?:\\s*x)?\\s*\\)`, "i");
        const match = it.description.match(regex);
        if (match) totalDeposits[cls] += parseInt(match[1], 10);
      });
    });
    const sorted = Object.entries(totalDeposits).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return "No deposited items found this year.";
    const topItems = sorted.slice(0, 2).map((item) => item[0]);
    return `${topItems.join(" and ")} are the top deposited items this year, indicating these categories are most commonly lost or left behind.`;
  };

  const weeklyBarInterpreter = () => {
    if (weeklyDataBar.length === 0) return "No weekly data available.";
    const topWeek = weeklyDataBar.reduce((prev, curr) => {
      const prevSum = prev.deposited + prev.claimed + prev.unclaimed;
      const currSum = curr.deposited + curr.claimed + curr.unclaimed;
      return currSum > prevSum ? curr : prev;
    }, weeklyDataBar[0]);
    const start = new Date(topWeek._start);
    const end = new Date(topWeek._end);
    const startLabel = `${start.getMonth() + 1}/${start.getDate()}`;
    const endLabel = `${end.getMonth() + 1}/${end.getDate()}`;
    return `${topWeek.week} (${startLabel} - ${endLabel}) had the highest activity with ${topWeek.deposited} deposited, ${topWeek.claimed} claimed, and ${topWeek.unclaimed} unclaimed records. Consider investigating events or periods that drove the spike.`;
  };

  const lineChartInterpreter = () => {
    const totalPerClass = {};
    classNames.forEach((c) => (totalPerClass[c] = 0));
    items
      .filter((it) => it.depositedAt)
      .forEach((it) => {
        if (!it.description) return;
        classNames.forEach((cls) => {
          const escaped = escapeRegExp(cls);
          const regex = new RegExp(`${escaped}s?\\s*\\(\\s*(?:x\\s*)?(\\d+)(?:\\s*x)?\\s*\\)`, "i");
          const match = it.description.match(regex);
          if (match) totalPerClass[cls] += parseInt(match[1], 10);
        });
      });
    const topClass = Object.entries(totalPerClass).sort((a, b) => b[1] - a[1])[0];
    if (!topClass || topClass[1] === 0) return "No deposits recorded for any class this year.";
    return `${topClass[0]} had the highest deposits this year, showing a clear trend in user activity — this may help prioritize inventory, signage, or education for that item type.`;
  };

  // --- PDF Generation (includes narrative report) ---
  const generatePDF = async () => {
    const pdf = new jsPDF("p", "mm", "a4");
    let y = 10;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const usableWidth = pageWidth - margin * 2;

    // Add header with report title and timestamp
    pdf.setFontSize(16);
    pdf.text(`Item Report — ${currentYear}`, margin, y);
    pdf.setFontSize(9);
    const nowLabel = new Date().toLocaleString();
    pdf.text(`Generated: ${nowLabel}`, margin, y + 6);
    y += 12;

    // Render chart area as image if available
    if (chartRef.current) {
      try {
        const canvas = await html2canvas(chartRef.current, { scale: 2 });
        const imgData = canvas.toDataURL("image/png");
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = usableWidth;
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        if (y + pdfHeight > pageHeight - 30) {
          pdf.addPage();
          y = margin;
        }
        pdf.addImage(imgData, "PNG", margin, y, pdfWidth, pdfHeight);
        y += pdfHeight + 8;
      } catch (err) {
        // ignore chart capture errors but continue
        console.warn("Failed to render charts to image:", err);
      }
    }

    // Narrative section (human-readable insights)
    const narratives = [
      {
        title: "Executive Summary",
        text: `This report summarizes item deposit and claim activity for ${currentYear}. In total there are ${summary.totalDeposited} deposited records and ${summary.totalClaimed} successful claims. ${summary.unclaimed} items remain unclaimed and ${summary.penalized} items received penalties. The system has ${summary.totalUsers} users (${summary.activeUsers} active). Average time to claim an item is ${summary.avgClaimTime} hours.`,
      },
      { title: "Claimed vs Unclaimed", text: pieInterpreter() },
      { title: "Monthly Top Items", text: monthlyBarInterpreter() },
      { title: "Weekly Activity Highlight", text: weeklyBarInterpreter() },
      { title: "Monthly Deposit Trend", text: lineChartInterpreter() },
      {
        title: "Recommendations",
        text:
          "1) Investigate causes of high unclaimed rate and consider automated reminders.\n" +
          "2) Prioritize signage or communications for the top deposited item classes.\n" +
          "3) Review peak weeks to align staff or outreach with high-traffic periods.",
      },
    ];

    pdf.setFontSize(12);
    pdf.text("Narrative Report", margin, y);
    y += 6;
    pdf.setFontSize(10);

    for (const n of narratives) {
      const headingLines = pdf.splitTextToSize(n.title, usableWidth);
      if (y + headingLines.length * 6 > pageHeight - 20) {
        pdf.addPage();
        y = margin;
      }
      pdf.setFont(undefined, "bold");
      pdf.text(headingLines, margin, y);
      y += headingLines.length * 6;

      pdf.setFont(undefined, "normal");
      const wrapped = pdf.splitTextToSize(n.text, usableWidth);
      if (y + wrapped.length * 6 > pageHeight - 20) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(wrapped, margin, y);
      y += wrapped.length * 6 + 6;
    }

    // Add a summary table below narratives
    if (y + 60 > pageHeight - 20) {
      pdf.addPage();
      y = margin;
    }

    const tableColumn = ["Metric / Chart", "Description", "Current Value / Insight"];
    const tableRows = [
      ["Total Deposited Logs", "Number of items deposited in the system.", summary.totalDeposited],
      ["Total Claimed Logs", "Number of deposited items that were claimed.", summary.totalClaimed],
      ["Unclaimed Logs", "Deposited items that have not been claimed yet.", summary.unclaimed],
      ["Penalized Items", "Deposited items with penalties applied.", summary.penalized],
      ["Total Users", "All users excluding admin and guards.", summary.totalUsers],
      ["Active Users", "Users who are currently active in the system.", summary.activeUsers],
      ["Average Claim Time (hrs)", "Average time between depositing and claiming an item.", summary.avgClaimTime],
      ["Claimed vs Unclaimed Pie Chart", "Shows proportion of claimed, unclaimed, and penalized items.", pieInterpreter()],
      ["Monthly Top Items Bar Chart", "Shows which items are most deposited, claimed, or unclaimed each month.", monthlyBarInterpreter()],
      ["Weekly Deposited/Claimed/Unclaimed Chart", "Shows weekly activity trends across the year.", weeklyBarInterpreter()],
      ["Monthly Deposited Trend Line Chart", "Displays trends of item deposits per class each month.", lineChartInterpreter()],
    ];

    autoTable(pdf, {
      startY: y,
      head: [tableColumn],
      body: tableRows,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, textColor: "#030303" },
      headStyles: { fillColor: [212, 201, 190] },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 70 },
        2: { cellWidth: usableWidth - 45 - 70 },
      },
      didDrawPage: (data) => {
        // nothing extra
      },
    });

    pdf.save(`Item_Report_${currentYear}.pdf`);
  };

  return (
    <div className="container-fluid p-2" style={{ background: "#FFF", minHeight: "100vh" }}>
      {/* PAGE HEADER */}
      <div className="d-flex justify-content-between mb-2 p-3 rounded" style={{ background: "#FFF", border: "1px solid #D4C9BE" }}>
        <div>
          <h4 className="fw-semibold mb-1">Reports & Analytics</h4>
          <small style={{ color: "#6b6b6b" }}>View and analyze deposited item activity</small>
        </div>
        <button
          className="btn mt-2"
          style={{ background: "#123458", color: "#F1EFEC", border: "1px solid #F1EFEC", height: "40px" }}
          onClick={generatePDF}
        >
          📝 Generate PDF
        </button>
      </div>

      <div ref={chartRef}>
        {/* SUMMARY CARDS */}
        <div className="row g-2 mb-2">
          {[
            { title: "Deposited Items", value: summary.totalDeposited, color: "#123458" },
            { title: "Claimed Items", value: summary.totalClaimed, color: "#90EE90" },
            { title: "Unclaimed Items", value: summary.unclaimed, color: "#F08080" },
            { title: "Total Users", value: summary.totalUsers, color: "#123458" },
            { title: "Active Users", value: summary.activeUsers, color: "#90EE90" },
            { title: "Average Claim Time (hrs)", value: summary.avgClaimTime, color: "#123458" },
          ].map((item, idx) => (
            <div key={idx} className="col-xl-2 col-lg-3 col-md-4 col-sm-6">
              <div className="card shadow-sm rounded h-100 text-center" style={{ minHeight: "100px", border: "1px solid #D4C9BE" }}>
                <div className="card-body d-flex flex-column justify-content-center">
                  <h6 className="text-secondary fw-semibold mb-1">{item.title}</h6>
                  <h5 className="fw-bold" style={{ color: item.color }}>
                    {item.value}
                  </h5>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CHARTS */}
        <div className="row g-3 mb-3">
          <div className="col-lg-6 col-sm-12">
            <div className="card p-3 shadow-sm rounded h-100" style={{ border: "1px solid #D4C9BE", background: "#FFFFFF" }}>
              <h6 className="fw-semibold mb-3 text-center text-secondary">Top Items per Month</h6>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyDataBar}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="depositedValue" fill="#123458" name="Deposited" />
                  <Bar dataKey="claimedValue" fill="#90EE90" name="Claimed" />
                  <Bar dataKey="unclaimedValue" fill="#F08080" name="Unclaimed" />
                </BarChart>
              </ResponsiveContainer>
              <p className="mt-2 text-center text-secondary">{monthlyBarInterpreter()}</p>
            </div>
          </div>

          <div className="col-lg-6 col-sm-12">
            <div className="card p-3 shadow-sm rounded h-100" style={{ border: "1px solid #D4C9BE", background: "#FFFFFF" }}>
              <h6 className="fw-semibold mb-3 text-center text-secondary">Claimed vs Unclaimed vs Penalized</h6>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} label dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                </PieChart>
              </ResponsiveContainer>
              <p className="mt-2 text-center text-secondary">{pieInterpreter()}</p>
            </div>
          </div>
        </div>

        {/* WEEKLY & LINE CHARTS */}
        <div className="row g-3 mb-3">
          <div className="col-12">
            <div className="card p-3 shadow-sm rounded" style={{ border: "1px solid #D4C9BE", background: "#FFFFFF" }}>
              <h6 className="fw-semibold mb-3 text-center text-secondary">Weekly Deposited/Claimed/Unclaimed</h6>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyDataBar}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="deposited" fill="#123458" name="Deposited" />
                  <Bar dataKey="claimed" fill="#90EE90" name="Claimed" />
                  <Bar dataKey="unclaimed" fill="#F08080" name="Unclaimed" />
                </BarChart>
              </ResponsiveContainer>
              <p className="mt-2 text-center text-secondary">{weeklyBarInterpreter()}</p>
            </div>
          </div>
        </div>

        {/* LINE CHART */}
        <div className="row g-3">
          <div className="col-12">
            <div className="card p-3 shadow-sm rounded" style={{ border: "1px solid #D4C9BE", background: "#FFFFFF" }}>
              <h6 className="fw-semibold mb-3 text-center text-secondary">Monthly Item Deposit Trend</h6>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyDataLine}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {classNames.map((className, idx) => (
                    <Line key={idx} type="monotone" dataKey={className} stroke={lineColors[idx]} name={className} dot={false} activeDot={{ r: 5 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
              <p className="mt-2 text-center text-secondary">{lineChartInterpreter()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* SUMMARY TABLE */}
      <div className="row g-3 mb-3">
        <div className="col-12">
          <div className="card p-3 shadow-sm rounded" style={{ border: "1px solid #D4C9BE", background: "#FFFFFF" }}>
            <h6 className="fw-semibold mb-3 text-center text-secondary">📊 Summary & Insights</h6>
            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead style={{ background: "#FFFFFF", borderBottom: "1px solid #D4C9BE" }}>
                  <tr style={{ color: "#D4C9BE" }}>
                    <th>Metric / Chart</th>
                    <th>Description</th>
                    <th>Current Value / Insight</th>
                  </tr>
                </thead>
                <tbody style={{ color: "#030303" }}>
                  {[
                    { metric: "Total Deposited Logs", description: "Number of items deposited in the system.", value: summary.totalDeposited },
                    { metric: "Total Claimed Logs", description: "Number of deposited items that were claimed.", value: summary.totalClaimed },
                    { metric: "Unclaimed Logs", description: "Deposited items that have not been claimed yet.", value: summary.unclaimed },
                    { metric: "Penalized Items", description: "Deposited items with penalties applied.", value: summary.penalized },
                    { metric: "Total Users", description: "All users excluding admin and guards.", value: summary.totalUsers },
                    { metric: "Active Users", description: "Users who are currently active in the system.", value: summary.activeUsers },
                    { metric: "Average Claim Time (hrs)", description: "Average time between depositing and claiming an item.", value: summary.avgClaimTime },
                    { metric: "Claimed vs Unclaimed Pie Chart", description: "Shows proportion of claimed, unclaimed, and penalized items.", value: pieInterpreter() },
                    { metric: "Monthly Top Items Bar Chart", description: "Shows which items are most deposited, claimed, or unclaimed each month.", value: monthlyBarInterpreter() },
                    { metric: "Weekly Deposited/Claimed/Unclaimed Chart", description: "Shows weekly activity trends across the year.", value: weeklyBarInterpreter() },
                    { metric: "Monthly Deposited Trend Line Chart", description: "Displays trends of item deposits per class each month.", value: lineChartInterpreter() },
                  ].map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.metric}</td>
                      <td>{item.description}</td>
                      <td>{typeof item.value === "number" ? item.value : item.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;