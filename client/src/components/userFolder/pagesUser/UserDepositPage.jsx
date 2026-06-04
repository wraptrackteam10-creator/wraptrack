import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuCamera, LuImage, LuRefreshCw, LuCircleAlert } from "react-icons/lu";
import { fetchWithAuth } from "../../../utils/fetchWithAuth";

/**
 * UserDepositPage — Production Ready UI/UX
 *
 * - Professional color system and typography hierarchy
 * - Optimized form layout with smart responsive design
 * - Enhanced error handling with helpful guidance
 * - Floating detection modal overlay
 * - Mobile & desktop optimized
 */

const COLORS = {
  appBg: "#F5F3F0",
  header: "#123458",
  headerText: "#F1EFEC",
  surface: "#FFFFFF",
  border: "#E8DFD5",
  primary: "#123458",
  secondary: "#5A7FA6",
  delete: "#DC3545",
  text: "#1A1A1A",
  textLight: "#6B6B6B",
  textMuted: "#999999",
  success: "#28A745",
  warning: "#FFA500",
  errorBg: "#FFF8F0",
  errorBorder: "#FFD9B3",
};

const DETECTION_STAGES = [
  { step: 1, icon: "📸", label: "Scanning image", duration: 1000 },
  { step: 2, icon: "🔍", label: "Analyzing objects", duration: 1000 },
  { step: 3, icon: "⚙️", label: "Processing with YOLO", duration: 1000 },
  { step: 4, icon: "✓", label: "Finalizing classification", duration: 1000 },
];

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
  const [isDetecting, setIsDetecting] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [detectionError, setDetectionError] = useState(null); // 'failed' | 'unknown' | null

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
  // FETCH SETTINGS
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

  // =============================
  // DETECTION ANIMATION LOOP
  // =============================
  useEffect(() => {
    if (!isDetecting) return;

    let currentStageIndex = 0;
    setCurrentStage(0);

    const animationLoop = async () => {
      while (isDetecting && currentStageIndex < DETECTION_STAGES.length) {
        setCurrentStage(currentStageIndex);
        await new Promise((resolve) => 
          setTimeout(resolve, DETECTION_STAGES[currentStageIndex].duration)
        );
        currentStageIndex++;
      }
    };

    animationLoop();
  }, [isDetecting]);

  if (loadingSettings) {
    return (
      <div style={{ background: COLORS.appBg, minHeight: "100vh" }} className="d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border" style={{ color: COLORS.primary }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div style={{ color: COLORS.textLight, marginTop: "12px", fontWeight: 500 }}>
            Loading settings...
          </div>
        </div>
      </div>
    );
  }

  if (!settings?.studentAccess) {
    return (
      <div style={{ background: COLORS.appBg, minHeight: "100vh" }} className="d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div
            style={{
              width: "80px",
              height: "80px",
              margin: "0 auto 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(220, 53, 69, 0.1)",
              borderRadius: "50%",
              fontSize: "36px",
            }}
          >
            🚫
          </div>
          <h4 style={{ color: COLORS.delete, fontWeight: 700, marginBottom: "8px" }}>
            Deposit Feature Disabled
          </h4>
          <p style={{ color: COLORS.textLight, marginBottom: "12px", fontSize: "14px" }}>
            The admin has turned OFF the deposit feature.
          </p>
          <p style={{ color: COLORS.textLight, marginBottom: "20px", fontSize: "14px" }}>
            Please contact Admin.
          </p>
          <button
            className="btn"
            style={{
              background: COLORS.primary,
              color: COLORS.headerText,
              border: "none",
              borderRadius: "8px",
              padding: "10px 24px",
              fontWeight: 600,
            }}
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
    setShowPreview(false);
    setDetectionError(null);

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
      setIsDetecting(true);
      setCurrentStage(0);
      setDescription("");

      const res = await fetch("http://172.10.45.78:5000/predict", {
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
        setDetectionError(null);
      } else {
        setDescription("Unknown Item");
        setDetectionError("unknown");
        showToast("No items detected. Please try again.", "warning");
      }
    } catch (error) {
      console.error("YOLO error:", error);
      setDescription("Detection Failed");
      setDetectionError("failed");
      showToast("Detection Failed", "danger");
    } finally {
      setIsDetecting(false);
    }
  };

  const handleRetryDetection = async () => {
    if (!file) return;

    setDetectionError(null);
    setDescription("");

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

    const resizedFile = await resizeImage(file);
    const formData = new FormData();
    formData.append("image", resizedFile);

    try {
      setIsDetecting(true);
      setCurrentStage(0);

      const res = await fetch("http://172.10.45.78:5000/predict", {
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
        setDetectionError(null);
        showToast("Detection successful!", "success");
      } else {
        setDescription("Unknown Item");
        setDetectionError("unknown");
        showToast("No items detected. Please try again.", "warning");
      }
    } catch (error) {
      console.error("YOLO error:", error);
      setDescription("Detection Failed");
      setDetectionError("failed");
      showToast("Detection Failed", "danger");
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return showToast("Please select an image!", "warning");
    if (!description) return showToast("Please wait for detection.", "warning");
    if (detectionError) return showToast("Please retry detection first.", "warning");

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
        showToast("Item deposited successfully!", "success");
        setTimeout(() => {
          setImage(null);
          setFile(null);
          setDescription("");
          setShowPreview(false);
          setDetectionError(null);
        }, 1500);
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
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: COLORS.header,
          color: COLORS.headerText,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          padding: "16px 24px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontWeight: 700, margin: "0 0 4px 0", fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <LuCamera size={20} /> Item Deposit
          </h2>
          <small style={{ color: COLORS.headerText, opacity: 0.8, fontSize: "12px" }}>
            Scan or upload your item for storage
          </small>
        </div>
      </header>

      {/* SCROLLABLE MAIN */}
      <div className="flex-grow-1 overflow-auto" style={{ padding: "28px 16px" }}>
        <div
          className="mx-auto"
          style={{
            maxWidth: 520,
            background: COLORS.surface,
            borderRadius: "12px",
            border: `1px solid ${COLORS.border}`,
            padding: "28px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
          }}
        >
          {/* ===== SECTION 1: IMAGE CAPTURE ===== */}
          <div style={{ marginBottom: "28px" }}>
            {/* Upload & Scan Buttons - SINGLE ROW */}
            <div className="d-grid gap-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <label
                style={{
                  cursor: "pointer",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  background: "transparent",
                  border: `1.5px solid ${COLORS.border}`,
                  color: COLORS.text,
                  textAlign: "center",
                  fontWeight: 600,
                  fontSize: "14px",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = COLORS.primary;
                  e.currentTarget.style.background = "rgba(18, 52, 88, 0.04)";
                  e.currentTarget.style.color = COLORS.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = COLORS.border;
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = COLORS.text;
                }}
              >
                <LuImage size={16} /> Upload
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleCapture}
                />
              </label>

              <label
                style={{
                  cursor: "pointer",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  background: COLORS.primary,
                  color: COLORS.headerText,
                  textAlign: "center",
                  fontWeight: 600,
                  fontSize: "14px",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  boxShadow: "0 2px 6px rgba(18, 52, 88, 0.12)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(18, 52, 88, 0.2)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 2px 6px rgba(18, 52, 88, 0.12)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <LuCamera size={16} /> Scan
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: "none" }}
                  onChange={handleCapture}
                />
              </label>
            </div>
          </div>

          {/* ===== SECTION 2: IMAGE PREVIEW ===== */}
          {image && (
            <div style={{ marginBottom: "24px" }}>
              <button
                type="button"
                style={{
                  background: showPreview ? "rgba(18, 52, 88, 0.08)" : "transparent",
                  border: `1.5px solid ${COLORS.border}`,
                  color: COLORS.primary,
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "13px",
                  transition: "all 0.2s ease",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  cursor: "pointer",
                }}
                onClick={() => setShowPreview((s) => !s)}
                onMouseEnter={(e) => {
                  if (!showPreview) {
                    e.currentTarget.style.background = "rgba(18, 52, 88, 0.04)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!showPreview) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                {showPreview ? "✕ Hide Preview" : "👁 Show Preview"}
              </button>

              {showPreview && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "12px",
                    background: COLORS.appBg,
                    borderRadius: "8px",
                    border: `1px solid ${COLORS.border}`,
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={image}
                    alt="Preview"
                    style={{
                      width: "100%",
                      maxHeight: "320px",
                      objectFit: "contain",
                      display: "block",
                      borderRadius: "6px",
                      background: COLORS.surface,
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* ===== SECTION 3: DETECTION ERROR BANNER ===== */}
          {detectionError && (
            <div
              style={{
                padding: "16px",
                background: COLORS.errorBg,
                border: `1.5px solid ${COLORS.errorBorder}`,
                borderRadius: "8px",
                marginBottom: "24px",
              }}
            >
              <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                <LuCircleAlert size={20} style={{ color: COLORS.warning, flexShrink: 0, marginTop: "2px" }} />
                <div style={{ flex: 1 }}>
                  <h6 style={{ color: COLORS.warning, fontWeight: 700, margin: "0 0 4px 0", fontSize: "14px" }}>
                    {detectionError === "failed" ? "Detection Failed" : "No Items Detected"}
                  </h6>
                  <p style={{ color: COLORS.text, fontSize: "13px", margin: "0 0 12px 0", lineHeight: "1.4" }}>
                    {detectionError === "failed"
                      ? "Unable to process your image. Please try again."
                      : "No items were found in your image. Please try another image."}
                  </p>

                  {/* Troubleshooting Tips */}
                  <div style={{ background: "rgba(255, 255, 255, 0.6)", padding: "12px", borderRadius: "6px", marginBottom: "12px" }}>
                    <p style={{ fontWeight: 600, color: COLORS.text, fontSize: "12px", margin: "0 0 8px 0" }}>💡 What you can try:</p>
                    <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12px", color: COLORS.textLight, lineHeight: "1.5" }}>
                      <li>Check your internet connection</li>
                      <li>Ensure item is clearly visible and well-lit</li>
                      <li>Try from a different angle</li>
                      <li>Wait a moment and try again (server may be busy)</li>
                      <li>Contact admin if problems persist</li>
                    </ul>
                  </div>

                  {/* Retry Button */}
                  <button
                    type="button"
                    onClick={handleRetryDetection}
                    disabled={isDetecting}
                    style={{
                      width: "100%",
                      padding: "10px",
                      background: COLORS.warning,
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: 600,
                      fontSize: "13px",
                      cursor: isDetecting ? "not-allowed" : "pointer",
                      opacity: isDetecting ? 0.6 : 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isDetecting) {
                        e.currentTarget.style.background = "#FF9500";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = COLORS.warning;
                    }}
                  >
                    <LuRefreshCw size={14} /> Retry Detection
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===== SECTION 4: FORM FIELDS ===== */}
          <form onSubmit={handleSubmit}>
            {/* Item Description */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontWeight: 600, color: COLORS.text, fontSize: "13px", marginBottom: "6px", display: "block" }}>
                Item Description
              </label>
              {description && !detectionError ? (
                <div
                  style={{
                    padding: "11px 13px",
                    background: "#F0F8FF",
                    border: `1.5px solid ${COLORS.primary}`,
                    borderRadius: "6px",
                    color: COLORS.primary,
                    fontWeight: 600,
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span style={{ fontSize: "16px" }}>✓</span>
                  {description}
                </div>
              ) : (
                <input
                  type="text"
                  value=""
                  placeholder={detectionError ? "Please retry detection or try new image" : "Description will appear here after detection"}
                  disabled
                  style={{
                    width: "100%",
                    border: `1px solid ${detectionError ? COLORS.delete : COLORS.border}`,
                    background: detectionError ? "rgba(220, 53, 69, 0.04)" : COLORS.surface,
                    color: COLORS.textLight,
                    borderRadius: "6px",
                    padding: "10px 12px",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                />
              )}
            </div>

            {/* Depositor */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontWeight: 600, color: COLORS.text, fontSize: "13px", marginBottom: "6px", display: "block" }}>
                Depositor
              </label>
              <input
                type="text"
                value={`${user?.firstname || ""} ${user?.lastname || ""}`}
                disabled
                style={{
                  width: "100%",
                  border: `1px solid ${COLORS.border}`,
                  background: COLORS.appBg,
                  color: COLORS.text,
                  borderRadius: "6px",
                  padding: "10px 12px",
                  fontSize: "13px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Date & Time - SINGLE ROW */}
            <div style={{ marginBottom: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ fontWeight: 600, color: COLORS.text, fontSize: "13px", marginBottom: "6px", display: "block" }}>
                  Date
                </label>
                <input
                  type="text"
                  value={new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  disabled
                  style={{
                    width: "100%",
                    border: `1px solid ${COLORS.border}`,
                    background: COLORS.appBg,
                    color: COLORS.text,
                    borderRadius: "6px",
                    padding: "10px 12px",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label style={{ fontWeight: 600, color: COLORS.text, fontSize: "13px", marginBottom: "6px", display: "block" }}>
                  Time
                </label>
                <input
                  type="text"
                  value={new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
                  disabled
                  style={{
                    width: "100%",
                    border: `1px solid ${COLORS.border}`,
                    background: COLORS.appBg,
                    color: COLORS.text,
                    borderRadius: "6px",
                    padding: "10px 12px",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* ===== SECTION 5: ACTION BUTTONS - SINGLE ROW ===== */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <button
                type="submit"
                style={{
                  background: COLORS.primary,
                  color: COLORS.headerText,
                  padding: "12px 16px",
                  borderRadius: "6px",
                  fontWeight: 600,
                  fontSize: "14px",
                  border: "none",
                  transition: "all 0.2s ease",
                  cursor: loading || !file || detectionError ? "not-allowed" : "pointer",
                  opacity: loading || !file || detectionError ? 0.6 : 1,
                  boxShadow: "0 2px 6px rgba(18, 52, 88, 0.12)",
                }}
                disabled={loading || !file || detectionError}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(18, 52, 88, 0.2)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 2px 6px rgba(18, 52, 88, 0.12)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" style={{ width: "12px", height: "12px" }} />
                    Uploading...
                  </>
                ) : (
                  "Submit"
                )}
              </button>

              <button
                type="button"
                style={{
                  background: "transparent",
                  color: COLORS.delete,
                  border: `1.5px solid ${COLORS.delete}`,
                  padding: "12px 16px",
                  borderRadius: "6px",
                  fontWeight: 600,
                  fontSize: "14px",
                  transition: "all 0.2s ease",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                }}
                onClick={() => navigate(-1)}
                disabled={loading}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.background = COLORS.delete;
                    e.currentTarget.style.color = COLORS.headerText;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = COLORS.delete;
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* FLOATING DETECTION MODAL OVERLAY */}
      {isDetecting && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.35)",
              zIndex: 1999,
              backdropFilter: "blur(4px)",
              animation: "fadeIn 0.3s ease-out",
            }}
          />

          {/* Floating Modal */}
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 2000,
              background: COLORS.surface,
              borderRadius: "16px",
              padding: "40px 32px",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
              width: "90%",
              maxWidth: "400px",
              textAlign: "center",
              animation: "slideInScale 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {/* Detection Content */}
            <div style={{ marginBottom: "24px" }}>
              <div
                style={{
                  fontSize: "64px",
                  animation: "bounce 1.5s ease-in-out infinite",
                  marginBottom: "16px",
                  lineHeight: 1,
                }}
              >
                {DETECTION_STAGES[currentStage]?.icon}
              </div>
              <h3 style={{ color: COLORS.primary, fontWeight: 700, margin: "0 0 8px 0", fontSize: "18px" }}>
                {DETECTION_STAGES[currentStage]?.label}
              </h3>
              <p style={{ color: COLORS.textLight, fontSize: "13px", margin: 0 }}>
                Powered by YOLO Detection
              </p>
            </div>

            {/* Progress Steps */}
            <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
              {DETECTION_STAGES.map((stage, idx) => (
                <div
                  key={idx}
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    background: idx <= currentStage ? COLORS.primary : COLORS.border,
                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    transform: idx <= currentStage ? "scale(1.2)" : "scale(1)",
                  }}
                />
              ))}
            </div>

            {/* Loading Text */}
            <p style={{ color: COLORS.secondary, fontSize: "12px", marginTop: "20px", marginBottom: 0, fontWeight: 500, letterSpacing: "0.5px" }}>
              Processing your image...
            </p>
          </div>
        </>
      )}

      {/* TOAST */}
      {toast.show && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            padding: "14px 18px",
            borderRadius: "8px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            zIndex: 2001,
            minWidth: "280px",
            background:
              toast.type === "success"
                ? COLORS.success
                : toast.type === "danger"
                ? COLORS.delete
                : COLORS.warning,
            color: toast.type === "warning" ? COLORS.text : "#fff",
            fontWeight: 500,
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            animation: "slideInUp 0.3s ease-out",
          }}
        >
          <span style={{ fontSize: "18px" }}>
            {toast.type === "success" ? "✓" : toast.type === "danger" ? "✕" : "⚠"}
          </span>
          {toast.message}
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInScale {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        .spinner-border {
          width: 1rem;
          height: 1rem;
          border-width: 0.2em;
        }

        @media (max-width: 576px) {
          header {
            padding: 12px 16px !important;
          }
          
          h2 {
            font-size: 18px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default UserDepositPage;
