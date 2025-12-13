import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { LuCamera, LuImage } from "react-icons/lu";

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

  const user = JSON.parse(localStorage.getItem("user"));

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
        const res = await fetch(`${API_BASE_URL}/api/settings`);
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
    return <div className="text-center mt-5">Loading settings...</div>;
  }

  if (!settings?.studentAccess) {
    return (
      <div className="text-center mt-5">
        <h4 className="text-danger">🚫 Deposit Feature Disabled</h4>
        <p className="text-secondary small">The admin has turned OFF the deposit feature.</p>
        <p className="text-secondary small">Please contact Admin.</p>
        <button className="btn btn-primary mt-3" onClick={() => navigate(-1)}>
          Go Back
        </button>
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
      const res = await fetch("http://192.168.1.17:5000/predict", {
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
      const res = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST",
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
    <div className="min-vh-100 d-flex flex-column bg-light position-relative">
      {/* FIXED HEADER */}
      <div
        className="text-center py-4 bg-dark text-white shadow-sm"
        style={{ position: "sticky", top: 0, zIndex: 10 }}
      >
        <h3 className="fw-bold d-flex align-items-center justify-content-center gap-2">
          <LuCamera size={22} /> Item Deposit
        </h3>
        <small>Scan or upload your item for storage</small>
      </div>

      {/* SCROLLABLE MAIN */}
      <div className="flex-grow-1 overflow-auto p-3">
        <div
          className="card border-0 shadow-sm p-4 mx-auto"
          style={{ maxWidth: "500px", borderRadius: "18px" }}
        >
          {/* Upload Buttons */}
          <div className="d-flex justify-content-around mb-4">
            <label className="btn btn-dark col-5 d-flex align-items-center justify-content-center gap-2">
              <LuImage size={18} /> Upload
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleCapture}
              />
            </label>

            <label className="btn btn-dark col-5 d-flex align-items-center justify-content-center gap-2">
              <LuCamera size={18} /> Scan
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
                className="btn btn-outline-dark btn-sm mb-2 rounded-pill"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? "Hide Preview ▲" : "Show Preview ▼"}
              </button>

              {showPreview && (
                <img
                  src={image}
                  alt="Preview"
                  className="img-fluid rounded shadow"
                  style={{ maxHeight: "250px", objectFit: "contain" }}
                />
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Item Description</label>
              <input
                type="text"
                value={description}
                readOnly
                className="form-control border-dark"
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Depositor</label>
              <input
                type="text"
                value={`${user.firstname} ${user.lastname}`}
                disabled
                className="form-control border-dark"
              />
            </div>

            <div className="row">
              <div className="col-6 mb-3">
                <label className="form-label fw-semibold">Date</label>
                <input
                  type="text"
                  value={new Date().toLocaleDateString()}
                  disabled
                  className="form-control border-dark"
                />
              </div>
              <div className="col-6 mb-3">
                <label className="form-label fw-semibold">Time</label>
                <input
                  type="text"
                  value={new Date().toLocaleTimeString()}
                  disabled
                  className="form-control border-dark"
                />
              </div>
            </div>

            <div className="d-flex justify-content-around mt-4">
              <button
                type="submit"
                className="btn btn-success col-5 fw-bold"
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
                className="btn btn-danger col-5 fw-bold"
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
          className={`position-fixed bottom-0 end-0 m-3 p-3 rounded shadow ${
            toast.type === "success"
              ? "bg-success text-white"
              : toast.type === "danger"
              ? "bg-danger text-white"
              : "bg-warning text-dark"
          }`}
          style={{ zIndex: 2000, minWidth: "250px" }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default UserDepositPage;
