import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";

function ForgotPassword() {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailMasked, setEmailMasked] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4500);
  };

  const getPasswordStrength = (pw) => {
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 2) return { label: "Weak", width: "20%", color: "red" };
    if (score <= 4) return { label: "Medium", width: "50%", color: "orange" };
    if (score === 5) return { label: "Strong", width: "80%", color: "green" };
    return { label: "Very Strong", width: "100%", color: "darkgreen" };
  };

  const strength = getPasswordStrength(newPassword);

  const requestOtp = async (e) => {
    e.preventDefault();
    if (!username) return showToast("Enter your ID number");

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/forgot/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();
      if (res.ok) {
        setEmailMasked(data.emailMasked);
        setStep(2);
        showToast("OTP sent to your registered email");
      } else {
        showToast(data.errorMessage || "Failed to send OTP");
      }
    } catch {
      showToast("Server error");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (!otp) return showToast("Enter the OTP");
    if (!newPassword) return showToast("Enter new password");
    if (newPassword !== confirm) return showToast("Passwords do not match");

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/forgot/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, otp, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Password updated. Please login.");
        setTimeout(() => navigate("/"), 1200);
      } else {
        showToast(data.errorMessage || "Failed to reset password");
      }
    } catch {
      showToast("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center"
         style={{ minHeight: "100vh", background: "#f8f9fa", padding: 20 }}>
      <div className="card p-4 shadow" style={{ width: 380 }}>
        <h4 className="mb-3">Forgot Password</h4>

        {step === 1 && (
          <form onSubmit={requestOtp}>
            <div className="mb-3">
              <label className="form-label">ID Number</label>
              <input
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <button className="btn btn-primary w-100 mb-2" disabled={loading}>
              Send OTP
            </button>
            <button
              type="button"
              className="btn btn-secondary w-100"
              onClick={() => navigate("/")}>
              Back to Login
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={resetPassword}>
            <small className="d-block mb-2">
              OTP sent to: <b>{emailMasked}</b>
            </small>

            <div className="mb-3">
              <label className="form-label">OTP Code</label>
              <input
                className="form-control"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>

            {/* New Password */}
            <div className="mb-3 position-relative">
              <label className="form-label">New Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showNewPassword ? "text" : "password"}
                  className="form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ paddingRight: "2.5rem" }}
                />
                <i
                  className={`bi ${showNewPassword ? "bi-eye" : "bi-eye-slash"}`}
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                    fontSize: "1.2rem",
                    color: "#555"
                  }}
                />
              </div>
              {newPassword && (
                <div style={{ marginTop: 6 }}>
                  <div style={{
                    height: 7,
                    width: strength.width,
                    backgroundColor: strength.color,
                    borderRadius: 4
                  }} />
                  <small style={{ color: strength.color }}>{strength.label}</small>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="mb-3 position-relative">
              <label className="form-label">Confirm Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="form-control"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  style={{ paddingRight: "2.5rem" }}
                />
                <i
                  className={`bi ${showConfirmPassword ? "bi-eye" : "bi-eye-slash"}`}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                    fontSize: "1.2rem",
                    color: "#555"
                  }}
                />
              </div>
            </div>

            <div className="d-flex gap-2">
              <button type="button" className="btn btn-secondary w-50"
                      onClick={() => navigate("/")}>
                Back
              </button>
              <button className="btn btn-primary w-50" disabled={loading}>
                Reset Password
              </button>
            </div>
          </form>
        )}

        {toast && (
          <div className="toast show mt-3">
            <div className="toast-body">{toast}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
