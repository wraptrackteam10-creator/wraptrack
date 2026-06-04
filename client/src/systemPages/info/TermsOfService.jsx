import React from "react";
import { NavLink } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function TermsOfService() {
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
              <i className="bi bi-file-text me-2" /> Terms of Service
            </h2>
            <h3 className="d-md-none" style={{ fontWeight: 700, margin: "0 0 4px 0", fontSize: "20px" }}>
              Terms of Service
            </h3>
            <small style={{ color: COLORS.headerText, opacity: 0.85, fontSize: "14px" }}>
              Terms and conditions for using WraPTrack
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

          {/* Agreement Acceptance */}
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
              Terms of Service Agreement
            </h4>
            <p style={{ color: COLORS.lightText, lineHeight: "1.8", margin: 0 }}>
              Welcome to WraPTrack ("Platform," "Service," "We," "Us," or "Our"). By accessing and using WraPTrack, you agree to be bound
              by these Terms of Service. If you do not agree to these terms, please do not use the Platform. We reserve the right to modify
              these terms at any time, and your continued use constitutes acceptance of the updated terms.
            </p>
          </div>

          {/* 1. Account Registration & Responsibility */}
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
              <i className="bi bi-person-check" style={{ color: COLORS.info }} /> 1. Account Registration & Responsibility
            </h4>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <h6 style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 8px 0" }}>
                  Account Creation
                </h6>
                <p style={{ color: COLORS.lightText, fontSize: "14px", margin: 0, lineHeight: "1.6" }}>
                  To use WraPTrack, you must create an account with accurate, current, and complete information. You are responsible for
                  maintaining the confidentiality of your login credentials and password. You agree to accept responsibility for all activities
                  that occur under your account.
                </p>
              </div>

              {/* <div>
                <h6 style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 8px 0" }}>
                  Age Requirement
                </h6>
                <p style={{ color: COLORS.lightText, fontSize: "14px", margin: 0, lineHeight: "1.6" }}>
                  You must be at least 18 years old to use this Platform. By registering, you confirm that you meet this age requirement.
                </p>
              </div> */}

              <div>
                <h6 style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 8px 0" }}>
                  Prohibited Uses
                </h6>
                <p style={{ color: COLORS.lightText, fontSize: "14px", margin: 0, lineHeight: "1.6", marginBottom: "8px" }}>
                  You agree not to:
                </p>
                <ul style={{ color: COLORS.lightText, fontSize: "14px", margin: 0, paddingLeft: "20px", lineHeight: "1.8" }}>
                  <li>Use false or misleading information in your account</li>
                  <li>Share your account credentials with others</li>
                  <li>Attempt to gain unauthorized access to the system</li>
                  <li>Use the platform for illegal or fraudulent purposes</li>
                  <li>Harass, threaten, or abuse other users</li>
                  <li>Upload malicious files or attempt to disrupt service</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 2. Item Deposit & Claim Service */}
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
              <i className="bi bi-box" style={{ color: COLORS.info }} /> 2. Item Deposit & Claim Service
            </h4>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <h6 style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 8px 0" }}>
                  Service Purpose
                </h6>
                <p style={{ color: COLORS.lightText, fontSize: "14px", margin: 0, lineHeight: "1.6" }}>
                  WraPTrack is an item tracking and management platform designed to facilitate the deposit and claim of items.
                  {/* We provide the infrastructure and tools but do not take physical possession of items unless explicitly stated. */}
                </p>
              </div>

              <div>
                <h6 style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 8px 0" }}>
                  User Responsibility
                </h6>
                <p style={{ color: COLORS.lightText, fontSize: "14px", margin: 0, lineHeight: "1.6" }}>
                  Users are responsible for:
                </p>
                <ul style={{ color: COLORS.lightText, fontSize: "14px", margin: "8px 0 0 0", paddingLeft: "20px", lineHeight: "1.8" }}>
                  {/* <li>Accurately describing deposited items</li> */}
                  <li>Providing clear item photographs</li>
                  <li>Claiming items within the specified timeframe</li>
                  <li>Maintaining accurate contact information</li>
                  <li>Responding to system notifications promptly</li>
                </ul>
              </div>

              {/* <div>
                <h6 style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 8px 0" }}>
                  Item Validity
                </h6>
                <p style={{ color: COLORS.lightText, fontSize: "14px", margin: 0, lineHeight: "1.6" }}>
                  Users may not deposit illegal, hazardous, stolen, or prohibited items. WraPTrack reserves the right to refuse service
                  for items that violate local laws or platform policies.
                </p>
              </div> */}
            </div>
          </div>

          {/* 3. Penalty System */}
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
              <i className="bi bi-exclamation-triangle" style={{ color: COLORS.warning }} /> 3. Penalty System
            </h4>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <h6 style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 8px 0" }}>
                  Penalty Terms
                </h6>
                <p style={{ color: COLORS.lightText, fontSize: "14px", margin: 0, lineHeight: "1.6" }}>
                  Penalties are assessed on unclaimed items according to the penalty schedule defined by WraPTrack. By using the platform,
                  you acknowledge and accept the penalty terms and agree to abide by all penalty deadlines.
                </p>
              </div>

              <div>
                <h6 style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 8px 0" }}>
                  Penalty Acceptance
                </h6>
                <p style={{ color: COLORS.lightText, fontSize: "14px", margin: 0, lineHeight: "1.6" }}>
                  Users accept full responsibility for any penalties incurred due to failure to claim items within the designated timeframe.
                  Penalties may affect your account standing and future use of the platform.
                </p>
              </div>

              <div>
                <h6 style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 8px 0" }}>
                  Dispute Resolution
                </h6>
                <p style={{ color: COLORS.lightText, fontSize: "14px", margin: 0, lineHeight: "1.6" }}>
                  Penalty disputes must be submitted in writing within 7 days of penalty assessment. WraPTrack reserves the right to
                  review and determine if penalties are justified based on platform guidelines.
                </p>
              </div>
            </div>
          </div>

          {/* 4. Intellectual Property Rights */}
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
              <i className="bi bi-shield" style={{ color: COLORS.info }} /> 4. Intellectual Property Rights
            </h4>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <h6 style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 8px 0" }}>
                  Platform Ownership
                </h6>
                <p style={{ color: COLORS.lightText, fontSize: "14px", margin: 0, lineHeight: "1.6" }}>
                  All content, designs, logos, and functionality of WraPTrack are owned by WraPTrack or its licensors. You may not
                  reproduce, distribute, or transmit any Platform content without explicit permission.
                </p>
              </div>

              <div>
                <h6 style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 8px 0" }}>
                  User Content
                </h6>
                <p style={{ color: COLORS.lightText, fontSize: "14px", margin: 0, lineHeight: "1.6" }}>
                  By uploading item photos or descriptions, you grant WraPTrack a non-exclusive, worldwide license to use, store,
                  and display this content for the purpose of operating the service.
                </p>
              </div>

              <div>
                <h6 style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 8px 0" }}>
                  Trademark
                </h6>
                <p style={{ color: COLORS.lightText, fontSize: "14px", margin: 0, lineHeight: "1.6" }}>
                  "WraPTrack" and associated logos are trademarks of WraPTrack. You may not use these trademarks without written permission.
                </p>
              </div>
            </div>
          </div>

          {/* 5. Limitation of Liability */}
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
              <i className="bi bi-info-circle" style={{ color: COLORS.warning }} /> 5. Limitation of Liability
            </h4>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* <div style={{ borderLeft: `4px solid ${COLORS.danger}`, paddingLeft: "16px" }}>
                <p style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 4px 0" }}>
                  "As-Is" Service
                </p>
                <p style={{ color: COLORS.lightText, fontSize: "14px", margin: 0 }}>
                  WraPTrack is provided on an "as-is" basis without warranties. We do not guarantee uninterrupted service or
                  error-free operation.
                </p>
              </div> */}

              <div style={{ borderLeft: `4px solid ${COLORS.danger}`, paddingLeft: "16px" }}>
                <p style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 4px 0" }}>
                  No Liability for Data Loss
                </p>
                <p style={{ color: COLORS.lightText, fontSize: "14px", margin: 0 }}>
                  WraPTrack is not liable for loss, corruption, or unauthorized access to user data, except where prohibited by law.
                </p>
              </div>

              <div style={{ borderLeft: `4px solid ${COLORS.danger}`, paddingLeft: "16px" }}>
                <p style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 4px 0" }}>
                  Limitation of Damages
                </p>
                <p style={{ color: COLORS.lightText, fontSize: "14px", margin: 0 }}>
                  In no event shall WraPTrack be liable for indirect, incidental, or consequential damages arising from platform use.
                </p>
              </div>

              <div style={{ borderLeft: `4px solid ${COLORS.danger}`, paddingLeft: "16px" }}>
                <p style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 4px 0" }}>
                  Third-Party Content
                </p>
                <p style={{ color: COLORS.lightText, fontSize: "14px", margin: 0 }}>
                  WraPTrack is not responsible for third-party links or external content accessible through the platform.
                </p>
              </div>
            </div>
          </div>

          {/* 6. User Conduct & Violations */}
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
              <i className="bi bi-ban" style={{ color: COLORS.danger }} /> 6. User Conduct & Violations
            </h4>

            <p style={{ color: COLORS.lightText, fontSize: "14px", margin: "0 0 12px 0", lineHeight: "1.6" }}>
              WraPTrack reserves the right to:
            </p>

            <ul style={{ color: COLORS.lightText, fontSize: "14px", margin: 0, paddingLeft: "20px", lineHeight: "2" }}>
              <li>Suspend or terminate accounts that violate these terms</li>
              <li>Remove content that is illegal or violates policies</li>
              <li>Investigate suspected fraud or unauthorized access</li>
              <li>Cooperate with law enforcement investigations</li>
              <li>Modify or discontinue the platform with notice</li>
              <li>Impose penalties for terms violations</li>
            </ul>
          </div>

          {/* 7. Security & Data Breach */}
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
              <i className="bi bi-lock" style={{ color: "#66BB6A" }} /> 7. Security & Data Breach
            </h4>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <h6 style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 8px 0" }}>
                  Security Measures
                </h6>
                <p style={{ color: COLORS.lightText, fontSize: "14px", margin: 0, lineHeight: "1.6" }}>
                  WraPTrack employs industry-standard security practices to protect user data. However, no system is completely secure,
                  and we cannot guarantee absolute protection against all threats.
                </p>
              </div>

              <div>
                <h6 style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 8px 0" }}>
                  Breach Notification
                </h6>
                <p style={{ color: COLORS.lightText, fontSize: "14px", margin: 0, lineHeight: "1.6" }}>
                  In the event of a confirmed data breach, WraPTrack will notify affected users within 30 days and provide guidance
                  on protective measures. WraPTrack is not liable for damages resulting from user security negligence.
                </p>
              </div>
            </div>
          </div>

          {/* 8. Indemnification */}
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
              8. Indemnification
            </h4>

            <p style={{ color: COLORS.lightText, fontSize: "14px", margin: 0, lineHeight: "1.6" }}>
              You agree to indemnify and hold harmless WraPTrack, its officers, employees, and agents from any claims, damages,
              or expenses arising from your violation of these Terms, your use of the platform, or your infringement of any rights.
            </p>
          </div>

          {/* 9. Dispute Resolution & Governing Law */}
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
              <i className="bi bi-scales" style={{ color: COLORS.info }} /> 9. Dispute Resolution & Governing Law
            </h4>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <h6 style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 8px 0" }}>
                  Dispute Process
                </h6>
                <p style={{ color: COLORS.lightText, fontSize: "14px", margin: 0, lineHeight: "1.6" }}>
                  Any disputes arising from these Terms shall first be resolved through good-faith negotiation between the parties.
                  If resolution cannot be reached, disputes shall be subject to arbitration in accordance with applicable laws.
                </p>
              </div>

              <div>
                <h6 style={{ color: COLORS.text, fontWeight: 600, margin: "0 0 8px 0" }}>
                  Governing Law
                </h6>
                <p style={{ color: COLORS.lightText, fontSize: "14px", margin: 0, lineHeight: "1.6" }}>
                  These Terms are governed by and construed in accordance with applicable local and national laws.
                </p>
              </div>
            </div>
          </div>

          {/* 10. Modification of Terms */}
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
              10. Modification of Terms
            </h4>

            <p style={{ color: COLORS.lightText, fontSize: "14px", margin: 0, lineHeight: "1.6" }}>
              WraPTrack reserves the right to modify these Terms at any time. We will notify users of significant changes via email
              or platform announcement. Continued use of the platform after changes are posted constitutes acceptance of the updated Terms.
            </p>
          </div>

          {/* 11. Severability */}
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
              11. Severability
            </h4>

            <p style={{ color: COLORS.lightText, fontSize: "14px", margin: 0, lineHeight: "1.6" }}>
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall remain in effect.
              The invalid provision shall be modified to the minimum extent necessary to make it enforceable.
            </p>
          </div>

          {/* 12. Entire Agreement */}
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
              12. Entire Agreement
            </h4>

            <p style={{ color: COLORS.lightText, fontSize: "14px", margin: 0, lineHeight: "1.6" }}>
              These Terms of Service, together with the Privacy Policy, constitute the entire agreement between you and WraPTrack
              regarding the use of the platform and supersede all prior agreements and understandings.
            </p>
          </div>

          {/* Contact Us */}
          <div
            style={{
              background: "#FFF3E0",
              border: `2px solid ${COLORS.warning}`,
              borderRadius: "12px",
              padding: "24px",
              marginBottom: "24px",
            }}
          >
            <h4 style={{ color: COLORS.text, fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="bi bi-envelope" style={{ color: COLORS.warning }} /> Questions About These Terms?
            </h4>

            <p style={{ color: COLORS.lightText, lineHeight: "1.8", fontSize: "14px", marginBottom: "12px" }}>
              If you have questions or concerns about these Terms of Service, please contact us:
            </p>

            <div style={{ background: "white", borderRadius: "8px", padding: "16px", border: `1px solid ${COLORS.border}` }}>
              <p style={{ color: COLORS.text, margin: "0 0 8px 0", fontSize: "14px" }}>
                <strong>Email:</strong> wraptrackteam1.0@gmail.com
              </p>
              {/* <p style={{ color: COLORS.text, margin: "0 0 8px 0", fontSize: "14px" }}>
                <strong>Support:</strong> support@wraptrack.com
              </p> */}
              <p style={{ color: COLORS.text, margin: "0", fontSize: "14px" }}>
                <strong>Response Time:</strong> We will respond to all inquiries within 7-10 business days.
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
              <NavLink to="/info/privacy" className="text-decoration-none">
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
                  <i className="bi bi-shield-lock me-2" /> Privacy Policy
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
            © 2025 — Terms of Service
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

export default TermsOfService;
