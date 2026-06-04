import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

function FAQ() {
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
    success: "#66BB6A",
  };

  const [expandedItem, setExpandedItem] = useState(null);
  const SUPPORT_EMAIL = "wraptrackteam1.0@gmail.com";

  const faqCategories = [
    {
      title: "Account & Registration",
      icon: "bi-person-circle",
      color: "#2196F3",
      questions: [
        {
          q: "How do I create an account?",
          a: "Visit the Sign-Up page and fill in your details including full name, email, and a secure password. After submitting, verify your email address to activate your account.",
        },
        {
          q: "What should I do if I forget my password?",
          a: "Click 'Forgot Password' on the login page and follow the instructions sent to your registered email. You'll receive a reset code to create a new password.",
        },
        {
          q: "Can multiple people use the same account?",
          a: "No, each user must have their own account. Sharing credentials is prohibited and may result in account suspension.",
        },
      ],
    },
    {
      title: "Item Deposit & Management",
      icon: "bi-box",
      color: "#FFA726",
      questions: [
        {
          q: "How do I deposit an item?",
          a: "Navigate to 'Deposit' from your dashboard. Take a clear photo of the item and YOLO model automatically generates a description. Submit the form to complete the deposit.",
        },
        {
          q: "Can I upload multiple photos?",
          a: "Currently, you can upload one primary photo per item. Ensure it clearly shows the item from a good angle.",
        },
        {
          q: "What types of items are prohibited?",
          a: "Illegal items, hazardous materials, stolen goods, weapons, and perishables are not allowed. Violating this may result in account suspension.",
        },
        {
          q: "How long can I keep an item deposited?",
          a: "Items can remain deposited indefinitely, but they must be claimed before the daily deadline (10 PM) to avoid penalties.",
        },
      ],
    },
    {
      title: "Item Claiming & Penalties",
      icon: "bi-exclamation-triangle",
      color: "#F08080",
      questions: [
        {
          q: "How do I claim an item?",
          a: "Go to the 'Claim' section, select the item you want to claim, and confirm. The item status will change to 'Claimed'.",
        },
        {
          q: "When is the claim deadline each day?",
          a: "The standard claim deadline is 10:00 PM (22:00) each day. Items must be claimed before this time to avoid penalties.",
        },
        {
          q: "What happens if I miss the deadline?",
          a: "The item becomes 'Unclaimed' and a ₱1 penalty is assessed. The penalty increases by ₱1 for each additional day unclaimed.",
        },
        {
          q: "How are penalties calculated?",
          a: "Penalties apply to unclaimed items starting the day after deposit (if not claimed by 10 PM). Each subsequent day adds ₱1 to the penalty amount.",
        },
        {
          q: "Can I dispute a penalty?",
          a: "Yes, you can submit a dispute within 7 days of the penalty date. Contact support or use the dispute form in your dashboard.",
        },
        {
          q: "What does 'Sanctioned' status mean?",
          a: "'Sanctioned' means the penalty has been resolved by an administrator after review. The penalty is no longer active.",
        },
      ],
    },
    {
      title: "Dashboard & Notifications",
      icon: "bi-bell",
      color: "#FFA726",
      questions: [
        {
          q: "What information does the dashboard show?",
          a: "Your dashboard displays all your deposited items with their status, deposit date/time, and any associated penalties. You can also see upcoming deadlines.",
        },
        {
          q: "How do I enable notifications?",
          a: "Go to Settings and toggle 'Enable Notifications'. You'll receive alerts about upcoming deadlines, claim confirmations, and important updates.",
        },
        {
          q: "Why am I not receiving notifications?",
          a: "Check that notifications are enabled in Settings and that you've verified your email. Also check your spam/junk folder.",
        },
        {
          q: "Can I see my action history?",
          a: "Yes, visit the 'History' section to view all your past deposits, claims, and other activities with timestamps.",
        },
        {
          q: "How far back does the history go?",
          a: "History records are retained for 2-3 years. Older records may be archived for storage purposes.",
        },
      ],
    },
    {
      title: "Item Status & States",
      icon: "bi-tag",
      color: "#2196F3",
      questions: [
        {
          q: "What does 'Deposited' status mean?",
          a: "'Deposited' means the item has been registered in the system and is waiting to be claimed before the daily deadline.",
        },
        {
          q: "What does 'Claimed' status mean?",
          a: "'Claimed' indicates that you have successfully claimed the item. It no longer needs action unless a penalty is pending.",
        },
        {
          q: "What does 'Pending Verification' status mean?",
          a: "'Pending Verification' means the item is awaiting review or confirmation from an administrator before being fully processed.",
        },
        {
          q: "What does 'Unclaimed' status mean?",
          a: "'Unclaimed' indicates the item was not claimed by the 10 PM deadline. A penalty is being assessed daily.",
        },
        {
          q: "What does 'Archived' status mean?",
          a: "'Archived' means you have intentionally removed the item from your active dashboard. It can be viewed in archive history.",
        },
        {
          q: "Can I recover an archived item?",
          a: "Currently, archived items cannot be recovered. Archive items only when you're certain you won't need them.",
        },
      ],
    },
    {
      title: "Security & Privacy",
      icon: "bi-shield-lock",
      color: "#66BB6A",
      questions: [
        {
          q: "Is my personal information safe?",
          a: "Yes, we use encryption, secure databases, and regular security audits to protect your data. See our Privacy Policy for details.",
        },
        {
          q: "How are passwords stored?",
          a: "Passwords are hashed and salted using industry-standard algorithms. We never store plain-text passwords.",
        },
        {
          q: "What should I do if I suspect my account has been hacked?",
          a: "Change your password immediately and contact support. We can help secure your account and investigate unauthorized activity.",
        },
        {
          q: "Who can see my item photos?",
          a: "Only authorized personnel (admins, guards) and yourself can view your item photos. Photos are not shared publicly.",
        },
        {
          q: "How long is my data kept?",
          a: "Active account data is retained indefinitely. Historical records are kept for 2-3 years for audit purposes, then archived.",
        },
      ],
    },
    {
      title: "Technical & Support",
      icon: "bi-wrench",
      color: "#9C27B0",
      questions: [
        {
          q: "What browsers are supported?",
          a: "WraPTrack works on Chrome, Firefox, Safari, and Edge. We recommend using the latest version of your browser.",
        },
        {
          q: "Does WraPTrack work on mobile?",
          a: "Yes, WraPTrack is PWA and fully responsive and works on smartphones and tablets. Install the web app from browser to have mobile app experience.",
        },
        {
          q: "Why is the platform running slowly?",
          a: "Try clearing your browser cache, disabling extensions, or using a different browser. Contact support if the issue persists.",
        },
        {
          q: "What should I do if I encounter an error?",
          a: "Note the error message and any steps that led to it. Contact support with this information so we can help resolve it.",
        },
        {
          q: "How do I contact support?",
          a: `Email ${SUPPORT_EMAIL} or use the contact form in the Help section. We respond within 24-48 hours.`,
        },
        {
          q: "Is there scheduled maintenance?",
          a: "We perform maintenance outside business hours. You'll be notified in advance if downtime is expected.",
        },
      ],
    },
    {
      title: "Roles & Permissions",
      icon: "bi-person-badge",
      color: "#2196F3",
      questions: [
        {
          q: "What's the difference between User, Guard, and Admin roles?",
          a: "Users deposit and claim items. Guards manage and track items in the facility. Admins oversee the system, manage users, and resolve penalties.",
        },
        {
          q: "Can I change my role?",
          a: "Role changes are determined by administrators. Contact your admin if you need a role change for your position.",
        },
        {
          q: "What can guards see?",
          a: "Guards can view all items in the facility, their status, and tracking history. They assist with item verification and management.",
        },
        {
          q: "Can guards modify my items?",
          a: "Guards can verify and update item status but cannot archive items. Only admins can make significant system changes.",
        },
        {
          q: "What do admins do?",
          a: "Admins manage user accounts, resolve penalties, monitor reports, manage guards, and configure system settings.",
        },
      ],
    },
    {
      title: "Billing & Policies",
      icon: "bi-receipt",
      color: "#66BB6A",
      questions: [
        {
          q: "Is WraPTrack free to use?",
          a: "Basic access is free. However, penalties may have associated costs. Check with your organization.",
        },
        {
          q: "How are penalties enforced?",
          a: "Penalties are tracked in your account. Accumulated penalties may affect your account privileges or require settlement.",
        },
        {
          q: "Are there any hidden fees?",
          a: "No, all costs are transparent and clearly communicated. There are no hidden fees.",
        },
      ],
    },
    {
      title: "General Questions",
      icon: "bi-question-circle",
      color: "#FFA726",
      questions: [
        {
          q: "What is WraPTrack?",
          a: "WraPTrack is an item tracking and management system designed to facilitate the deposit, tracking, and claiming of items in an organized manner.",
        },
        {
          q: "Who manages WraPTrack?",
          a: "WraPTrack is managed by your university's guard administrators. They configure settings, manage users, and oversee the system.",
        },
        {
          q: "Can I use WraPTrack offline?",
          a: "No, WraPTrack requires an internet connection to function. All data is stored on secure servers.",
        },
        {
          q: "How often is WraPTrack updated?",
          a: "We regularly release updates and improvements. You'll be notified of significant changes via email and platform announcements.",
        },
        {
          q: "Where can I see the full Terms of Service?",
          a: "Visit the 'Terms of Service' page in the Help section for the complete legal terms and conditions.",
        },
        {
          q: "How do I provide feedback or suggestions?",
          a: `We welcome feedback! Email ${SUPPORT_EMAIL} with your suggestions or feature requests.`,
        },
      ],
    },
  ];

  const toggleExpanded = (index) => {
    setExpandedItem(expandedItem === index ? null : index);
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
              <i className="bi bi-chat-dots me-2" /> FAQ
            </h2>
            <h3 className="d-md-none" style={{ fontWeight: 700, margin: "0 0 4px 0", fontSize: "20px" }}>
              FAQ
            </h3>
            <small style={{ color: COLORS.headerText, opacity: 0.85, fontSize: "14px" }}>
              Frequently asked questions and answers
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
          {/* Search Note */}
          <div
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "12px",
              padding: "16px 24px",
              marginBottom: "32px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              textAlign: "center",
            }}
          >
            <p style={{ color: COLORS.lightText, margin: 0, fontSize: "14px" }}>
              <i className="bi bi-lightbulb me-2" style={{ color: COLORS.info }} />
              Click on any question to reveal the answer
            </p>
          </div>

          {/* FAQ Categories */}
          {faqCategories.map((category, catIdx) => (
            <div key={catIdx} style={{ marginBottom: "40px" }}>
              {/* Category Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "20px",
                  paddingBottom: "12px",
                  borderBottom: `3px solid ${category.color}`,
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    background: `${category.color}15`,
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: category.color,
                  }}
                >
                  <i className={`bi ${category.icon}`} style={{ fontSize: "18px" }} />
                </div>
                <h4 style={{ color: COLORS.text, fontWeight: 700, margin: 0, fontSize: "20px" }}>
                  {category.title}
                </h4>
              </div>

              {/* FAQ Items */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {category.questions.map((item, qIdx) => {
                  const itemIndex = `${catIdx}-${qIdx}`;
                  const isExpanded = expandedItem === itemIndex;

                  return (
                    <div
                      key={itemIndex}
                      style={{
                        background: COLORS.surface,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: "10px",
                        overflow: "hidden",
                        transition: "all 0.3s ease",
                        boxShadow: isExpanded ? "0 4px 12px rgba(0,0,0,0.1)" : "0 2px 8px rgba(0,0,0,0.06)",
                        borderLeft: `4px solid ${category.color}`,
                      }}
                    >
                      {/* Question Header */}
                      <button
                        onClick={() => toggleExpanded(itemIndex)}
                        style={{
                          width: "100%",
                          background: isExpanded ? `${category.color}08` : "transparent",
                          border: "none",
                          padding: "16px 20px",
                          textAlign: "left",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "12px",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!isExpanded) {
                            e.currentTarget.style.background = `${category.color}05`;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isExpanded) {
                            e.currentTarget.style.background = "transparent";
                          }
                        }}
                      >
                        <span style={{ color: COLORS.text, fontWeight: 600, fontSize: "15px", flex: 1 }}>
                          {item.q}
                        </span>
                        <i
                          className={`bi bi-chevron-${isExpanded ? "up" : "down"}`}
                          style={{
                            color: category.color,
                            fontSize: "18px",
                            transition: "transform 0.2s ease",
                          }}
                        />
                      </button>

                      {/* Answer Content */}
                      {isExpanded && (
                        <div
                          style={{
                            background: `${category.color}05`,
                            borderTop: `1px solid ${COLORS.border}`,
                            padding: "16px 20px",
                          }}
                        >
                          <p style={{ color: COLORS.lightText, fontSize: "14px", margin: 0, lineHeight: "1.6" }}>
                            {item.a}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Still Need Help */}
          <div
            style={{
              background: "#E3F2FD",
              border: `2px solid ${COLORS.info}`,
              borderRadius: "12px",
              padding: "32px 24px",
              textAlign: "center",
              marginBottom: "24px",
            }}
          >
            <h4 style={{ color: COLORS.text, fontWeight: 700, marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <i className="bi bi-chat-heart" style={{ color: COLORS.info }} /> Didn't find your answer?
            </h4>

            <p style={{ color: COLORS.lightText, marginBottom: "20px", fontSize: "14px" }}>
              Our support team is here to help. Reach out with any questions or concerns.
            </p>

            <div
              style={{
                background: "white",
                borderRadius: "10px",
                padding: "20px",
                border: `1px solid ${COLORS.border}`,
                marginBottom: "20px",
              }}
            >
              <p style={{ color: COLORS.text, margin: "0 0 8px 0", fontSize: "14px" }}>
                <strong>Email:</strong> <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: COLORS.info, textDecoration: "none" }}>{SUPPORT_EMAIL}</a>
              </p>
              <p style={{ color: COLORS.text, margin: "0", fontSize: "14px" }}>
                <strong>Response Time:</strong> Within 24 hours
              </p>
            </div>

            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=WraPTrack Support Request`}
              style={{
                background: COLORS.info,
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "12px 28px",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "14px",
                transition: "all 0.2s ease",
                display: "inline-block",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <i className="bi bi-envelope me-2" /> Contact Support
            </a>
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
              Explore other help resources
            </p>
            <div className="d-flex flex-wrap justify-content-center gap-2">
              <NavLink to="/info/penalties" className="text-decoration-none">
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
                  <i className="bi bi-exclamation-triangle me-2" /> Penalties
                </button>
              </NavLink>

              <NavLink to="/info/privacy" className="text-decoration-none">
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
                  onMouseEnter={(e) => (e.currentTarget.style.background = `${COLORS.primary}10`)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <i className="bi bi-shield-lock me-2" /> Privacy
                </button>
              </NavLink>

              <NavLink to="/info/terms" className="text-decoration-none">
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
                  onMouseEnter={(e) => (e.currentTarget.style.background = `${COLORS.primary}10`)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <i className="bi bi-file-text me-2" /> Terms
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
                  onMouseEnter={(e) => (e.currentTarget.style.background = `${COLORS.primary}10`)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <i className="bi bi-house-door me-2" /> Help Hub
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
            © 2025 — FAQ
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

export default FAQ;
