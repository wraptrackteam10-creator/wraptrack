import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import bgImage from "../../images/landing-bg.png";
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

  const otpRef = useRef(null);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      // cleanup any pending toast timer
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = (msg, autoHide = true) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    if (autoHide) {
      toastTimerRef.current = setTimeout(() => setToast(""), 4500);
    }
  };

  const isValidPassword = (pw) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(pw);

  const getPasswordStrength = (pw) => {
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 2) return { label: "Weak", width: "20%", color: "#e74c3c" };
    if (score <= 4) return { label: "Medium", width: "50%", color: "#f39c12" };
    if (score === 5) return { label: "Strong", width: "80%", color: "#27ae60" };
    return { label: "Very Strong", width: "100%", color: "#145A32" };
  };

  const strength = getPasswordStrength(newPassword);

  // Request OTP step
  const requestOtp = async (e) => {
    e.preventDefault();
    const trimmed = (username || "").trim();
    if (!trimmed) return showToast("Enter your ID number");

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/forgot/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmed }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showToast(data.errorMessage || `Failed to send OTP (${res.status})`);
      } else {
        // server may return masked email; fallback to anonymized value
        const masked = data?.emailMasked || maskEmailFrom(data?.email) || "your registered email";
        setEmailMasked(masked);
        setStep(2);
        showToast("OTP sent to your registered email");
        // focus OTP input
        setTimeout(() => otpRef.current?.focus(), 120);
      }
    } catch (err) {
      console.error("requestOtp error:", err);
      showToast("Server error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Reset password step
  const resetPassword = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) return showToast("Enter the 6-digit OTP");
    if (!newPassword) return showToast("Enter new password");
    if (!isValidPassword(newPassword)) return showToast("Password must be 8+ chars with upper, lower, number and symbol");
    if (newPassword !== confirm) return showToast("Passwords do not match");

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/forgot/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), otp, newPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showToast(data.errorMessage || `Failed to reset password (${res.status})`);
      } else {
        showToast("Password updated. Redirecting to login...", true);
        setTimeout(() => navigate("/"), 1200);
      }
    } catch (err) {
      console.error("resetPassword error:", err);
      showToast("Server error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  // small helper to mask an email if server didn't provide masked version
  function maskEmailFrom(email) {
    if (!email || typeof email !== "string") return null;
    const [local, domain] = email.split("@");
    if (!local || !domain) return "****@****";
    const visible = local.length <= 2 ? local : `${local[0]}***${local.slice(-1)}`;
    return `${visible}@${domain}`;
  }

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      <div className="card p-4 shadow" style={{ width: 420, background: "#FFFFFF", border: "1px solid #D4C9BE" }}>
        <h4 className="mb-3" style={{ color: "#030303" }}>Forgot Password</h4>

        {step === 1 && (
          <form onSubmit={requestOtp}>
            <div className="mb-3">
              <label className="form-label" style={{ color: "#030303" }}>Login ID</label>
              <input
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder=""
                style={{ borderColor: "#D4C9BE", color: "#030303" }}
                required
                autoComplete="username"
              />
            </div>

            <button
              className="btn w-100 mb-2"
              type="submit"
              disabled={loading}
              style={{ backgroundColor: "#123458", color: "#F1EFEC", border: "1px solid #123458" }}
            >
              {loading ? <><span className="spinner-border spinner-border-sm me-2" />Send OTP</> : "Send OTP"}
            </button>

            <button
              type="button"
              className="btn w-100"
              onClick={() => navigate("/sign-in")}
              style={{ backgroundColor: "#FFFFFF", color: "#123458", border: "1px solid #D4C9BE" }}
            >
              Back to Login
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={resetPassword}>
            <small className="d-block mb-2" style={{ color: "#D4C9BE" }}>
              OTP sent to: <b style={{ color: "#030303" }}>{emailMasked}</b>
            </small>

            <div className="mb-3">
              <label className="form-label" style={{ color: "#030303" }}>OTP Code</label>
              <input
                ref={otpRef}
                className="form-control"
                value={otp}
                onChange={(e) => {
                  // numeric only, max 6
                  const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setOtp(val);
                }}
                placeholder="6-digit code"
                inputMode="numeric"
                style={{ borderColor: "#D4C9BE", color: "#030303" }}
                required
              />
            </div>

            <div className="mb-3 position-relative">
              <label className="form-label" style={{ color: "#030303" }}>New Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showNewPassword ? "text" : "password"}
                  className="form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ paddingRight: 40, borderColor: "#D4C9BE", color: "#030303" }}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(s => !s)}
                  aria-pressed={showNewPassword}
                  style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", border: "none", background: "transparent", color: "#123458", cursor: "pointer" }}
                >
                  <i className={`bi ${showNewPassword ? "bi-eye" : "bi-eye-slash"}`} />
                </button>
              </div>

              {newPassword && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 7, width: "100%", background: "#F1EFEC", borderRadius: 4, border: "1px solid #E7E2DD" }}>
                    <div style={{ height: "100%", width: strength.width, backgroundColor: strength.color, borderRadius: 4 }} />
                  </div>
                  <small style={{ color: strength.color, fontWeight: 600 }}>{strength.label}</small>
                </div>
              )}
            </div>

            <div className="mb-3 position-relative">
              <label className="form-label" style={{ color: "#030303" }}>Confirm Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="form-control"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  style={{ paddingRight: 40, borderColor: "#D4C9BE", color: "#030303" }}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(s => !s)}
                  aria-pressed={showConfirmPassword}
                  style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", border: "none", background: "transparent", color: "#123458", cursor: "pointer" }}
                >
                  <i className={`bi ${showConfirmPassword ? "bi-eye" : "bi-eye-slash"}`} />
                </button>
              </div>
            </div>

            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn w-50"
                onClick={() => setStep(1)}
                style={{ backgroundColor: "#FFFFFF", color: "#123458", border: "1px solid #D4C9BE" }}
                disabled={loading}
              >
                Back
              </button>

              <button
                className="btn w-50"
                type="submit"
                style={{ backgroundColor: "#123458", color: "#F1EFEC", border: "1px solid #123458" }}
                disabled={loading}
              >
                {loading ? <><span className="spinner-border spinner-border-sm me-2" />Reset Password</> : "Reset Password"}
              </button>
            </div>
          </form>
        )}

        {toast && (
          <div className="toast show mt-3" role="status" aria-live="polite" style={{ border: "1px solid #D4C9BE", background: "#FFFFFF" }}>
            <div className="toast-body">{toast}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;