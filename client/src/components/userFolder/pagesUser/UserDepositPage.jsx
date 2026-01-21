import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuCamera, LuImage } from "react-icons/lu";
import { fetchWithAuth } from "../../../utils/fetchWithAuth";

/**
 * UserDepositPage — updated styles & responsiveness
 *
 * - Color system follows the project's rules (header/footer #123458, app bg #F1EFEC,
 *   card/table surface #FFFFFF, borders #D4C9BE, primary actions #123458, delete #F08080).
 * - Responsive:
 *   * On small screens upload/scan buttons stack and are full-width.
 *   * Card width adapts, inputs and buttons scale for mobile.
 * - Uses inline styles to ensure exact colors without changing global CSS.
 */

const COLORS = {
  appBg: "#F1EFEC",
  header: "#123458",
  headerText: "#F1EFEC",
  surface: "#FFFFFF",
  border: "#D4C9BE",
  primary: "#123458",
  delete: "#F08080",
  text: "#030303",
  muted: "#D4C9BE",
};

function UserDepositPage() {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const navigate = useNavigate();

  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;

  // =============================
  // SHOW TOAST
  // =============================
  const showToast = (message, type = "success", duration = 3000) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), duration);
  };

  // =============================
  // FETCH SETTINGS (Check Student Access)
  // =============================
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE_URL}/api/settings`, {
          credentials: "include",
        });
        const data = await res.json();
        setSettings(data);
      } catch (error) {
        console.error("Failed to load settings:", error);
        showToast("Failed to load settings", "danger");
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchSettings();
  }, [API_BASE_URL]);

  if (loadingSettings) {
    return (
      <div style={{ background: COLORS.appBg, minHeight: "100vh" }} className="d-flex align-items-center justify-content-center">
        <div className="text-center mt-5">
          <div style={{ color: COLORS.muted }}>Loading settings...</div>
        </div>
      </div>
    );
  }

  if (!settings?.studentAccess) {
    return (
      <div style={{ background: COLORS.appBg, minHeight: "100vh" }} className="d-flex align-items-center justify-content-center">
        <div className="text-center mt-5">
          <h4 style={{ color: COLORS.delete }}>🚫 Deposit Feature Disabled</h4>
          <p style={{ color: COLORS.muted }} className="small">The admin has turned OFF the deposit feature.</p>
          <p style={{ color: COLORS.muted }} className="small">Please contact Admin.</p>
          <button
            className="btn"
            style={{ background: COLORS.primary, color: COLORS.headerText, marginTop: 12 }}
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // =============================
  // YOLO CLASS MAP
  // =============================
  const classMap = {
    water_bottle_disposable: "Disposable Water Bottle",
    water_bottle_reusable: "Reusable Water Bottle",
    tupperware_reusable: "Reusable Tupperware",
    straw_disposable: "Disposable Straw",
    snack_disposable: "Disposable Snack",
    plastic_utensil_disposable: "Disposable Plastic Utensil",
    plastic_gloves_disposable: "Disposable Plastic Gloves",
    plastic_disposable: "Disposable Plastic",
    non_disposable_items: "Non-disposable Item",
    beverage_disposable: "Disposable Beverage",
  };

  // =============================
  // HANDLE CAPTURE / UPLOAD
  // =============================
  const handleCapture = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    if (image) URL.revokeObjectURL(image);
    const imgUrl = URL.createObjectURL(selectedFile);
    setImage(imgUrl);
    setFile(selectedFile);

    const resizeImage = async (file) => {
      return new Promise((resolve) => {
        const img = new Image();
        const reader = new FileReader();
        reader.onload = () => {
          img.src = reader.result;
        };
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxSize = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) =>
              resolve(new File([blob], file.name, { type: file.type })),
            file.type,
            0.8
          );
        };
        reader.readAsDataURL(file);
      });
    };

    const resizedFile = await resizeImage(selectedFile);

    const formData = new FormData();
    formData.append("image", resizedFile);

    try {
      setDescription("⏳ Detecting...");
      // https://kl0rgv7vxbph19-5000.proxy.runpod.net
      
      const res = await fetch("https://78h6cdn9bgj3a4-5000.proxy.runpod.net/predict", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.detections?.length > 0) {
        const counts = {};
        data.detections.forEach((det) => {
          const rawName = det.class;
          const descName = classMap[rawName] || rawName;
          counts[descName] = (counts[descName] || 0) + 1;
        });

        const formatted = Object.entries(counts)
          .map(([name, count]) => {
            let display = name;
            if (count > 1 && !name.endsWith("s")) display += "s";
            return `${display} (x${count})`;
          })
          .join(", ");

        setDescription(formatted);
      } else {
        setDescription("Unknown Item");
      }
    } catch (error) {
      console.error("YOLO error:", error);
      setDescription("Detection Failed");
      showToast("Detection Failed", "danger");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return showToast("Please select an image!", "warning");
    if (!description) return showToast("Please wait for detection.", "warning");

    const formData = new FormData();
    formData.append("photo", file);
    formData.append("userId", user.id);
    formData.append("firstname", user.firstname);
    formData.append("lastname", user.lastname);
    formData.append("role", user.role);
    formData.append("action", "Deposited");
    formData.append("description", description);

    try {
      setLoading(true);
      const res = await fetchWithAuth(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        showToast("✅ Upload successful!", "success");
        setImage(null);
        setFile(null);
        setDescription("");
        setShowPreview(false);
      } else {
        showToast(data.error || "❌ Upload failed.", "danger");
      }
    } catch (error) {
      console.error("Upload error:", error);
      showToast("⚠️ Server error.", "danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: COLORS.appBg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* FIXED HEADER */}
      <div
        className="text-center py-3"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: COLORS.header,
          color: COLORS.headerText,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <h3 className="fw-bold mb-0 d-flex align-items-center justify-content-center gap-2">
          <LuCamera size={22} /> Item Deposit
        </h3>
        <small style={{ color: COLORS.headerText, opacity: 0.95 }}>Scan or upload your item for storage</small>
      </div>

      {/* SCROLLABLE MAIN */}
      <div className="flex-grow-1 overflow-auto p-3">
        <div
          className="mx-auto"
          style={{
            maxWidth: 680,
            background: COLORS.surface,
            borderRadius: 18,
            border: `1px solid ${COLORS.border}`,
            padding: 20,
            boxShadow: "0 6px 24px rgba(0,0,0,0.04)",
          }}
        >
          {/* Upload Buttons (stack on xs, inline on md+) */}
          <div className="d-flex flex-column flex-sm-row gap-3 mb-4">
            <label
              className="d-flex align-items-center justify-content-center"
              style={{
                cursor: "pointer",
                flex: 1,
                padding: "10px 14px",
                borderRadius: 10,
                background: "transparent",
                border: `1px solid ${COLORS.border}`,
                color: COLORS.text,
                textAlign: "center",
              }}
            >
              <LuImage size={18} style={{ marginRight: 8 }} /> Upload
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleCapture}
              />
            </label>

            <label
              className="d-flex align-items-center justify-content-center"
              style={{
                cursor: "pointer",
                flex: 1,
                padding: "10px 14px",
                borderRadius: 10,
                background: COLORS.primary,
                color: COLORS.headerText,
                textAlign: "center",
              }}
            >
              <LuCamera size={18} style={{ marginRight: 8 }} /> Scan
              <input
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: "none" }}
                onChange={handleCapture}
              />
            </label>
          </div>

          {/* Preview */}
          {image && (
            <div className="text-center mb-3">
              <button
                type="button"
                className="btn"
                style={{
                  background: "transparent",
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.text,
                  padding: "6px 10px",
                  borderRadius: 999,
                  marginBottom: 10,
                }}
                onClick={() => setShowPreview((s) => !s)}
              >
                {showPreview ? "Hide Preview ▲" : "Show Preview ▼"}
              </button>

              {showPreview && (
                <img
                  src={image}
                  alt="Preview"
                  className="img-fluid rounded shadow-sm"
                  style={{ maxHeight: 300, objectFit: "contain", border: `1px solid ${COLORS.border}` }}
                />
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ color: COLORS.text }}>
                Item Description
              </label>
              <input
                type="text"
                value={description}
                readOnly
                className="form-control"
                style={{ border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text }}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ color: COLORS.text }}>
                Depositor
              </label>
              <input
                type="text"
                value={`${user?.firstname || ""} ${user?.lastname || ""}`}
                disabled
                className="form-control"
                style={{ border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text }}
              />
            </div>

            <div className="row">
              <div className="col-12 col-sm-6 mb-3">
                <label className="form-label fw-semibold" style={{ color: COLORS.text }}>
                  Date
                </label>
                <input
                  type="text"
                  value={new Date().toLocaleDateString()}
                  disabled
                  className="form-control"
                  style={{ border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text }}
                />
              </div>
              <div className="col-12 col-sm-6 mb-3">
                <label className="form-label fw-semibold" style={{ color: COLORS.text }}>
                  Time
                </label>
                <input
                  type="text"
                  value={new Date().toLocaleTimeString()}
                  disabled
                  className="form-control"
                  style={{ border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text }}
                />
              </div>
            </div>

            <div className="d-flex flex-column flex-sm-row gap-3 mt-3">
              <button
                type="submit"
                className="btn"
                style={{
                  flex: 1,
                  background: COLORS.primary,
                  color: COLORS.headerText,
                  padding: "10px 12px",
                  borderRadius: 10,
                  fontWeight: 700,
                  border: `1px solid ${COLORS.primary}`,
                }}
                disabled={
                  loading ||
                  !file ||
                  !description ||
                  description === "⏳ Detecting..." ||
                  description === "Unknown Item" ||
                  description === "Detection Failed"
                }
              >
                {loading ? "Uploading..." : "Submit"}
              </button>

              <button
                type="button"
                className="btn"
                style={{
                  flex: 1,
                  background: "transparent",
                  color: COLORS.delete,
                  border: `1px solid ${COLORS.delete}`,
                  padding: "10px 12px",
                  borderRadius: 10,
                  fontWeight: 700,
                }}
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* TOAST */}
      {toast.show && (
        <div
          className="position-fixed bottom-0 end-0 m-3 p-3 rounded shadow"
          style={{
            zIndex: 2000,
            minWidth: 260,
            background:
              toast.type === "success"
                ? COLORS.primary
                : toast.type === "danger"
                ? COLORS.delete
                : "#ffc107",
            color: toast.type === "warning" ? "#030303" : "#fff",
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default UserDepositPage;