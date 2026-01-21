import logo from "../../images/wtlogo-removebg.png";
import institutes from "../../data/institutes";
import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import bgImage from "../../images/landing-bg.png";

function Signup() {
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  // Form state
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Student");
  const [institute, setInstitute] = useState("");
  const [program, setProgram] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // toggles both password fields

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
  const confirmPasswordRef = useRef(null);
  const emailRef = useRef(null);
  const instituteRef = useRef(null);
  const programRef = useRef(null);

  const selectedInstitute = institutes.find(i => i.code === institute);

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

    if (score <= 2) return { label: "Weak", color: "#e74c3c", width: "20%" };
    if (score <= 4) return { label: "Medium", color: "#f39c12", width: "50%" };
    if (score === 5) return { label: "Strong", color: "#27ae60", width: "80%" };
    return { label: "Very Strong", color: "#145A32", width: "100%" };
  };

  const passwordStrength = getPasswordStrength(password);

  // -----------------------------
  // Handle signup submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);

    // Only enforce student username format for Students; faculty can have any username
    if ((role === "Student" && !isValidUsername(username))
      || !isValidEmail(email)
      || !isValidPassword(password)
      || !institute
      || !program) {
      showToastMessage("❌ Invalid input! Please check required fields.");
      return;
    }

    // Confirm password match
    if (password !== confirmPassword) {
      showToastMessage("❌ Passwords do not match.");
      confirmPasswordRef.current?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstname,
          lastname,
          username,
          password,
          email,
          type: role.toLowerCase(),
          institute,
          program,
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
  }, [otpModalVisible, otp]);

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

        // Reset everything (include new fields)
        setFirstname("");
        setLastname("");
        setUsername("");
        setPassword("");
        setConfirmPassword("");
        setEmail("");
        setRole("Student");
        setInstitute("");
        setProgram("");
        setOtp(["", "", "", "", "", ""]);
        setIsOtpSent(false);
        setSubmitted(false);
        setIsSubmitting(false);

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
      className="signup-page"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      <div className="card signup-card shadow-lg border-0 p-4 rounded-3" style={{ width: "100%", maxWidth: "640px", margin: "0 auto", marginTop: "50px" }}>
        <form onSubmit={handleSubmit}>
          <div className="mb-4 text-center">
            <img src={logo} alt="logo" style={{ width: "100px" }} />
            <h3 className="fw-bold app-title mt-2" style={{ color: "#030303" }}>WraPTrack</h3>
          </div>

          <div className="row">
            <div className="col-md-6">
              <div className="mb-3" ref={dropdownRef} style={{ position: "relative" }}>
                <div
                  className="form-control shadow-sm d-flex justify-content-between align-items-center role-select"
                  onClick={() => setShowDropdown(!showDropdown)}
                  style={{ cursor: "pointer" }}
                >
                  <span style={{ color: "#030303" }}>{role}</span>
                  <span style={{ transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)", color: "#D4C9BE" }}>▼</span>
                </div>
                {showDropdown && (
                  <div className="shadow-sm border rounded position-absolute w-100 bg-white" style={{ zIndex: 10 }}>
                    {["Student", "Faculty"].map(r => (
                      <div key={r} className="p-2 hover-bg" onClick={() => { setRole(r); setShowDropdown(false); }} style={{ cursor: "pointer", color: "#030303" }}>{r}</div>
                    ))}
                  </div>
                )}
              </div>

              <input
                ref={firstnameRef}
                type="text"
                placeholder="Firstname"
                className="form-control mb-3"
                value={firstname}
                required
                onFocus={() => handleFocus(firstnameRef)}
                onChange={e => setFirstname(e.target.value)}
              />
              <input
                ref={lastnameRef}
                type="text"
                placeholder="Lastname"
                className="form-control mb-3"
                value={lastname}
                required
                onFocus={() => handleFocus(lastnameRef)}
                onChange={e => setLastname(e.target.value)}
              />

              {/* Institute and Program inputs */}
              <select
                ref={instituteRef}
                className="form-control mb-3"
                value={institute}
                required
                onChange={(e) => {
                  setInstitute(e.target.value);
                  setProgram(""); // reset program when institute changes
                }}
              >
                <option value="">Select Institute / Faculty</option>
                {institutes.map(inst => (
                  <option key={inst.code} value={inst.code}>
                    {inst.code} - {inst.name}
                  </option>
                ))}
              </select>

              <select
                ref={programRef}
                className="form-control mb-3"
                value={program}
                required
                disabled={!institute}
                onChange={(e) => setProgram(e.target.value)}
              >
                <option value="">
                  {institute ? "Select Program" : "Select Institute first"}
                </option>

                {selectedInstitute?.programs.map(prog => (
                  <option key={prog.code} value={prog.code}>
                    {prog.code} - {prog.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <input
                ref={usernameRef}
                type="text"
                placeholder={role === "Student" ? "Student ID (0000-0000)" : "Username"}
                className="form-control mb-3"
                value={username}
                required
                onFocus={() => handleFocus(usernameRef)}
                onChange={e => setUsername(e.target.value)}
              />
              {submitted && role === "Student" && !isValidUsername(username) && <small className="text-danger">*Format must be 0000-0000</small>}

              {/* Password */}
              <div className="mb-3 position-relative">
                <input
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="form-control"
                  value={password}
                  required
                  onFocus={() => handleFocus(passwordRef)}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide passwords" : "Show passwords"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                  title={showPassword ? "Hide passwords" : "Show passwords"}
                >
                  <i className={`bi ${showPassword ? "bi-eye" : "bi-eye-slash"}`}></i>
                </button>
              </div>

              {/* Confirm Password */}
              <div className="mb-3 position-relative">
                <input
                  ref={confirmPasswordRef}
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  className="form-control"
                  value={confirmPassword}
                  required
                  onFocus={() => handleFocus(confirmPasswordRef)}
                  onChange={e => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide passwords" : "Show passwords"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                  title={showPassword ? "Hide passwords" : "Show passwords"}
                >
                  <i className={`bi ${showPassword ? "bi-eye" : "bi-eye-slash"}`}></i>
                </button>
              </div>

              {password && (
                <div className="mb-3">
                  <div className="pw-strength-track">
                    <div className="pw-strength-bar" style={{ width: passwordStrength.width, backgroundColor: passwordStrength.color }} />
                  </div>
                  <small className="pw-strength-label" style={{ color: passwordStrength.color }}>{passwordStrength.label}</small>
                </div>
              )}
              {submitted && !isValidPassword(password) && <small className="text-danger mb-2 d-block">*Password must contain 8 characters, uppercase, lowercase, number, and symbol</small>}

              {submitted && password !== confirmPassword && <small className="text-danger mb-2 d-block">*Passwords do not match</small>}

              <input
                ref={emailRef}
                type="email"
                placeholder="Email Address"
                className="form-control mb-3"
                value={email}
                required
                onFocus={() => handleFocus(emailRef)}
                onChange={e => setEmail(e.target.value)}
              />
              {submitted && !isValidEmail(email) && <small className="text-danger">*Enter a valid email</small>}
            </div>
          </div>

          <button
            type="submit"
            className="btn primary-action w-100 mt-3"
            disabled={isSubmitting || isOtpSent}
            style={{ backgroundColor: "#123458", borderColor: "#123458", color: "#F1EFEC" }}
          >
            {isSubmitting ? "Sending OTP..." : "Submit"}
          </button>
        </form>

        <div className="text-center mt-3">
          <small style={{ color: "#030303" }}>
            Already have an account? <NavLink to="/sign-in" className="text-decoration-none" style={{ color: "#123458" }}>Login</NavLink>
          </small>
        </div>
      </div>

      {/* OTP Modal */}
      {otpModalVisible && (
        <div className="otp-modal-overlay">
          <div className="otp-modal-box">
            <button className="otp-close-btn" onClick={handleCloseOtpModal}>&times;</button>
            <h5 className="text-center mb-3" style={{ color: "#030303" }}>Enter OTP</h5>
            <p style={{ fontSize: "0.9rem", color: "#D4C9BE" }}>An OTP was sent to your email. Enter it below.</p>
            <div className="d-flex justify-content-between mb-3">
              {otp.map((num, index) => (
                <input key={index} type="text" maxLength={1} className="otp-box"
                  value={num} onChange={e => handleOtpChange(index, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(index, e)} onPaste={handleOtpPaste}
                  ref={el => otpRefs.current[index] = el} />
              ))}
            </div>
            <button className="btn primary-action w-100" onClick={handleVerifyOtp} style={{ backgroundColor: "#123458", borderColor: "#123458", color: "#F1EFEC" }}>Verify OTP</button>
            <button className="btn btn-outline-primary w-100 mt-2" onClick={handleResendOtp} disabled={resendCooldown > 0} style={{ borderColor: "#123458", color: "#123458" }}>
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
            <p style={{ color: "#030303" }}>{alertMessage}</p>
            <div className="d-flex justify-content-end gap-2 mt-3">
              <button className="btn btn-secondary" onClick={handleAlertCancel}>Cancel</button>
              <button className="btn btn-danger" onClick={handleAlertConfirm}>Yes</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* Palette and global rules applied to this page/component */
        .signup-page { background: #F1EFEC; }

        .signup-card {
          background: #FFFFFF; /* Cards / tables */
          border: 1px solid #D4C9BE; /* Card borders */
        }

        .app-title { color: #030303; } /* Primary text */

        /* Inputs */
        .form-control {
          border: 1px solid #D4C9BE;
          color: #030303;
          background: #FFFFFF;
        }
        .form-control::placeholder { color: #D4C9BE; } /* Muted placeholder text */

        /* Role select appearance */
        .role-select { background: #FFFFFF; border: 1px solid #D4C9BE; color: #030303; }

        /* Password toggle button */
        .password-toggle {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: #555;
          cursor: pointer;
        }
        .password-toggle:focus { outline: none; }

        /* Password strength */
        .pw-strength-track {
          height: 7px;
          width: 100%;
          background: #F1EFEC;
          border-radius: 5px;
          border: 1px solid #E7E2DD;
        }
        .pw-strength-bar {
          height: 100%;
          border-radius: 5px;
        }
        .pw-strength-label { font-weight: 600; }

        /* Primary action (Verify / Submit) - ensure high contrast */
        .primary-action {
          background: #123458;
          border-color: #123458;
          color: #F1EFEC;
        }

        /* Outline primary (edit) */
        .btn-outline-primary {
          border: 1px solid #123458;
          color: #123458;
          background: transparent;
        }

        /* OTP / alert modal */
        .otp-modal-overlay, .alert-modal-overlay {
          position: fixed; top: 0; left: 0;
          width: 100%; height: 100%;
          background: rgba(0,0,0,0.5);
          display: flex; justify-content: center; align-items: center; z-index: 1050;
        }
        .otp-modal-box, .alert-modal-box {
          background: #FFFFFF; padding: 30px; border-radius: 12px;
          width: 380px; max-width: 94%; box-shadow: 0 5px 20px rgba(0,0,0,0.12);
          text-align: center; position: relative; border: 1px solid #D4C9BE;
        }
        .otp-close-btn {
          position: absolute; top: 10px; right: 10px; font-size: 1.5rem; border: none; background: transparent; cursor: pointer; color: #030303;
        }
        .otp-box {
          width: 44px; height: 52px; text-align: center; font-size: 1.3rem;
          border: 1px solid #D4C9BE; border-radius: 8px; color: #030303; background: #FFFFFF;
        }

        /* hover and small helpers */
        .hover-bg:hover { background-color: #F8F7F5; }
        .text-danger { color: #F08080 !important; } /* Unclaimed / error color */
      `}</style>
    </div>
  );
}

export default Signup;