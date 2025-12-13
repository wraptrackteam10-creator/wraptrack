import { useNavigate, NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import { IoInformationCircleSharp, IoDownloadSharp } from "react-icons/io5";
import logo from "../../images/wtlogo-removebg.png";

function Login() {
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loginRestriction, setLoginRestriction] = useState(false);
    const [loading, setLoading] = useState(true);
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    const [toastMessage, setToastMessage] = useState("");
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/settings`);
                const data = await res.json();
                setLoginRestriction(data.loginRestriction);
            } catch (error) {
                console.error("Settings fetch error:", error);
                showToastMessage("Error fetching system settings!");
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [API_BASE_URL]);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const showToastMessage = (message) => {
        setToastMessage(message);
        setShowToast(true);
    };

    const hideToast = () => setShowToast(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        if (loginRestriction && username.toLowerCase() !== "admin") {
            showToastMessage("⛔ Login is currently disabled by the system administrator.");
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            localStorage.setItem(
                "user",
                JSON.stringify({
                    id: data.user.id,
                    firstname: data.user.firstname,
                    lastname: data.user.lastname,
                    role: data.type,
                })
            );

            if (data.type === "admin") navigate("/admin");
            else if (["student", "visitor", "faculty"].includes(data.type)) navigate("/user");
            else if (data.type === "guard") navigate("/guard");
            else showToastMessage("Unknown user role.");

        } catch (error) {
            console.error("Login error:", error);
            showToastMessage("Server error. Try again later.");
        }
    };

    const handleInstallClick = () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
    };

    const handleHelpClick = () => {
        showToastMessage(
            `📌 Help Guide:
- Enter your username and password to login.
- If you don't have an account, click the Register link below login button to create an account.
- After login, you will be redirected to your dashboard based on your role.
- Click 'Install' to add this app to your home screen (PWA).
- For any issues, contact your system administrator.`
        );
    };

    if (loading) return <p>Loading system settings...</p>;

    return (
        <div
            className="d-flex align-items-center justify-content-center bg-light"
            style={{ height: "100dvh", position: "relative" }}
        >
            {/* Upper right icons */}
            <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: "10px" }}>
                <IoInformationCircleSharp
                    onClick={handleHelpClick}
                    title="Help"
                    size={32}
                    style={{
                        color: "#fff",
                        backgroundColor: "#000",
                        borderRadius: "50%",
                        padding: "4px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
                    }}
                />

                {deferredPrompt && (
                    <IoDownloadSharp
                        onClick={handleInstallClick}
                        title="Install App"
                        size={32}
                        style={{
                            color: "#fff",
                            backgroundColor: "#000",
                            borderRadius: "50%",
                            padding: "4px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
                        }}
                    />
                )}
            </div>

            <div className="card shadow-lg border-0 p-4 rounded-3" style={{ width: "350px" }}>
                {loginRestriction && (
                    <div className="text-center mt-2 fst-italic fw-bold text-danger">
                        ***Login is restricted. Only admins can log in.***
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="mb-5 text-center d-flex justify-content-center align-items-center">
                        <img src={logo} alt="Logo" style={{ width: "100px" }} />
                        <h3 className="fw-bold text-secondary mt-2">WraPTrack</h3>
                    </div>

                    <div className="mb-3 text-start">
                        <label className="form-label">Username</label>
                        <input
                            type="text"
                            value={username}
                            placeholder="Enter Username"
                            className="form-control"
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="username"
                            required
                        />
                    </div>

                    <div className="mb-3 text-start" style={{ position: "relative" }}>
                        <label className="form-label">Password</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            placeholder="Enter Password"
                            className="form-control"
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                        />
                        <i
                            className={`bi ${showPassword ? "bi-eye" : "bi-eye-slash"}`}
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: "absolute",
                                right: "12px",
                                top: "67%",
                                transform: "translateY(-50%)",
                                cursor: "pointer",
                                fontSize: "1.2rem",
                                color: "#555",
                            }}
                        ></i>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-100 py-2 fw-bold"
                        disabled={loginRestriction && username.toLowerCase() !== "admin"}
                    >
                        Login
                    </button>
                </form>

                {/* ⭐ ADDED FORGOT PASSWORD LINK HERE ⭐ */}
                <div className="text-center mt-2">
                    <NavLink
                        to="/forgot-password"
                        className="text-decoration-none text-primary"
                    >
                        Forgot Password?
                    </NavLink>
                </div>

                <div className="text-center mt-3">
                    <small>
                        Don’t have an account?{" "}
                        <NavLink to="/signup" className="text-decoration-none">
                            Register
                        </NavLink>
                    </small>
                </div>
            </div>

            {showToast && (
                <div
                    className="toast show position-fixed bottom-0 end-0 m-3"
                    style={{ minWidth: "300px", zIndex: 1055 }}
                >
                    <div className="d-flex justify-content-between align-items-start p-2">
                        <div className="toast-body">{toastMessage}</div>
                        <button
                            type="button"
                            className="btn-close ms-2 mb-1"
                            aria-label="Close"
                            onClick={hideToast}
                        ></button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Login;
