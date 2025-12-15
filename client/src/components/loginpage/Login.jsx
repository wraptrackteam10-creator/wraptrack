import { useNavigate, NavLink } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import logo from "../../images/wtlogo-removebg.png";

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
    const choice = await deferredPrompt.userChoice;
    // optional: react to user's choice
    setDeferredPrompt(null);
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
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // server returned an error
        const message = data?.errorMessage || data?.message || `Login failed (${res.status})`;
        showToastMessage(message);
        setPassword(""); // clear password on failure
        setIsSubmitting(false);
        return;
      }

      // Expect server to send token and user info
      // Example data: { token, user: { id, firstname, lastname, role }, type }
      const token = data?.token || data?.accessToken || null;
      const user = data?.user || null;
      const role = (data?.type || user?.role || "").toLowerCase();

      if (!user) {
        showToastMessage("Login succeeded but user data missing.");
        setIsSubmitting(false);
        return;
      }

      // Store minimal user info and token (if any)
      const stored = {
        id: user.id || user._id || null,
        firstname: user.firstname || user.firstName || "",
        lastname: user.lastname || user.lastName || "",
        role: role || "user",
        token: token || null,
      };
      // use localStorage for persistent login (or cookies/secure storage on production)
      localStorage.setItem("user", JSON.stringify(stored));

      // Route based on role
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

  const handleGuest = () => {
    // Create a lightweight guest session
    const guest = { id: `guest_${Date.now()}`, firstname: "Guest", lastname: "", role: "visitor" };
    sessionStorage.setItem("guest", JSON.stringify(guest));
    // you may also request a guest token from backend if required
    navigate("/user");
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{
        backgroundColor: "#F1EFEC",
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
        {/* Top header row: logo + optional Install button */}
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
            <label htmlFor="username" className="form-label" style={{ color: "#030303" }}>
              Username
            </label>
            <input
              id="username"
              ref={usernameRef}
              type="text"
              value={username}
              className="form-control"
              placeholder="Enter username"
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
            onClick={handleGuest}
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
                fontWeight: 500,
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
              Install App
            </button>
          </div>
        )}
      </div>

      {/* Toast (aria-live for screen readers) */}
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