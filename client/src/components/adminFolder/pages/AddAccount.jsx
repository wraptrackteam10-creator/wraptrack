import React, { useState, useMemo } from "react";
import { fetchWithAuth } from "../../../utils/fetchWithAuth";
import { FaUserShield, FaCheckCircle, FaExclamationCircle, FaEye, FaEyeSlash } from "react-icons/fa";

/* ─────────────────────────────────────────────
   Validation helpers  (mirror UserManagement)
───────────────────────────────────────────────*/
const isValidUsername = (username, type) => {
  if (!username) return false;
  if (type === "student") {
    return /^\d{4}-\d{4}$/.test(username);
  }
  // Guard / Admin / Faculty / Visitor: alphanumeric + underscore, 5–16 chars
  return /^[a-zA-Z0-9_]{5,16}$/.test(username);
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidPassword = (pw) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/.test(pw);

const isValidName = (name) => name.trim().length > 0;

/* ─────────────────────────────────────────────
   Per-field hint text
───────────────────────────────────────────────*/
const getUsernameHint = (type) => {
  if (type === "student") return 'Must follow the format 0000-0000 (e.g. 2024-0001).';
  return "5–16 characters. Letters, numbers, and underscores only.";
};

/* ─────────────────────────────────────────────
   Inline validation indicator component
───────────────────────────────────────────────*/
const FieldHint = ({ touched, valid, hint }) => {
  if (!touched) return <div className="form-text" style={{ fontSize: "0.73rem" }}>{hint}</div>;
  return (
    <div
      className="form-text d-flex align-items-center gap-1 mt-1"
      style={{ fontSize: "0.73rem", color: valid ? "#198754" : "#dc3545" }}
    >
      {valid ? <FaCheckCircle size={11} /> : <FaExclamationCircle size={11} />}
      {valid ? "Looks good!" : hint}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────────*/
function AddAccount() {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    username: "",
    email: "",
    password: "",
    type: "guard",
    institute: "N/A",
    program: "N/A",
  });

  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  /* ── field-level validity ── */
  const validity = useMemo(() => ({
    firstname: isValidName(formData.firstname),
    lastname:  isValidName(formData.lastname),
    username:  isValidUsername(formData.username, formData.type),
    email:     isValidEmail(formData.email),
    password:  isValidPassword(formData.password),
  }), [formData]);

  const allValid = Object.values(validity).every(Boolean);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Reset username touched state when type changes so hint refreshes
    if (name === "type") {
      setTouched((prev) => ({ ...prev, username: false }));
      setFormData((prev) => ({ ...prev, [name]: value, username: "" }));
    }
  };

  const handleBlur = (e) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  };

  const markAllTouched = () =>
    setTouched({ firstname: true, lastname: true, username: true, email: true, password: true });

  const handleSubmit = async (e) => {
    e.preventDefault();
    markAllTouched();

    if (!allValid) {
      setStatus({ type: "error", message: "Please fix the highlighted fields before submitting." });
      return;
    }

    setLoading(true);
    setStatus({ type: "", message: "" });

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
        setStatus({ type: "success", message: `Account for "${formData.firstname} ${formData.lastname}" created successfully!` });
        setFormData({
          firstname: "",
          lastname: "",
          username: "",
          email: "",
          password: "",
          type: "guard",
          institute: "N/A",
          program: "N/A",
        });
        setTouched({});
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", message: "Network error. Please try again later." });
    } finally {
      setLoading(false);
    }
  };

  /* ── border color helper ── */
  const inputClass = (field) => {
    if (!touched[field]) return "form-control";
    return `form-control ${validity[field] ? "is-valid" : "is-invalid"}`;
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

      {/* FORM CARD */}
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 p-4" style={{ background: "#fff" }}>

            {/* Global status banner */}
            {status.message && (
              <div
                className={`alert ${status.type === "success" ? "alert-success" : "alert-danger"} d-flex align-items-center gap-2`}
                role="alert"
              >
                {status.type === "success" ? <FaCheckCircle /> : <FaExclamationCircle />}
                <div>{status.message}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>

              {/* ── Personal Information ── */}
              <h6 className="fw-bold mb-3 text-dark border-bottom pb-2">Personal Information</h6>
              <div className="row g-3 mb-4">
                {/* First Name */}
                <div className="col-md-6">
                  <label className="form-label text-muted small fw-bold">First Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={inputClass("firstname")}
                    name="firstname"
                    value={formData.firstname}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g. John"
                  />
                  <FieldHint
                    touched={touched.firstname}
                    valid={validity.firstname}
                    hint="First name is required."
                  />
                </div>

                {/* Last Name */}
                <div className="col-md-6">
                  <label className="form-label text-muted small fw-bold">Last Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={inputClass("lastname")}
                    name="lastname"
                    value={formData.lastname}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g. Doe"
                  />
                  <FieldHint
                    touched={touched.lastname}
                    valid={validity.lastname}
                    hint="Last name is required."
                  />
                </div>
              </div>

              {/* ── Account Credentials ── */}
              <h6 className="fw-bold mb-3 text-dark border-bottom pb-2">Account Credentials</h6>
              <div className="row g-3 mb-4">

                {/* Account Role (first so username hint updates on change) */}
                <div className="col-md-6">
                  <label className="form-label text-muted small fw-bold">Account Role <span className="text-danger">*</span></label>
                  <select
                    className="form-select"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                  >
                    <option value="guard">Guard</option>
                    <option value="admin">Admin</option>
                    <option value="faculty">Faculty</option>
                    <option value="student">Student</option>
                    <option value="visitor">Visitor</option>
                  </select>
                  <div className="form-text" style={{ fontSize: "0.73rem" }}>
                    Username format depends on the selected role.
                  </div>
                </div>

                {/* Username / Login ID */}
                <div className="col-md-6">
                  <label className="form-label text-muted small fw-bold">
                    {formData.type === "student" ? "Student ID (Login ID)" : "Username (Login ID)"}
                    <span className="text-danger"> *</span>
                  </label>
                  <input
                    type="text"
                    className={inputClass("username")}
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={formData.type === "student" ? "0000-0000" : "johndoe123"}
                  />
                  <FieldHint
                    touched={touched.username}
                    valid={validity.username}
                    hint={getUsernameHint(formData.type)}
                  />
                </div>

                {/* Email */}
                <div className="col-md-6">
                  <label className="form-label text-muted small fw-bold">Email Address <span className="text-danger">*</span></label>
                  <input
                    type="email"
                    className={inputClass("email")}
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="john@example.com"
                  />
                  <FieldHint
                    touched={touched.email}
                    valid={validity.email}
                    hint="Enter a valid email address (e.g. user@domain.com)."
                  />
                </div>

                {/* Password */}
                <div className="col-md-6">
                  <label className="form-label text-muted small fw-bold">Temporary Password <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      className={inputClass("password")}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="••••••••"
                      style={{ borderRight: "none" }}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                      style={{ borderLeft: "none", borderColor: touched.password ? (validity.password ? "#198754" : "#dc3545") : "#ced4da" }}
                    >
                      {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                    </button>
                  </div>
                  <FieldHint
                    touched={touched.password}
                    valid={validity.password}
                    hint="Min 8 chars with 1 uppercase, 1 lowercase, 1 number & 1 special character (@$!%*?&#)."
                  />
                </div>
              </div>

              {/* Validation summary (shown only after trying to submit) */}
              {touched.firstname && !allValid && (
                <div
                  className="rounded-3 p-3 mb-3 small"
                  style={{ background: "#fff5f5", border: "1px solid #fecaca", color: "#b91c1c" }}
                >
                  <strong>Please fix the following:</strong>
                  <ul className="mb-0 mt-1 ps-3">
                    {!validity.firstname  && <li>First name is required.</li>}
                    {!validity.lastname   && <li>Last name is required.</li>}
                    {!validity.username   && <li>{getUsernameHint(formData.type)}</li>}
                    {!validity.email      && <li>Enter a valid email address.</li>}
                    {!validity.password   && <li>Password must be at least 8 chars with uppercase, lowercase, number & special character.</li>}
                  </ul>
                </div>
              )}

              {/* Submit */}
              <div className="d-flex justify-content-end mt-2">
                <button
                  type="submit"
                  className="btn px-4 fw-semibold shadow-sm d-flex align-items-center gap-2"
                  style={{ background: "#123458", color: "#fff", borderRadius: "10px", height: "45px", opacity: loading ? 0.75 : 1 }}
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
