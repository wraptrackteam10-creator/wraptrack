import React, { useState } from "react";
import { fetchWithAuth } from "../../../utils/fetchWithAuth";
import { FaUserShield, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

function AddAccount() {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    username: "",
    email: "",
    password: "",
    type: "Guard",
    institute: "N/A",
    program: "N/A",
  });

  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    // Validate Username
    const usernameRegex = /^[a-zA-Z0-9_]{5,}$/;
    if (!usernameRegex.test(formData.username)) {
      setStatus({ 
        type: "error", 
        message: "Username must be at least 5 characters long and can only contain letters, numbers, and underscores." 
      });
      setLoading(false);
      return;
    }

    // Validate Password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setStatus({ 
        type: "error", 
        message: "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character." 
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus({ type: "error", message: data.error || data.errorMessage || "Failed to create account" });
      } else {
        setStatus({ type: "success", message: "Account successfully created!" });
        // Reset form after success
        setFormData({
          firstname: "",
          lastname: "",
          username: "",
          email: "",
          password: "",
          type: "Guard",
          institute: "N/A",
          program: "N/A",
        });
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", message: "Network error. Please try again later." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-3 p-md-4" style={{ background: "#f8fafc", minHeight: "100vh" }}>
      {/* PAGE HEADER */}
      <div
        className="d-flex justify-content-between mb-4 p-4 rounded-4 shadow-sm align-items-center flex-wrap gap-3"
        style={{ background: "#FFF", border: "1px solid #e2e8f0" }}
      >
        <div className="d-flex align-items-center gap-3">
          <div className="p-3 rounded-3" style={{ background: "rgba(18, 52, 88, 0.1)", color: "#123458" }}>
            <FaUserShield size={24} />
          </div>
          <div>
            <h4 className="fw-bold mb-0 text-dark">Add New Account</h4>
            <p className="text-muted small mb-0">Create new administrator or guard accounts</p>
          </div>
        </div>
      </div>

      {/* FORM SECTION */}
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 p-4" style={{ background: "#fff" }}>
            
            {status.message && (
              <div className={`alert ${status.type === 'success' ? 'alert-success' : 'alert-danger'} d-flex align-items-center gap-2`} role="alert">
                {status.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
                <div>{status.message}</div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <h6 className="fw-bold mb-3 text-dark">Personal Information</h6>
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label text-muted small fw-bold">First Name</label>
                  <input type="text" className="form-control" name="firstname" value={formData.firstname} onChange={handleChange} required placeholder="e.g. John" />
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small fw-bold">Last Name</label>
                  <input type="text" className="form-control" name="lastname" value={formData.lastname} onChange={handleChange} required placeholder="e.g. Doe" />
                </div>
              </div>

              <h6 className="fw-bold mb-3 text-dark">Account Credentials</h6>
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label text-muted small fw-bold">Username</label>
                  <input type="text" className="form-control" name="username" value={formData.username} onChange={handleChange} required placeholder="johndoe123" />
                  <div className="form-text" style={{ fontSize: "0.75rem" }}>Min. 5 characters (letters, numbers, underscores only).</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small fw-bold">Email Address</label>
                  <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} required placeholder="john@example.com" />
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small fw-bold">Temporary Password</label>
                  <input type="password" className="form-control" name="password" value={formData.password} onChange={handleChange} required placeholder="••••••••" minLength="8" />
                  <div className="form-text" style={{ fontSize: "0.75rem" }}>Min. 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char.</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted small fw-bold">Account Role</label>
                  <select className="form-select" name="type" value={formData.type} onChange={handleChange}>
                    <option value="Guard">Guard</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="d-flex justify-content-end mt-2">
                <button 
                  type="submit" 
                  className="btn px-4 fw-semibold shadow-sm d-flex align-items-center gap-2" 
                  style={{ background: "#123458", color: "#fff", borderRadius: "10px", height: "45px" }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <FaUserShield /> Create Account
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddAccount;
