import React from "react";
import { NavLink } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function PrivacyPolicy() {
  const COLORS = {
    appBg: "#F1EFEC",
    header: "#123458",
    headerText: "#F1EFEC",
    surface: "#FFFFFF",
    border: "#D4C9BE",
    primary: "#123458",
    text: "#030303",
    lightText: "#666666",
    info: "#2196F3",
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
              <i className="bi bi-shield-lock me-2" /> Privacy Policy
            </h2>
            <h3 className="d-md-none" style={{ fontWeight: 700, margin: "0 0 4px 0", fontSize: "20px" }}>
              Privacy Policy
            </h3>
            <small style={{ color: COLORS.headerText, opacity: 0.85, fontSize: "14px" }}>
              How we protect and handle your personal data
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
          {/* Last Updated */}
          <div
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "12px",
              padding: "16px 24px",
              marginBottom: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <small style={{ color: COLORS.lightText, fontStyle: "italic" }}>
              <i className="bi bi-calendar-check me-2" /> Last Updated: January 2025
            </small>
          </div>

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
              Privacy Policy Overview
            </h4>
            <p style={{ color: COLORS.lightText, lineHeight: "1.8", margin: 0 }}>
              At WraPTrack, we are committed to protecting your privacy and ensuring transparency about how we collect,
              use, and protect your personal information. This Privacy Policy explains our practices regarding data collection,
              usage, and protection. By using WraPTrack, you consent to the practices described in this policy.
            </p>
          </div>

          {/* 1. Information We Collect */}
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
              <i className="bi bi-collection" style={{ color: COLORS.info }} /> 1. Information We Collect
            </h4>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <h6 style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 8px 0" }}>
                  Personal Information
                </h6>
                <ul style={{ color: COLORS.lightText, fontSize: "14px", margin: 0, paddingLeft: "20px", lineHeight: "1.8" }}>
                  <li>Full name</li>
                  <li>Email address</li>
                  <li>Student ID</li>
                  {/* <li>Phone number</li> */}
                  <li>User account credentials</li>
                  {/* <li>Profile picture or avatar</li> */}
                  <li>Role/Position (User, Guard, Admin)</li> 
                </ul>
              </div>

              <div>
                <h6 style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 8px 0" }}>
                  Item Information
                </h6>
                <ul style={{ color: COLORS.lightText, fontSize: "14px", margin: 0, paddingLeft: "20px", lineHeight: "1.8" }}>
                  <li>Item descriptions and details</li>
                  <li>Item photos and images</li>
                  <li>Item status and tracking history</li>
                  <li>Deposit and claim dates/times</li>
                  <li>Associated penalties or flags</li>
                </ul>
              </div>

              <div>
                <h6 style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 8px 0" }}>
                  Activity Data
                </h6>
                <ul style={{ color: COLORS.lightText, fontSize: "14px", margin: 0, paddingLeft: "20px", lineHeight: "1.8" }}>
                  <li>Login history and timestamps</li>
                  <li>Action history (deposits, claims, archives)</li>
                  {/* <li>Pages accessed and features used</li> */}
                  <li>Device information and browser type</li>
                  <li>IP address</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 2. How We Use Your Information */}
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
              <i className="bi bi-gear" style={{ color: COLORS.info }} /> 2. How We Use Your Information
            </h4>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ borderLeft: `4px solid ${COLORS.info}`, paddingLeft: "16px" }}>
                <p style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 4px 0" }}>Service Provision</p>
                <p style={{ color: COLORS.lightText, fontSize: "14px", margin: 0 }}>
                  To create and manage user accounts, process item deposits and claims, and track item status.
                </p>
              </div>

              <div style={{ borderLeft: `4px solid ${COLORS.info}`, paddingLeft: "16px" }}>
                <p style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 4px 0" }}>Communication</p>
                <p style={{ color: COLORS.lightText, fontSize: "14px", margin: 0 }}>
                  To send notifications about item status, penalties, deadlines, and system updates.
                </p>
              </div>

              <div style={{ borderLeft: `4px solid ${COLORS.info}`, paddingLeft: "16px" }}>
                <p style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 4px 0" }}>System Management</p>
                <p style={{ color: COLORS.lightText, fontSize: "14px", margin: 0 }}>
                  To maintain system security, prevent fraud, monitor compliance, and troubleshoot technical issues.
                </p>
              </div>

              <div style={{ borderLeft: `4px solid ${COLORS.info}`, paddingLeft: "16px" }}>
                <p style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 4px 0" }}>Analytics & Improvements</p>
                <p style={{ color: COLORS.lightText, fontSize: "14px", margin: 0 }}>
                  To analyze usage patterns, improve user experience, and develop new features.
                </p>
              </div>

              <div style={{ borderLeft: `4px solid ${COLORS.info}`, paddingLeft: "16px" }}>
                <p style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 4px 0" }}>Legal Compliance</p>
                <p style={{ color: COLORS.lightText, fontSize: "14px", margin: 0 }}>
                  To comply with legal obligations and respond to lawful requests from authorities.
                </p>
              </div>
            </div>
          </div>

          {/* 3. Data Protection & Security */}
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
              <i className="bi bi-shield-check" style={{ color: "#66BB6A" }} /> 3. Data Protection & Security
            </h4>

            <p style={{ color: COLORS.lightText, lineHeight: "1.8", marginBottom: "16px", fontSize: "14px" }}>
              We implement industry-standard security measures to protect your personal information:
            </p>

            <ul style={{ color: COLORS.lightText, fontSize: "14px", margin: 0, paddingLeft: "20px", lineHeight: "2" }}>
              <li><strong style={{ color: COLORS.text }}>Encryption:</strong> Data is encrypted during transmission using SSL/TLS protocols</li>
              <li><strong style={{ color: COLORS.text }}>Access Control:</strong> Only authorized personnel can access sensitive data</li>
              <li><strong style={{ color: COLORS.text }}>Secure Storage:</strong> Databases are secured with authentication and firewalls</li>
              <li><strong style={{ color: COLORS.text }}>Regular Audits:</strong> We conduct periodic security assessments and updates</li>
              <li><strong style={{ color: COLORS.text }}>Password Security:</strong> Passwords are hashed and salted for protection</li>
              <li><strong style={{ color: COLORS.text }}>Backup Systems:</strong> We maintain secure backups to prevent data loss</li>
            </ul>

            <p style={{ color: COLORS.lightText, lineHeight: "1.8", marginTop: "16px", fontSize: "14px" }}>
              <strong style={{ color: COLORS.text }}>Note:</strong> While we employ strong security measures, no online platform is 100% secure.
              We encourage users to use strong passwords and protect their login credentials.
            </p>
          </div>

          {/* 4. Data Retention */}
          {/* <div
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
              <i className="bi bi-calendar" style={{ color: COLORS.info }} /> 4. Data Retention
            </h4>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <p style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 6px 0" }}>Active Account Data</p>
                <p style={{ color: COLORS.lightText, fontSize: "14px", margin: 0 }}>
                  Personal and item information is retained as long as your account is active and for legitimate business purposes.
                </p>
              </div>

              <div>
                <p style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 6px 0" }}>Historical Records</p>
                <p style={{ color: COLORS.lightText, fontSize: "14px", margin: 0 }}>
                  Activity logs and transaction history are retained for audit purposes and legal compliance (typically 2-3 years).
                </p>
              </div>

              * <div>
                <p style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 6px 0" }}>Account Deletion</p>
                <p style={{ color: COLORS.lightText, fontSize: "14px", margin: 0 }}>
                  Upon request, we will delete your account data, subject to legal retention requirements and active item tracking obligations.
                </p>
              </div> *
            </div>
          </div> */}

          {/* 4. Your Privacy Rights */}
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
              <i className="bi bi-hand-thumbs-up" style={{ color: "#9C27B0" }} /> 4. Your Privacy Rights
            </h4>

            <p style={{ color: COLORS.lightText, lineHeight: "1.8", marginBottom: "16px", fontSize: "14px" }}>
              You have the right to:
            </p>

            <ul style={{ color: COLORS.lightText, fontSize: "14px", margin: 0, paddingLeft: "20px", lineHeight: "2" }}>
              {/* <li><strong style={{ color: COLORS.text }}>Access Your Data:</strong> Request a copy of all personal data we hold about you</li> */}
              <li><strong style={{ color: COLORS.text }}>Correct Information:</strong> Update or correct inaccurate personal information</li>
              {/* <li><strong style={{ color: COLORS.text }}>Delete Data:</strong> Request deletion of your account and associated data</li> */}
              <li><strong style={{ color: COLORS.text }}>Restrict Processing:</strong> Limit how we use your information</li>
              <li><strong style={{ color: COLORS.text }}>Data Portability:</strong> Receive your data in a portable format</li>
              <li><strong style={{ color: COLORS.text }}>Withdraw Consent:</strong> Opt-out of certain data processing activities</li>
            </ul>

            <p style={{ color: COLORS.lightText, lineHeight: "1.8", marginTop: "16px", fontSize: "14px" }}>
              To exercise these rights, please email us at <strong>wraptrackteam1.0@gmail.com</strong>.
            </p>
          </div>

          {/* 5. Sharing of Information */}
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
              <i className="bi bi-share" style={{ color: COLORS.info }} /> 5. Sharing of Information
            </h4>

            <p style={{ color: COLORS.lightText, lineHeight: "1.8", marginBottom: "16px", fontSize: "14px" }}>
              We do <strong>not</strong> sell, trade, or rent your personal information to third parties. However, we may share information:
            </p>

            <ul style={{ color: COLORS.lightText, fontSize: "14px", margin: 0, paddingLeft: "20px", lineHeight: "2" }}>
              <li><strong style={{ color: COLORS.text }}>With Service Providers:</strong> Vendors who help us operate the system (hosting, email, etc.)</li>
              <li><strong style={{ color: COLORS.text }}>With Administrators:</strong> System admins who manage user accounts and item tracking</li>
              <li><strong style={{ color: COLORS.text }}>Legal Requirements:</strong> When required by law or court orders</li>
              <li><strong style={{ color: COLORS.text }}>System Security:</strong> To prevent fraud, abuse, or security breaches</li>
            </ul>
          </div>

          {/* 7. Cookies & Tracking */}
          {/* <div
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
              <i className="bi bi-browser-chrome" style={{ color: COLORS.info }} /> 7. Cookies & Tracking
            </h4>

            <p style={{ color: COLORS.lightText, lineHeight: "1.8", marginBottom: "12px", fontSize: "14px" }}>
              WraPTrack uses cookies and similar technologies to:
            </p>

            <ul style={{ color: COLORS.lightText, fontSize: "14px", margin: 0, paddingLeft: "20px", lineHeight: "2", marginBottom: "16px" }}>
              <li>Maintain user sessions and authentication</li>
              <li>Remember user preferences and settings</li>
              <li>Analyze usage patterns and improve the platform</li>
              <li>Provide security features</li>
            </ul>

            <p style={{ color: COLORS.lightText, lineHeight: "1.8", fontSize: "14px" }}>
              You can manage cookie preferences in your browser settings. Disabling cookies may affect certain platform features.
            </p>
          </div> */}

          {/* 8. Third-Party Links */}
          {/* <div
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "12px",
              padding: "24px",
              marginBottom: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <h4 style={{ color: COLORS.text, fontWeight: 700, marginBottom: "16px" }}>
              8. Third-Party Links
            </h4>

            <p style={{ color: COLORS.lightText, lineHeight: "1.8", fontSize: "14px" }}>
              WraPTrack may contain links to external websites. We are not responsible for the privacy practices of third-party sites.
              We encourage you to review their privacy policies before providing any information.
            </p>
          </div> */}

          {/* 9. Children's Privacy */}
          {/* <div
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "12px",
              padding: "24px",
              marginBottom: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <h4 style={{ color: COLORS.text, fontWeight: 700, marginBottom: "16px" }}>
              9. Children's Privacy
            </h4>

            <p style={{ color: COLORS.lightText, lineHeight: "1.8", fontSize: "14px" }}>
              WraPTrack is not intended for individuals under 18 years of age. We do not knowingly collect information from minors.
              If we become aware of data collection from a child, we will delete it immediately.
            </p>
          </div> */}

          {/* 10. Policy Changes */}
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
            <h4 style={{ color: COLORS.text, fontWeight: 700, marginBottom: "16px" }}>
              6. Changes to This Policy
            </h4>

            <p style={{ color: COLORS.lightText, lineHeight: "1.8", fontSize: "14px" }}>
              We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements.
              The "Last Updated" date at the top of this page indicates the most recent revision. We will notify you of significant
              changes via email or through the platform. Continued use of WraPTrack constitutes acceptance of the updated policy.
            </p>
          </div>

          {/* Contact Us */}
          <div
            style={{
              background: "#E3F2FD",
              border: `2px solid ${COLORS.info}`,
              borderRadius: "12px",
              padding: "24px",
              marginBottom: "24px",
            }}
          >
            <h4 style={{ color: COLORS.text, fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="bi bi-envelope" style={{ color: COLORS.info }} /> Contact Us
            </h4>

            <p style={{ color: COLORS.lightText, lineHeight: "1.8", fontSize: "14px", marginBottom: "12px" }}>
              If you have questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us:
            </p>

            <div style={{ background: "white", borderRadius: "8px", padding: "16px", border: `1px solid ${COLORS.border}` }}>
              <p style={{ color: COLORS.text, margin: "0 0 8px 0", fontSize: "14px" }}>
                <strong>Email:</strong> wraptrackteam1.0@gmail.com
              </p>
              {/* <p style={{ color: COLORS.text, margin: "0 0 8px 0", fontSize: "14px" }}>
                <strong>Support:</strong> support@wraptrack.com
              </p> */}
              <p style={{ color: COLORS.text, margin: "0", fontSize: "14px" }}>
                <strong>Response Time:</strong> We will respond to all privacy inquiries within 7-10 business days.
              </p>
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
              Explore other policies and information
            </p>
            <div className="d-flex flex-wrap justify-content-center gap-2">
              <NavLink to="/info/terms" className="text-decoration-none">
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
                  <i className="bi bi-file-text me-2" /> Terms of Service
                </button>
              </NavLink>

              <NavLink to="/info/penalties" className="text-decoration-none">
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
                  <i className="bi bi-exclamation-triangle me-2" /> Penalties
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
            © 2025 — Privacy Policy
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

export default PrivacyPolicy;
