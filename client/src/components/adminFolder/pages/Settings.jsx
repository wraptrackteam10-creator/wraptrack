import React, { useEffect, useState } from "react";
import { fetchWithAuth } from "../../../utils/fetchWithAuth";

function Settings() {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // Load settings from backend
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE_URL}/api/settings`, {
          credentials: "include",
        });
        const data = await res.json();
        setSettings(data);
      } catch (err) {
        showToast("Failed to load settings", "danger");
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [API_BASE_URL]);

  // Toggle boolean settings
  const handleToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Change other values
  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Toast helper
  const showToast = (message, type = "success", duration = 3000) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), duration);
  };

  // Save settings
  const saveSettings = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
      });

      if (res.ok) showToast("✅ Settings saved successfully!", "success");
      else showToast("❌ Failed to save settings", "danger");
    } catch (err) {
      showToast("❌ Failed to save settings", "danger");
    }
  };

  if (loading) return <p className="text-center mt-4 text-muted">Loading settings...</p>;

  return (
    <div
      className="container-fluid py-4"
      style={{ minHeight: "80vh", color: "#030303" }}
    >
      {/* Page Header */}
      <h4
        className="fw mb-4"
        style={{ color: "#123458" }}
      >
        ⚙️ System Settings & Preferences
      </h4>

      <div className="row g-4">
        {/* Security Section */}
        <div className="col-lg-6 col-sm-12">
          <div
            className="card shadow-sm rounded h-100"
            style={{ backgroundColor: "#FFFFFF", border: "1px solid #D4C9BE" }}
          >
            <div
              className="card-header border-0"
              style={{ backgroundColor: "#123458", color: "#F1EFEC" }}
            >
              <h5 className="fw-semibold mb-0">🔒 Security & Access Control</h5>
            </div>
            <div className="card-body">
              {["guardAccess", "studentAccess", "loginRestriction"].map((key, idx) => {
                const labels = {
                  guardAccess: "Guard – View / Verify",
                  studentAccess: "Student – Deposit / Claim",
                  loginRestriction: "Login Restriction"
                };
                return (
                  <div key={idx} className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={settings[key]}
                      onChange={() => handleToggle(key)}
                    />
                    <label className="form-check-label">{labels[key]}</label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* System Settings Panel */}
        <div className="col-lg-6 col-sm-12">
          <div
            className="card shadow-sm rounded h-100"
            style={{ backgroundColor: "#FFFFFF", border: "1px solid #D4C9BE" }}
          >
            <div
              className="card-header border-0"
              style={{ backgroundColor: "#90EE90", color: "#030303" }}
            >
              <h5 className="fw-semibold mb-0">🧩 System Settings Panel</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label fw-semibold">Campus Gate</label>
                <select
                  className="form-select"
                  value={settings.campusGate}
                  onChange={(e) => handleChange("campusGate", e.target.value)}
                  style={{ borderColor: "#D4C9BE" }}
                >
                  <option>Main Campus</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Operating Hours</label>
                <select
                  className="form-select"
                  value={settings.operatingHours}
                  onChange={(e) => handleChange("operatingHours", e.target.value)}
                  style={{ borderColor: "#D4C9BE" }}
                >
                  <option>6:00 AM – 8:00 PM</option>
                  <option>7:00 AM – 9:00 PM</option>
                  <option>24 Hours</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Auto-Archive Logs</label>
                <select
                  className="form-select"
                  value={settings.autoArchiveDays}
                  onChange={(e) => handleChange("autoArchiveDays", Number(e.target.value))}
                  style={{ borderColor: "#D4C9BE" }}
                >
                  <option value={30}>30 Days</option>
                  <option value={60}>60 Days</option>
                  <option value={90}>90 Days</option>
                </select>
              </div>

              <div className="form-check form-switch mt-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={settings.remindersEnable}
                  onChange={() => handleToggle("remindersEnable")}
                />
                <label className="form-check-label">Reminders Enabled</label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="text-center mt-4">
        <button
          onClick={saveSettings}
          className="btn fw-semibold"
          style={{
            backgroundColor: "#123458",
            color: "#F1EFEC",
            padding: "0.5rem 2rem",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          }}
        >
          💾 Save Settings
        </button>
      </div>

      {/* TOAST */}
      {toast.show && (
        <div
          className={`position-fixed bottom-0 end-0 m-3 p-3 rounded shadow`}
          style={{
            zIndex: 2000,
            minWidth: "250px",
            backgroundColor: toast.type === "success" ? "#90EE90" : "#F08080",
            color: "#030303",
            border: "1px solid #D4C9BE",
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default Settings;
