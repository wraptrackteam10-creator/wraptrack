import { useNavigate, NavLink } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import logo from "../../images/wtlogofinal.png";
import bgImage from "../../images/landing-bg.png";

function Login() {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const navigate = useNavigate();
  const usernameRef = useRef(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Guest modal state
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [guestFirst, setGuestFirst] = useState("");
  const [guestLast, setGuestLast] = useState("");
  const guestFirstRef = useRef(null);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      // capture beforeinstallprompt for PWA install
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const showToastMessage = (message, autoHide = true) => {
    setToastMessage(message);
    setShowToast(true);
    if (autoHide) {
      setTimeout(() => setShowToast(false), 3500);
    }
  };

  const hideToast = () => setShowToast(false);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    // const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    // optional: react to user's choice
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      showToastMessage("Please enter username and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // 🔥 REQUIRED
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message = data?.errorMessage || data?.message || `Login failed (${res.status})`;
        showToastMessage(message);
        setPassword("");
        setIsSubmitting(false);
        return;
      }

      const user = data?.user || null;
      const role = (data?.type || user?.role || "").toLowerCase();

      if (!user) {
        showToastMessage("Login succeeded but user data missing.");
        setIsSubmitting(false);
        return;
      }

      const stored = {
        id: user.id || user._id || null,
        firstname: user.firstname || user.firstName || "",
        lastname: user.lastname || user.lastName || "",
        role: role || "user",
      };

      localStorage.setItem("user", JSON.stringify(stored));

      if (role === "admin") navigate("/admin");
      else if (["student", "visitor", "faculty"].includes(role)) navigate("/user");
      else if (role === "guard") navigate("/guard");
      else navigate("/user");
    } catch (error) {
      console.error("Login error:", error);
      showToastMessage("Server error. Try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open guest modal (instead of immediate guest creation)
  const openGuestModal = () => {
    // Pre-fill with last-guest if present
    const prevGuest = JSON.parse(localStorage.getItem("guest_user") || "null");
    if (prevGuest) {
      setGuestFirst(prevGuest.firstname || "");
      setGuestLast(prevGuest.lastname || "");
    } else {
      setGuestFirst("");
      setGuestLast("");
    }
    setGuestModalOpen(true);
    // focus first input after render
    setTimeout(() => guestFirstRef.current?.focus(), 50);
  };

  const handleGuestSubmit = async () => {
    const first = (guestFirst || "").trim();
    const last = (guestLast || "").trim();
    if (!first) { showToastMessage("Please enter first name for guest."); guestFirstRef.current?.focus(); return; }

    try {
      // Try create server-side guest session
      const res = await fetch(`${API_BASE_URL}/api/guest`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstname: first, lastname: last }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.user) {
        localStorage.setItem("user", JSON.stringify({
          id: data.user.id,
          firstname: data.user.firstname,
          lastname: data.user.lastname,
          role: data.user.role || "visitor",
        }));
        setGuestModalOpen(false);
        showToastMessage("Continuing as guest", true);
        navigate("/user");
        return;
      }

      // fallback: client-only guest
      throw new Error(data?.errorMessage || "Server guest creation failed");
    } catch (err) {
      // Fallback to purely local guest (inform user)
      const guest = {
        id: `guest_${Date.now()}`,
        firstname: first,
        lastname: last,
        role: "visitor",
        guestLocalOnly: true,
      };
      localStorage.setItem("user", JSON.stringify(guest));
      localStorage.setItem("guest_user", JSON.stringify({ firstname: first, lastname: last }));
      setGuestModalOpen(false);
      showToastMessage("Continuing as local guest (limited). Sign in for full access.", true);
      navigate("/user");
    }
  };

  const handleGuestCancel = () => {
    setGuestModalOpen(false);
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      <div
        className="card p-4 rounded-3"
        style={{
          width: "360px",
          backgroundColor: "#FFFFFF",
          border: "1px solid #D4C9BE",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        }}
      >
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className="text-center w-100">
            <img src={logo} alt="Logo" style={{ width: "90px" }} />
            <h3
              style={{
                color: "#123458",
                fontWeight: 700,
                marginTop: "0.5rem",
                marginBottom: 0,
              }}
            >
              WraPTrack
            </h3>
            <small style={{ color: "#D4C9BE" }}>Secure Access Portal</small>
          </div>
        </div>

        <form onSubmit={handleLogin} aria-describedby="login-help">
          <div className="mb-3 text-start">
            <label htmlFor="loginid" className="form-label" style={{ color: "#030303" }}>
              Login ID
            </label>
            <input
              id="loginid"
              ref={usernameRef}
              type="text"
              value={username}
              className="form-control"
              placeholder="Enter login ID"
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ borderColor: "#D4C9BE", color: "#030303" }}
              autoComplete="username"
            />
          </div>

          <div className="mb-3 text-start" style={{ position: "relative" }}>
            <label htmlFor="password" className="form-label" style={{ color: "#030303" }}>
              Password
            </label>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              className="form-control"
              placeholder="Enter password"
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ borderColor: "#D4C9BE" }}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-pressed={showPassword}
              aria-label={showPassword ? "Hide password" : "Show password"}
              style={{
                position: "absolute",
                right: "12px",
                top: "72%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#D4C9BE",
                fontSize: "1.1rem",
                padding: 0,
              }}
            >
              <i className={`bi ${showPassword ? "bi-eye" : "bi-eye-slash"}`} />
            </button>
          </div>

          <button
            type="submit"
            className="btn w-100 py-2 fw-bold mb-2"
            style={{
              backgroundColor: "#123458",
              color: "#F1EFEC",
              border: "none",
            }}
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                Signing in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>

        <div className="d-flex justify-content-between align-items-center mt-2">
          <NavLink
            to="/forgot-password"
            style={{
              color: "#123458",
              textDecoration: "none",
              fontSize: "0.9rem",
            }}
          >
            Forgot Password?
          </NavLink>

          <button
            type="button"
            onClick={openGuestModal}
            className="btn btn-link"
            style={{ color: "#123458", textDecoration: "none" }}
            title="Continue as guest"
          >
            Continue as Guest
          </button>
        </div>

        <div className="text-center mt-3">
          <small style={{ color: "#030303" }}>
            Don’t have an account?{" "}
            <NavLink
              to="/sign-up"
              style={{
                color: "#123458",
                textDecoration: "none",
              }}
            >
              Register
            </NavLink>
          </small>
        </div>

        {deferredPrompt && (
          <div className="text-center mt-3">
            <button
              type="button"
              onClick={handleInstallClick}
              className="btn"
              style={{
                background: "#123458",
                color: "#F1EFEC",
                border: "none",
                padding: "6px 12px",
                fontSize: "0.9rem",
              }}
            >
              Install
            </button>
          </div>
        )}
      </div>

      {/* Guest Modal */}
      {guestModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: "rgba(0,0,0,0.5)", zIndex: 2000 }}
        >
          <div
            className="bg-white p-4 rounded"
            style={{ width: 360, border: "1px solid #D4C9BE" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h5 className="mb-2" style={{ color: "#123458" }}>Continue as Guest</h5>
            <p className="small text-muted mb-3">Please enter your name so we can attribute deposits to you.</p>

            <div className="mb-2">
              <label className="form-label small">First name</label>
              <input
                ref={guestFirstRef}
                type="text"
                className="form-control"
                value={guestFirst}
                onChange={(e) => setGuestFirst(e.target.value)}
                placeholder="First name"
                autoComplete="given-name"
              />
            </div>

            <div className="mb-3">
              <label className="form-label small">Last name</label>
              <input
                type="text"
                className="form-control"
                value={guestLast}
                onChange={(e) => setGuestLast(e.target.value)}
                placeholder="Last name"
                autoComplete="family-name"
              />
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-outline-secondary" onClick={handleGuestCancel}>Cancel</button>
              <button
                className="btn"
                style={{ background: "#123458", color: "#F1EFEC" }}
                onClick={handleGuestSubmit}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div
          className="toast show position-fixed bottom-0 end-0 m-3"
          style={{
            minWidth: "300px",
            backgroundColor: "#FFFFFF",
            border: "1px solid #D4C9BE",
          }}
          role="status"
          aria-live="polite"
        >
          <div className="d-flex justify-content-between align-items-start p-2">
            <div className="toast-body">{toastMessage}</div>
            <button type="button" className="btn-close ms-2 mb-1" onClick={hideToast} aria-label="Close toast" />
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;