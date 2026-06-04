import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function InfoHub() {
  const COLORS = {
    appBg: "#F1EFEC",
    header: "#123458",
    headerText: "#F1EFEC",
    surface: "#FFFFFF",
    border: "#D4C9BE",
    primary: "#123458",
    text: "#030303",
    lightText: "#666666",
  };

  const navigate = useNavigate();

  // Check if user is logged in
  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;

  const sections = [
    {
      title: "How Penalties Work",
      icon: "bi-exclamation-triangle",
      path: "/info/penalties",
      description: "Learn about the penalty system, how it applies, and how to resolve penalties",
      color: "#FFA726",
    },
    // {
    //   title: "How It Works",
    //   icon: "bi-question-circle",
    //   path: "/info/how-it-works",
    //   description: "System overview & complete user guide for WraPTrack",
    //   color: "#66BB6A",
    // },
    {
      title: "Terms of Service",
      icon: "bi-file-text",
      path: "/info/terms",
      description: "Terms and conditions for using WraPTrack",
      color: "#2196F3",
    },
    {
      title: "Privacy Policy",
      icon: "bi-shield-lock",
      path: "/info/privacy",
      description: "How we protect and handle your personal data",
      color: "#9C27B0",
    },
    {
      title: "FAQ",
      icon: "bi-chat-dots",
      path: "/info/faq",
      description: "Frequently asked questions and troubleshooting",
      color: "#F44336",
    },
  ];

  const handleBack = () => {
    if (user) {
      navigate("/user/home");
    } else {
      navigate("/");
    }
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
              Help & Information
            </h2>
            <h3 className="d-md-none" style={{ fontWeight: 700, margin: "0 0 4px 0", fontSize: "20px" }}>
              Help & Info
            </h3>
            <small style={{ color: COLORS.headerText, opacity: 0.85, fontSize: "14px" }}>
              Everything you need to know about WraPTrack
            </small>
          </div>
          <button
            onClick={handleBack}
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
            <i className="bi bi-arrow-left me-2" /> {user ? "Back to Dashboard" : "Back to Home"}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: "32px 0" }}>
        <div className="container-fluid px-3 px-md-4">
          <div className="row g-3 g-md-4">
            {sections.map((section, idx) => (
              <div key={idx} className="col-12 col-md-6 col-lg-4">
                <NavLink to={section.path} className="text-decoration-none">
                  <div
                    style={{
                      background: COLORS.surface,
                      border: `2px solid ${COLORS.border}`,
                      borderRadius: "12px",
                      padding: "24px",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = section.color;
                      e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.1), 0 0 0 3px ${section.color}20`;
                      e.currentTarget.style.transform = "translateY(-4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = COLORS.border;
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        background: `${section.color}15`,
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: section.color,
                      }}
                    >
                      <i className={`bi ${section.icon}`} style={{ fontSize: "24px" }} />
                    </div>

                    {/* Title */}
                    <h5
                      style={{
                        fontWeight: 700,
                        color: COLORS.text,
                        margin: "8px 0 0 0",
                        fontSize: "18px",
                      }}
                    >
                      {section.title}
                    </h5>

                    {/* Description */}
                    <p
                      style={{
                        color: COLORS.lightText,
                        fontSize: "14px",
                        margin: "0",
                        lineHeight: "1.5",
                      }}
                    >
                      {section.description}
                    </p>

                    {/* Arrow indicator */}
                    <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: "6px", color: section.color }}>
                      <span style={{ fontSize: "14px", fontWeight: 600 }}>Learn more</span>
                      <i className="bi bi-arrow-right" style={{ fontSize: "16px" }} />
                    </div>
                  </div>
                </NavLink>
              </div>
            ))}
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
            © 2025 — Help & Information
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

export default InfoHub;
