import logo from "../../images/wtlogo-removebg.png";
import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  // Form state
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Student");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OTP state
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Toast
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  // Custom alert
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertCallback, setAlertCallback] = useState(null);

  // Refs
  const otpRefs = useRef([]);
  const scrollContainerRef = useRef(null);
  const dropdownRef = useRef(null);
  const firstnameRef = useRef(null);
  const lastnameRef = useRef(null);
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const emailRef = useRef(null);

  // -----------------------------
  // Toast helpers
  const showToastMessage = (msg, autoHide = false) => {
    setToastMessage(msg);
    setShowToast(true);
    if (autoHide) setTimeout(() => setShowToast(false), 2500);
  };
  const hideToast = () => setShowToast(false);

  // -----------------------------
  // Custom alert helpers
  const showCustomAlert = (message, callback) => {
    setAlertMessage(message);
    setAlertCallback(() => callback);
    setAlertVisible(true);
  };

  const handleAlertConfirm = () => {
    if (alertCallback) alertCallback();
    setAlertVisible(false);
  };

  const handleAlertCancel = () => setAlertVisible(false);

  // Click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target))
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll to input
  const handleFocus = (inputRef) => {
    setTimeout(() => inputRef.current.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
  };

  // Validation functions
  const isValidUsername = (u) => /^\d{4}-\d{4}$/.test(u);
  const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
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

    if (score <= 2) return { label: "Weak", color: "red", width: "20%" };
    if (score <= 4) return { label: "Medium", color: "orange", width: "50%" };
    if (score === 5) return { label: "Strong", color: "green", width: "80%" };
    return { label: "Very Strong", color: "darkgreen", width: "100%" };
  };

  const passwordStrength = getPasswordStrength(password);

  // -----------------------------
  // Handle signup submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);

    if (!isValidUsername(username) || !isValidEmail(email) || !isValidPassword(password)) {
      showToastMessage("❌ Invalid input!");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstname, lastname, username, password, email, type: role.toLowerCase(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Reuse existing OTP/session if email matches
        if (sessionStorage.getItem("pendingOtpEmail") === email) {
          showToastMessage("✉️ OTP already sent. Please verify.", true);
          setOtpModalVisible(true);
          setIsOtpSent(true);
        } else {
          setIsOtpSent(true);
          setOtpModalVisible(true);
          // keep storing expiry on client (server still enforces expiry) - but we no longer show a countdown
          const expiry = Date.now() + 10 * 60 * 1000;
          sessionStorage.setItem("pendingOtpEmail", email);
          sessionStorage.setItem("otpExpiry", expiry);
          showToastMessage("✉️ OTP sent to your email. Please verify.", true);
        }
      } else {
        showToastMessage(data.errorMessage || "❌ Signup failed!");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Signup error:", error);
      showToastMessage("❌ Server error. Please try again later.");
      setIsSubmitting(false);
    }
  };

  // -----------------------------
  // Re-open OTP modal on refresh if there's a pending signup (no countdown)
  useEffect(() => {
    const pendingEmail = sessionStorage.getItem("pendingOtpEmail");
    if (pendingEmail) {
      setEmail(pendingEmail);
      setOtpModalVisible(true);
      setIsOtpSent(true);
    }
  }, []);

  // Auto-focus first empty OTP box when modal opens
  useEffect(() => {
    if (otpModalVisible) {
      const firstEmptyIndex = otp.findIndex(n => !n);
      if (firstEmptyIndex !== -1) {
        otpRefs.current[firstEmptyIndex]?.focus();
      }
    }
  }, [otpModalVisible]);

  // -----------------------------
  // OTP handlers
  const handleOtpChange = (index, value) => {
    if (/^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value.slice(-1);
      setOtp(newOtp);
      if (!newOtp[index] && index > 0) otpRefs.current[index - 1].focus();
      else if (newOtp[index] && index < otp.length - 1) otpRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("Text").trim();
    if (/^\d{6}$/.test(pasteData)) {
      setOtp(pasteData.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      showToastMessage("❌ Enter complete 6-digit OTP!");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpCode }),
      });

      const data = await res.json();

      if (res.ok) {
        showToastMessage("✅ Account created successfully.", true);
        setOtpModalVisible(false);
        sessionStorage.removeItem("pendingOtpEmail");
        sessionStorage.removeItem("otpExpiry");

        // Reset everything
        setFirstname(""); setLastname(""); setUsername(""); setPassword(""); setEmail("");
        setRole("Student"); setOtp(["", "", "", "", "", ""]);
        setIsOtpSent(false); setSubmitted(false); setIsSubmitting(false);

        setTimeout(() => navigate("/"), 2000);
      } else {
        showToastMessage(data.errorMessage || "❌ Invalid OTP!");
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      showToastMessage("❌ Server error. Try again later.");
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        // keep storing expiry on client (server still enforces expiry); no client countdown shown
        const expiry = Date.now() + 10 * 60 * 1000;
        sessionStorage.setItem("otpExpiry", expiry);

        showToastMessage("✉️ OTP resent to your email.", true);

        // start resend cooldown (30s)
        setResendCooldown(30);
        const interval = setInterval(() => {
          setResendCooldown(prev => {
            if (prev <= 1) { clearInterval(interval); return 0; }
            return prev - 1;
          });
        }, 1000);
      } else {
        showToastMessage(data.errorMessage || "❌ Could not resend OTP!");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      showToastMessage("❌ Server error. Try again later.");
    }
  };

  const handleCloseOtpModal = () => {
    showCustomAlert("Do you want to cancel the signup?", () => {
      setOtpModalVisible(false);
      setOtp(["", "", "", "", "", ""]);
      setIsOtpSent(false);
      setIsSubmitting(false);
      sessionStorage.removeItem("pendingOtpEmail");
      sessionStorage.removeItem("otpExpiry");
      showToastMessage("⚠️ OTP verification canceled. You can submit the form again.", true);
    });
  };

  return (
    <div
      ref={scrollContainerRef}
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "100vh", padding: "20px", backgroundColor: "#f8f9fa", overflowY: "auto" }}
    >
      <div className="card shadow-lg border-0 p-4 rounded-3" style={{ width: "100%", maxWidth: "600px" }}>
        <form onSubmit={handleSubmit}>
          <div className="mb-4 text-center">
            <img src={logo} alt="logo" style={{ width: "100px" }} />
            <h3 className="fw-bold text-secondary mt-2">WraPTrack</h3>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <div className="mb-3" ref={dropdownRef} style={{ position: "relative" }}>
                <div className="form-control shadow-sm d-flex justify-content-between align-items-center"
                     onClick={() => setShowDropdown(!showDropdown)} style={{ cursor: "pointer" }}>
                  {role} <span style={{ transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
                </div>
                {showDropdown && (
                  <div className="shadow-sm border rounded position-absolute w-100 bg-white" style={{ zIndex: 10 }}>
                    {["Student", "Faculty", "Guard"].map(r => (
                      <div key={r} className="p-2 hover-bg" onClick={() => { setRole(r); setShowDropdown(false); }} style={{ cursor: "pointer" }}>{r}</div>
                    ))}
                  </div>
                )}
              </div>

              <input ref={firstnameRef} type="text" placeholder="Firstname" className="form-control mb-3" value={firstname} required
                     onFocus={() => handleFocus(firstnameRef)} onChange={e => setFirstname(e.target.value)} />
              <input ref={lastnameRef} type="text" placeholder="Lastname" className="form-control mb-3" value={lastname} required
                     onFocus={() => handleFocus(lastnameRef)} onChange={e => setLastname(e.target.value)} />
            </div>

            <div className="col-md-6">
              <input ref={usernameRef} type="text" placeholder="Student/Faculty ID (0000-0000)" className="form-control mb-3" value={username} required
                     onFocus={() => handleFocus(usernameRef)} onChange={e => setUsername(e.target.value)} />
              {submitted && !isValidUsername(username) && <small className="text-danger">*Format must be 0000-0000</small>}

              <div className="mb-3" style={{ position: "relative" }}>
                <input ref={passwordRef} type={showPassword ? "text" : "password"} placeholder="Password" className="form-control"
                       value={password} required onFocus={() => handleFocus(passwordRef)} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
                <i className={`bi ${showPassword ? "bi-eye" : "bi-eye-slash"}`}
                   onClick={() => setShowPassword(!showPassword)}
                   style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", fontSize: "1.2rem", color: "#555" }}></i>
              </div>
              {password && <div className="mb-3"><div style={{ height: "7px", width: passwordStrength.width, backgroundColor: passwordStrength.color, borderRadius: "5px", transition: ".3s" }}></div>
                <small style={{ color: passwordStrength.color }}>{passwordStrength.label}</small></div>}
              {submitted && !isValidPassword(password) && <small className="text-danger mb-2 d-block">*Password must contain 8 characters, uppercase, lowercase, number, and symbol</small>}

              <input ref={emailRef} type="email" placeholder="Email Address" className="form-control mb-3" value={email} required
                     onFocus={() => handleFocus(emailRef)} onChange={e => setEmail(e.target.value)} />
              {submitted && !isValidEmail(email) && <small className="text-danger">*Enter a valid email</small>}
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-100 mt-3" disabled={isSubmitting || isOtpSent}>
            {isSubmitting ? "Sending OTP..." : "Submit"}
          </button>
        </form>

        <div className="text-center mt-3"><small>Already have an account? <NavLink to="/" className="text-decoration-none">Login</NavLink></small></div>
      </div>

      {/* OTP Modal */}
      {otpModalVisible && (
        <div className="otp-modal-overlay">
          <div className="otp-modal-box">
            <button className="otp-close-btn" onClick={handleCloseOtpModal}>&times;</button>
            <h5 className="text-center mb-3">Enter OTP</h5>
            {/* countdown removed - keep a simple note */}
            <p style={{ fontSize: "0.9rem", color: "#555" }}>An OTP was sent to your email. Enter it below.</p>
            <div className="d-flex justify-content-between mb-3">
              {otp.map((num, index) => (
                <input key={index} type="text" maxLength={1} className="otp-box"
                       value={num} onChange={e => handleOtpChange(index, e.target.value)}
                       onKeyDown={e => handleOtpKeyDown(index, e)} onPaste={handleOtpPaste}
                       ref={el => otpRefs.current[index] = el} />
              ))}
            </div>
            <button className="btn btn-success w-100" onClick={handleVerifyOtp}>Verify OTP</button>
            <button className="btn btn-outline-primary w-100 mt-2" onClick={handleResendOtp} disabled={resendCooldown > 0}>
              {resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : "Resend OTP"}
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div className="toast show position-fixed bottom-0 end-0 m-3" style={{ minWidth: "300px", zIndex: 9999 }}>
          <div className="toast-body d-flex justify-content-between">{toastMessage}<button className="btn-close" onClick={hideToast}></button></div>
        </div>
      )}

      {/* Custom Alert */}
      {alertVisible && (
        <div className="alert-modal-overlay">
          <div className="alert-modal-box">
            <p>{alertMessage}</p>
            <div className="d-flex justify-content-end gap-2 mt-3">
              <button className="btn btn-secondary" onClick={handleAlertCancel}>Cancel</button>
              <button className="btn btn-danger" onClick={handleAlertConfirm}>Yes</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .hover-bg:hover { background-color: #f1f1f1; }
        .otp-modal-overlay, .alert-modal-overlay {
          position: fixed; top:0; left:0;
          width: 100%; height: 100%;
          background: rgba(0,0,0,0.5);
          display: flex; justify-content: center; align-items: center; z-index: 1050;
        }
        .otp-modal-box, .alert-modal-box {
          background: #fff; padding: 30px; border-radius: 12px;
          width: 350px; max-width: 90%; box-shadow: 0 5px 20px rgba(0,0,0,0.3); text-align: center; position: relative;
        }
        .otp-close-btn {
          position: absolute; top: 10px; right: 10px; font-size: 1.5rem; border: none; background: transparent; cursor: pointer;
        }
        .otp-box { width: 40px; height: 50px; text-align: center; font-size: 1.5rem; border: 1px solid #ccc; border-radius: 8px; }
      `}</style>
    </div>
  );
}

export default Signup;
