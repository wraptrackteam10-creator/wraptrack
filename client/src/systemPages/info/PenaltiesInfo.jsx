import React from "react";
import { NavLink } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function PenaltiesInfo() {
  const COLORS = {
    appBg: "#F1EFEC",
    header: "#123458",
    headerText: "#F1EFEC",
    surface: "#FFFFFF",
    border: "#D4C9BE",
    primary: "#123458",
    text: "#030303",
    lightText: "#666666",
    warning: "#FFA726",
    danger: "#F08080",
  };

  return (
    <div style={{ background: COLORS.appBg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header
        style={{
          background: COLORS.header,
          color: COLORS.headerText,
          padding: "24px",
          position: "sticky",
          top: 0,
          zIndex: 20,
          boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
        }}
      >
        <div className="container-fluid d-flex align-items-center justify-content-between">
          <div>
            <h2 className="d-none d-md-block" style={{ fontWeight: 700, margin: "0 0 4px 0", fontSize: "28px" }}>
              <i className="bi bi-exclamation-triangle me-2" /> How Penalties Work
            </h2>
            <h3 className="d-md-none" style={{ fontWeight: 700, margin: "0 0 4px 0", fontSize: "20px" }}>
              Penalties
            </h3>
            <small style={{ color: COLORS.headerText, opacity: 0.85, fontSize: "14px" }}>
              Understanding the penalty system in WraPTrack
            </small>
          </div>
          <NavLink to="/info" className="text-decoration-none">
            <button
              style={{
                background: "rgba(255,255,255,0.15)",
                color: COLORS.headerText,
                border: "none",
                borderRadius: "8px",
                padding: "8px 16px",
                fontWeight: 500,
                fontSize: "14px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => (e.target.style.background = "rgba(255,255,255,0.25)")}
              onMouseLeave={(e) => (e.target.style.background = "rgba(255,255,255,0.15)")}
            >
              <i className="bi bi-arrow-left me-2" /> Back to Help
            </button>
          </NavLink>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, overflow: "auto", padding: "32px 0" }}>
        <div className="container-fluid px-3 px-md-4" style={{ maxWidth: "900px" }}>
          {/* Introduction */}
          <div
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "12px",
              padding: "24px",
              marginBottom: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <h4 style={{ color: COLORS.text, fontWeight: 700, marginBottom: "12px" }}>
              Overview
            </h4>
            <p style={{ color: COLORS.lightText, lineHeight: "1.8", margin: 0 }}>
              The penalty system in WraPTrack is designed to encourage timely item claims and maintain system accountability.
              Penalties are applied to items that remain unclaimed beyond a certain timeframe. Understanding how this system
              works will help you manage your items effectively and avoid unnecessary penalties.
            </p>
          </div>

          {/* Penalty Rules */}
          <div
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "12px",
              padding: "24px",
              marginBottom: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <h4 style={{ color: COLORS.text, fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="bi bi-list-check" style={{ color: COLORS.warning }} /> Penalty Rules
            </h4>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Rule 1 */}
              <div
                style={{
                  borderLeft: `4px solid ${COLORS.warning}`,
                  paddingLeft: "16px",
                  paddingTop: "8px",
                  paddingBottom: "8px",
                }}
              >
                <h6 style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 6px 0" }}>
                  1. When Do Penalties Apply?
                </h6>
                {/* or <strong>"Penalized"</strong> */}
                <p style={{ color: COLORS.lightText, margin: 0, fontSize: "14px" }}>
                  Penalties apply to items with <strong>"Unclaimed"</strong> status.
                  An item is considered unclaimed if it hasn't been claimed before the penalty deadline (typically 10 PM).
                </p>
              </div>

              {/* Rule 2 */}
              <div
                style={{
                  borderLeft: `4px solid ${COLORS.warning}`,
                  paddingLeft: "16px",
                  paddingTop: "8px",
                  paddingBottom: "8px",
                }}
              >
                <h6 style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 6px 0" }}>
                  2. Penalty Increment
                </h6>
                <p style={{ color: COLORS.lightText, margin: 0, fontSize: "14px" }}>
                  Penalties increase by <strong>₱1 per day</strong> for each unclaimed item. If an item remains unclaimed
                  for multiple days, the penalty accumulates accordingly.
                </p>
              </div>

              {/* Rule 3 */}
              <div
                style={{
                  borderLeft: `4px solid ${COLORS.warning}`,
                  paddingLeft: "16px",
                  paddingTop: "8px",
                  paddingBottom: "8px",
                }}
              >
                <h6 style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 6px 0" }}>
                  3. Penalty Resolution
                </h6>
                <p style={{ color: COLORS.lightText, margin: 0, fontSize: "14px" }}>
                  Penalties can be resolved by having the item status changed to <strong>"Sanctioned"</strong>.
                  This is typically done by an admin after reviewing the circumstances.
                </p>
              </div>

              {/* Rule 4 */}
              <div
                style={{
                  borderLeft: `4px solid ${COLORS.warning}`,
                  paddingLeft: "16px",
                  paddingTop: "8px",
                  paddingBottom: "8px",
                }}
              >
                <h6 style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 6px 0" }}>
                  4. Penalty Status Display
                </h6>
                <p style={{ color: COLORS.lightText, margin: 0, fontSize: "14px" }}>
                  In your dashboard, the Penalty column shows the current penalty amount or status. 
                </p>
              </div>
            </div>
          </div>

          {/* Example Timeline */}
          <div
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "12px",
              padding: "24px",
              marginBottom: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <h4 style={{ color: COLORS.text, fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="bi bi-clock-history" style={{ color: COLORS.primary }} /> Example Timeline
            </h4>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div
                  style={{
                    background: "#E3F2FD",
                    border: "2px solid #2196F3",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    minWidth: "120px",
                    fontWeight: 600,
                    color: "#1976D2",
                    textAlign: "center",
                    fontSize: "13px",
                  }}
                >
                  Day 1
                </div>
                <div style={{ paddingTop: "6px" }}>
                  <p style={{ color: COLORS.text, fontWeight: 500, margin: "0 0 4px 0" }}>Item Deposited</p>
                  <p style={{ color: COLORS.lightText, fontSize: "13px", margin: 0 }}>
                    Item is marked as "Deposited" - no penalty yet
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div
                  style={{
                    background: "#FFF3E0",
                    border: "2px solid #FFA726",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    minWidth: "120px",
                    fontWeight: 600,
                    color: "#E65100",
                    textAlign: "center",
                    fontSize: "13px",
                  }}
                >
                  Day 1, 10 PM
                </div>
                <div style={{ paddingTop: "6px" }}>
                  <p style={{ color: COLORS.text, fontWeight: 500, margin: "0 0 4px 0" }}>First Deadline Passes</p>
                  <p style={{ color: COLORS.lightText, fontSize: "13px", margin: 0 }}>
                    If not claimed, item becomes "Unclaimed" with ₱1 penalty
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div
                  style={{
                    background: "#FFEBEE",
                    border: "2px solid #F08080",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    minWidth: "120px",
                    fontWeight: 600,
                    color: "#C62828",
                    textAlign: "center",
                    fontSize: "13px",
                  }}
                >
                  Day 2, 10 PM
                </div>
                <div style={{ paddingTop: "6px" }}>
                  <p style={{ color: COLORS.text, fontWeight: 500, margin: "0 0 4px 0" }}>Penalty Increments</p>
                  <p style={{ color: COLORS.lightText, fontSize: "13px", margin: 0 }}>
                    Penalty increases to ₱2 for each additional day unclaimed
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div
                  style={{
                    background: "#E8F5E9",
                    border: "2px solid #66BB6A",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    minWidth: "120px",
                    fontWeight: 600,
                    color: "#2E7D32",
                    textAlign: "center",
                    fontSize: "13px",
                  }}
                >
                  Anytime
                </div>
                <div style={{ paddingTop: "6px" }}>
                  <p style={{ color: COLORS.text, fontWeight: 500, margin: "0 0 4px 0" }}>Resolution</p>
                  <p style={{ color: COLORS.lightText, fontSize: "13px", margin: 0 }}>
                    Admin can mark item as "Sanctioned" to resolve the penalty
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* How to Avoid Penalties */}
          <div
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "12px",
              padding: "24px",
              marginBottom: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <h4 style={{ color: COLORS.text, fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="bi bi-shield-check" style={{ color: "#66BB6A" }} /> How to Avoid Penalties
            </h4>

            <ul style={{ color: COLORS.lightText, lineHeight: "1.8", paddingLeft: "20px" }}>
              <li style={{ marginBottom: "10px" }}>
                <strong style={{ color: COLORS.text }}>Claim promptly:</strong> Claim your items before the 10 PM deadline to avoid penalties
              </li>
              <li style={{ marginBottom: "10px" }}>
                <strong style={{ color: COLORS.text }}>Check notifications:</strong> Enable reminders to get notified about upcoming deadlines
              </li>
              <li style={{ marginBottom: "10px" }}>
                <strong style={{ color: COLORS.text }}>Monitor your dashboard:</strong> Regularly check your items dashboard to see which items need attention
              </li>
              <li style={{ marginBottom: "10px" }}>
                <strong style={{ color: COLORS.text }}>Contact admin:</strong> If you have a valid reason for delay, reach out to admin for assistance
              </li>
            </ul>
          </div>

          {/* FAQ */}
          <div
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "12px",
              padding: "24px",
              marginBottom: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <h4 style={{ color: COLORS.text, fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="bi bi-chat-dots" style={{ color: "#2196F3" }} /> Frequently Asked Questions
            </h4>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <h6 style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 6px 0" }}>
                  Q: Can penalties be waived?
                </h6>
                <p style={{ color: COLORS.lightText, fontSize: "14px", margin: 0 }}>
                  A: Penalties can be resolved through admin review. Contact your administrator if you believe your
                  situation warrants an exception.
                </p>
              </div>

              <div>
                <h6 style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 6px 0" }}>
                  Q: What's the maximum penalty amount?
                </h6>
                <p style={{ color: COLORS.lightText, fontSize: "14px", margin: 0 }}>
                  A: There's no set maximum - penalties continue to accumulate at ₱1 per day until the item is
                  claimed or the status is changed to "Sanctioned".
                </p>
              </div>

              <div>
                <h6 style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 6px 0" }}>
                  Q: Does claiming an item remove the penalty?
                </h6>
                <p style={{ color: COLORS.lightText, fontSize: "14px", margin: 0 }}>
                  A: When you claim an item, its status changes but any accumulated penalties remain. The penalty
                  must be resolved separately by admin action.
                </p>
              </div>

              <div>
                <h6 style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 6px 0" }}>
                  Q: When is the penalty deadline each day?
                </h6>
                <p style={{ color: COLORS.lightText, fontSize: "14px", margin: 0 }}>
                  A: The standard penalty deadline is 10 PM (22:00) each day. Items must be claimed before this
                  time to avoid incurring a penalty.
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "12px",
              padding: "24px",
              textAlign: "center",
            }}
          >
            <p style={{ color: COLORS.lightText, marginBottom: "16px" }}>
              Need more information? Check out other help topics.
            </p>
            <div className="d-flex flex-wrap justify-content-center gap-2">
              <NavLink to="/info/how-it-works" className="text-decoration-none">
                <button
                  style={{
                    background: COLORS.primary,
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 20px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "14px",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
                  onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
                >
                  <i className="bi bi-question-circle me-2" /> How It Works
                </button>
              </NavLink>

              <NavLink to="/info/faq" className="text-decoration-none">
                <button
                  style={{
                    background: "transparent",
                    color: COLORS.primary,
                    border: `2px solid ${COLORS.primary}`,
                    borderRadius: "8px",
                    padding: "10px 20px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "14px",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.target.style.background = `${COLORS.primary}10`)}
                  onMouseLeave={(e) => (e.target.style.background = "transparent")}
                >
                  <i className="bi bi-chat-dots me-2" /> More FAQ
                </button>
              </NavLink>

              <NavLink to="/info" className="text-decoration-none">
                <button
                  style={{
                    background: "transparent",
                    color: COLORS.primary,
                    border: `2px solid ${COLORS.primary}`,
                    borderRadius: "8px",
                    padding: "10px 20px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "14px",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.target.style.background = `${COLORS.primary}10`)}
                  onMouseLeave={(e) => (e.target.style.background = "transparent")}
                >
                  <i className="bi bi-house-door me-2" /> Back to Help Hub
                </button>
              </NavLink>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          background: COLORS.header,
          color: COLORS.headerText,
          borderTop: `1px solid ${COLORS.border}`,
          padding: "12px 24px",
          marginTop: "auto",
        }}
      >
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <small style={{ fontWeight: 700, fontSize: "14px" }}>WraPTrack</small>
          <small style={{ fontSize: "13px", opacity: 0.85 }}>
            © 2025 — How Penalties Work
          </small>
        </div>
      </footer>

      <style>{`
        @media (max-width: 576px) {
          main {
            padding: 16px 0;
          }
        }
      `}</style>
    </div>
  );
}

export default PenaltiesInfo;
