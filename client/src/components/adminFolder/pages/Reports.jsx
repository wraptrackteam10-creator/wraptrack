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
import { 
  FaBoxOpen, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaUsers, 
  FaUserCheck, 
  FaClock, 
  FaCalendarAlt,
  FaFilePdf,
  FaChartLine,
  FaChartPie,
  FaChartBar,
} from "react-icons/fa";
import { fetchWithAuth } from "../../../utils/fetchWithAuth";

function Reports() {
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
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
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsRes, usersRes] = await Promise.all([
          fetchWithAuth(`${API_BASE_URL}/api/items`, { credentials: "include" }),
          fetchWithAuth(`${API_BASE_URL}/api/users`, { credentials: "include" }),
        ]);
        const itemsData = await itemsRes.json();
        const usersData = await usersRes.json();
        setItems(itemsData || []);
        setUsers(usersData || []);
      } catch (error) {
        console.error("Error fetching report data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [API_BASE_URL]);

  if (loading)
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "80vh" }}>
        <div className="spinner-border" style={{ color: "#123458" }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 fw-medium text-muted">Analyzing system reports...</p>
      </div>
    );

  // ✅ FILTER ITEMS BY SELECTED YEAR
  const itemsInYear = items.filter((i) => {
    const checkDate = i.depositedAt || i.claimedAt || i.unclaimedAt || i.createdAt;
    if (!checkDate) return false;
    return new Date(checkDate).getFullYear() === selectedYear;
  });

  // --- SUMMARY METRICS using timestamps (filtered by year) ---
  const depositedCount = itemsInYear.filter((i) => i.depositedAt).length;
  const claimedCount = itemsInYear.filter((i) => i.claimedAt).length;
  const unclaimedCount = itemsInYear.filter((i) => i.unclaimedAt).length;
  const penalizedCount = itemsInYear.filter((i) => i.penalty && i.penalty > 0).length;
  const totalUsers = users.filter((u) => {
    const type = u.userCredentials?.type;
    return type !== "admin" && type !== "guard";
  }).length;
  const activeUsers = users.filter((u) => {
    const type = u.userCredentials?.type;
    return type !== "admin" && type !== "guard" && u.userCredentials?.status === "Active";
  });

  // Average claim time in hours (only for items that have both depositedAt and claimedAt)
  const claimedItems = itemsInYear.filter((i) => i.depositedAt && i.claimedAt);
  const totalClaimTime = claimedItems.reduce((sum, item) => {
    const depositedTime = new Date(item.depositedAt).getTime();
    const claimedTime = new Date(item.claimedAt).getTime();
    return sum + (claimedTime - depositedTime);
  }, 0);
  const avgClaimHours =
    claimedItems.length > 0 ? (totalClaimTime / claimedItems.length / (1000 * 60 * 60)).toFixed(2) : 0;

  const summary = {
    totalDeposited: depositedCount,
    totalClaimed: claimedCount,
    unclaimed: unclaimedCount,
    penalized: penalizedCount,
    totalUsers,
    activeUsers: activeUsers.length,
    avgClaimTime: avgClaimHours,
  };

  const years = [2024, 2025, 2026]; // Available years for filtering

  // ✅ MODIFIED PIE CHART - Using status field for mutually exclusive categories
  // Claimed: items with status === "Claimed"
  // Unclaimed: items with status === "Unclaimed"
  // Settled: items with status === "Settled"
  const claimedCountPie = itemsInYear.filter((i) => i.status === "Claimed").length;
  const unclaimedCountPie = itemsInYear.filter((i) => i.status === "Unclaimed").length;
  const settledCount = itemsInYear.filter((i) => i.status === "Settled").length;

  const pieData = [
    { name: "Claimed", value: claimedCountPie },
    { name: "Unclaimed", value: unclaimedCountPie },
    { name: "Settled", value: settledCount },
  ];
  const COLORS = ["#90EE90", "#F08080", "#17a2b8"];

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // --- Monthly Line Chart ---
  const monthlyDataLine = monthNames.map((month, i) => {
    const monthItems = itemsInYear.filter(
      (it) =>
        it.action === "Deposited" &&
        new Date(it.createdAt).getMonth() === i
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

    itemsInYear.forEach((it) => {
      if (!it.description) return;
      classNames.forEach((cls) => {
        const escaped = escapeRegExp(cls);
        const regex = new RegExp(`${escaped}s?\\s*\\(\\s*(?:x\\s*)?(\\d+)(?:\\s*x)?\\s*\\)`, "i");
        const match = it.description.match(regex);
        if (!match) return;
        const qty = parseInt(match[1], 10) || 0;

        if (it.depositedAt) {
          const d = new Date(it.depositedAt);
          if (d.getMonth() === i) {
            depositedMap[cls] += qty;
          }
        }
        if (it.claimedAt) {
          const d = new Date(it.claimedAt);
          if (d.getMonth() === i) {
            claimedMap[cls] += qty;
          }
        }
        if (it.unclaimedAt) {
          const d = new Date(it.unclaimedAt);
          if (d.getMonth() === i) {
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
  const startOfYear = new Date(selectedYear, 0, 1);
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

    itemsInYear.forEach((it) => {
      if (it.depositedAt) {
        const d = new Date(it.depositedAt);
        if (d >= startWeek && d <= endWeek) deposited += 1;
      }
      if (it.claimedAt) {
        const d = new Date(it.claimedAt);
        if (d >= startWeek && d <= endWeek) claimed += 1;
      }
      if (it.unclaimedAt) {
        const d = new Date(it.unclaimedAt);
        if (d >= startWeek && d <= endWeek) unclaimed += 1;
      }
    });

    const label = `W${w + 1}`;
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
    const total = claimedCountPie + unclaimedCountPie + settledCount;
    if (total === 0) return `No data available for ${selectedYear}.`;
    const unclaimedPercent = ((unclaimedCountPie / total) * 100).toFixed(0);
    const settledPercent = ((settledCount / total) * 100).toFixed(0);
    return `About ${unclaimedPercent}% of items remain unclaimed and ${settledPercent}% have been settled. This suggests follow-up or notification improvements may help reunite owners with their items.`;
  };

  const monthlyBarInterpreter = () => {
    const totalDeposits = {};
    classNames.forEach((c) => (totalDeposits[c] = 0));
    itemsInYear.forEach((it) => {
      if (!it.description || !it.depositedAt) return;
      classNames.forEach((cls) => {
        const escaped = escapeRegExp(cls);
        const regex = new RegExp(`${escaped}s?\\s*\\(\\s*(?:x\\s*)?(\\d+)(?:\\s*x)?\\s*\\)`, "i");
        const match = it.description.match(regex);
        if (match) totalDeposits[cls] += parseInt(match[1], 10);
      });
    });
    const sorted = Object.entries(totalDeposits).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return `No deposited items found for ${selectedYear}.`;
    const topItems = sorted.slice(0, 2).map((item) => item[0]);
    return `${topItems.join(" and ")} are the top deposited items in ${selectedYear}, indicating these categories are most commonly lost or left behind.`;
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
    itemsInYear
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
    if (!topClass || topClass[1] === 0) return `No deposits recorded for any class in ${selectedYear}.`;
    return `${topClass[0]} had the highest deposits in ${selectedYear}, showing a clear trend in user activity — this may help prioritize inventory, signage, or education for that item type.`;
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
    pdf.text(`Item Report — ${selectedYear}`, margin, y);
    pdf.setFontSize(9);
    const nowLabel = new Date().toLocaleString();
    pdf.text(`Generated: ${nowLabel}`, margin, y + 6);
    y += 12;

    // Render chart area as image if available
    if (chartRef.current) {
      try {
        const element = chartRef.current;
        const canvas = await html2canvas(element, { 
          scale: 2,
          useCORS: true,
          logging: false,
          scrollY: -window.scrollY,
          windowWidth: 1200,
          windowHeight: element.scrollHeight
        });
        const imgData = canvas.toDataURL("image/png");
        const imgProps = pdf.getImageProperties(imgData);
        let pdfWidth = usableWidth;
        let pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        const xOffset = margin + (usableWidth - pdfWidth) / 2;
        
        let heightLeft = pdfHeight;
        let position = y;
        let shift = 0;

        pdf.addImage(imgData, "PNG", xOffset, position, pdfWidth, pdfHeight);
        let drawn = pageHeight - position;
        heightLeft -= drawn;

        while (heightLeft > 0) {
          pdf.addPage();
          shift += drawn;
          position = margin;
          pdf.addImage(imgData, "PNG", xOffset, position - shift, pdfWidth, pdfHeight);
          drawn = pageHeight - position;
          heightLeft -= drawn;
        }

        y = position - shift + pdfHeight + 8;
      } catch (err) {
        console.warn("Failed to render charts to image:", err);
      }
    }

    // Narrative section
    const narratives = [
      {
        title: "Executive Summary",
        text: `This report summarizes item deposit and claim activity for ${selectedYear}. In total there are ${summary.totalDeposited} deposited records and ${summary.totalClaimed} successful claims. ${summary.unclaimed} items remain unclaimed and ${summary.penalized} items received penalties. The system has ${summary.totalUsers} users (${summary.activeUsers} active). Average time to claim an item is ${summary.avgClaimTime} hours.`,
      },
      { title: "Claimed vs Unclaimed vs Settled", text: pieInterpreter() },
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
      ["Claimed vs Unclaimed vs Settled Pie Chart", "Shows proportion of claimed, unclaimed, and settled items.", pieInterpreter()],
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
    });

    pdf.save(`Item_Report_${selectedYear}.pdf`);
  };

  // Chart heights adjusted to screen size
  // const smallChartHeight = isMobile ? 180 : 250;
  // const mediumChartHeight = isMobile ? 220 : 300;
  const lineChartHeight = isMobile ? 280 : 350;
  const weeklyTickInterval = isMobile ? 5 : 3;
  // const monthTickAngle = isMobile ? -45 : 0;

  return (
    <div className="container-fluid p-3 p-md-4" style={{ background: "#f8fafc", minHeight: "100vh" }}>
      <style>
        {`
          @media print {
            .no-print, .sidebar, .navbar, .btn {
              display: none !important;
            }
            .container-fluid {
              background: white !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .card {
              border: 1px solid #eee !important;
              box-shadow: none !important;
              break-inside: avoid;
            }
            body {
              background: white !important;
            }
          }
        `}
      </style>
      {/* PAGE HEADER */}
      <div
        className="d-flex justify-content-between mb-4 p-4 rounded-4 shadow-sm align-items-center flex-wrap gap-3 no-print"
        style={{ background: "#FFF", border: "1px solid #e2e8f0" }}
      >
        <div className="d-flex align-items-center gap-3">
          <div className="p-3 rounded-3" style={{ background: "rgba(18, 52, 88, 0.1)", color: "#123458" }}>
            <FaChartLine size={24} />
          </div>
          <div>
            <h4 className="fw-bold mb-0 text-dark">System Analytics</h4>
            <p className="text-muted small mb-0">Detailed insights for {selectedYear} item activity</p>
          </div>
        </div>
        
        <div className="d-flex gap-2 flex-wrap align-items-center">
          <div className="input-group input-group-sm" style={{ width: "auto" }}>
            <span className="input-group-text bg-light border-end-0"><FaCalendarAlt className="text-muted" /></span>
            <select 
              className="form-select bg-light border-start-0 ps-0 fw-semibold" 
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{ width: "100px" }}
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        
          <button
            className="btn d-flex align-items-center gap-2 px-3 fw-semibold shadow-sm no-print"
            style={{ background: "#123458", color: "#fff", border: "none", borderRadius: "10px", height: "40px" }}
            onClick={generatePDF}
          >
            <FaFilePdf /> Export PDF
          </button>
        </div>
      </div>

      <div ref={chartRef} style={{ paddingBottom: 20 }}>
        {/* SUMMARY CARDS */}
        <div className="row g-3 mb-4">
          {[
            { title: "Deposited Items", value: summary.totalDeposited, color: "#123458", icon: <FaBoxOpen />, bg: "rgba(18, 52, 88, 0.1)" },
            { title: "Claimed Items", value: summary.totalClaimed, color: "#10b981", icon: <FaCheckCircle />, bg: "rgba(16, 185, 129, 0.1)" },
            { title: "Unclaimed Items", value: summary.unclaimed, color: "#ef4444", icon: <FaExclamationTriangle />, bg: "rgba(239, 68, 68, 0.1)" },
            { title: "Total Users", value: summary.totalUsers, color: "#123458", icon: <FaUsers />, bg: "rgba(18, 52, 88, 0.1)" },
            { title: "Active Users", value: summary.activeUsers, color: "#10b981", icon: <FaUserCheck />, bg: "rgba(16, 185, 129, 0.1)" },
            { title: "Avg. Claim Time", value: `${summary.avgClaimTime}h`, color: "#3b82f6", icon: <FaClock />, bg: "rgba(59, 130, 246, 0.1)" },
          ].map((item, idx) => (
            <div key={idx} className="col-12 col-sm-6 col-md-4 col-lg-2">
              <div
                className="card border-0 shadow-sm rounded-4 h-100 p-2 transition-hover"
                style={{ background: "#fff" }}
              >
                <div className="card-body d-flex align-items-center gap-3 p-2">
                  <div className="p-3 rounded-3 d-flex align-items-center justify-content-center" style={{ background: item.bg, color: item.color, width: "48px", height: "48px" }}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-muted small fw-bold text-uppercase mb-0" style={{ fontSize: "0.65rem", letterSpacing: "0.5px" }}>{item.title}</p>
                    <h5 className="fw-bold mb-0" style={{ color: "#334155" }}>
                      {item.value}
                    </h5>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CHARTS SECTION 1 */}
        <div className="row g-4 mb-4">
          <div className="col-lg-7">
            <div className="card border-0 shadow-sm rounded-4 p-4 h-100" style={{ background: "#fff" }}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                  <FaChartBar className="text-primary" /> Monthly Activity Overview
                </h6>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={monthlyDataBar} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                  <Bar dataKey="depositedValue" fill="#123458" name="Deposited" radius={[4, 4, 0, 0]} barSize={isMobile ? 10 : 20} />
                  <Bar dataKey="claimedValue" fill="#10b981" name="Claimed" radius={[4, 4, 0, 0]} barSize={isMobile ? 10 : 20} />
                  <Bar dataKey="unclaimedValue" fill="#ef4444" name="Unclaimed" radius={[4, 4, 0, 0]} barSize={isMobile ? 10 : 20} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 p-3 rounded-3 bg-light border-start border-4 border-primary">
                <p className="small text-muted mb-0"><span className="fw-bold text-dark">Insight:</span> {monthlyBarInterpreter()}</p>
              </div>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="card border-0 shadow-sm rounded-4 p-4 h-100" style={{ background: "#fff" }}>
              <h6 className="fw-bold text-dark mb-4 d-flex align-items-center gap-2">
                <FaChartPie className="text-warning" /> Status Distribution
              </h6>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie 
                    data={pieData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={isMobile ? 60 : 80}
                    outerRadius={isMobile ? 80 : 100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                  <Legend verticalAlign="bottom" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 p-3 rounded-3 bg-light border-start border-4 border-warning">
                <p className="small text-muted mb-0"><span className="fw-bold text-dark">Insight:</span> {pieInterpreter()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* WEEKLY TRENDS */}
        <div className="row g-4 mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4" style={{ background: "#fff", overflowX: "auto" }}>
              <h6 className="fw-bold text-dark mb-4 d-flex align-items-center gap-2">
                <FaChartBar className="text-info" /> Weekly Performance Tracking
              </h6>
              <div style={{ overflowX: "auto", minHeight: "400px" }}>
                <ResponsiveContainer width={isMobile ? 1200 : "100%"} height={380}>
                  <BarChart data={weeklyDataBar} margin={{ top: 10, right: 20, left: -10, bottom: isMobile ? 60 : 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="week" 
                      interval={weeklyTickInterval} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      angle={isMobile ? -45 : 0}
                      textAnchor={isMobile ? "end" : "middle"}
                      height={isMobile ? 80 : 40}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                    <Legend verticalAlign="top" align="right" />
                    <Bar dataKey="deposited" fill="#1e293b" name="Deposited" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="claimed" fill="#10b981" name="Claimed" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="unclaimed" fill="#ef4444" name="Unclaimed" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 p-3 rounded-3 bg-light border-start border-4 border-info">
                <p className="small text-muted mb-0"><span className="fw-bold text-dark">Insight:</span> {weeklyBarInterpreter()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* CATEGORY TRENDS */}
        <div className="row g-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4" style={{ background: "#fff", overflowX: "auto" }}>
              <h6 className="fw-bold text-dark mb-4 d-flex align-items-center gap-2">
                <FaChartLine className="text-danger" /> Category Wise Deposit Trends
              </h6>
              <div style={{ overflowX: "auto", minHeight: "400px" }}>
                <ResponsiveContainer width={isMobile ? 1000 : "100%"} height={lineChartHeight}>
                  <LineChart data={monthlyDataLine} margin={{ top: 10, right: 30, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                    <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: "20px" }} iconType="line" />
                    {classNames.map((className, idx) => (
                      <Line
                        key={idx}
                        type="monotone"
                        dataKey={className}
                        stroke={lineColors[idx]}
                        strokeWidth={2}
                        dot={{ r: 4, fill: lineColors[idx], strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        name={className}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 p-3 rounded-3 bg-light border-start border-4 border-danger">
                <p className="small text-muted mb-0"><span className="fw-bold text-dark">Insight:</span> {lineChartInterpreter()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SUMMARY TABLE */}
      <div className="row g-4 mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-4 p-4" style={{ background: "#fff" }}>
            <h6 className="fw-bold text-dark mb-4 d-flex align-items-center gap-2">
              📊 Data Matrix & Summary
            </h6>
            <div className="table-responsive">
              <table className="table table-hover align-middle border-light">
                <thead className="bg-light">
                  <tr className="text-muted small text-uppercase fw-bold">
                    <th className="py-3 border-0">Metric / Chart</th>
                    <th className="py-3 border-0">Description</th>
                    <th className="py-3 border-0">Insight / Value</th>
                  </tr>
                </thead>
                <tbody className="border-0">
                  {[
                    { metric: "Total Deposited Logs", description: "All items logged in the system.", value: summary.totalDeposited },
                    { metric: "Total Claimed Logs", description: "Successfully reunited with owners.", value: summary.totalClaimed },
                    { metric: "Unclaimed Logs", description: "Items still waiting for collection.", value: summary.unclaimed },
                    { metric: "Penalized Items", description: "Items that exceeded claim duration.", value: summary.penalized },
                    { metric: "Active Users", description: "Current active system participants.", value: summary.activeUsers },
                    { metric: "Average Claim Time", description: "Efficiency of recovery process.", value: `${summary.avgClaimTime} Hours` },
                  ].map((item, idx) => (
                    <tr key={idx}>
                      <td className="fw-semibold text-dark py-3">{item.metric}</td>
                      <td className="text-muted small">{item.description}</td>
                      <td className="fw-bold text-primary">{item.value}</td>
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
