import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { LuArrowLeft } from "react-icons/lu";
import { FaBoxOpen } from "react-icons/fa";

function UserClaimPage() {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const navigate = useNavigate();

  const [settings, setSettings] = useState(null);
  const [items, setItems] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const user = JSON.parse(localStorage.getItem("user"));
  const goBack = () => navigate(-1);

  // =============================
  // TOAST FUNCTION
  // =============================
  const showToast = (message, type = "success", duration = 3000) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), duration);
  };

  // ✅ Load settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/settings`);
        const data = await res.json();
        if (res.ok) setSettings(data);
        else showToast(data.error || "Failed to load settings", "danger");
      } catch (error) {
        console.error("Error loading settings:", error);
        showToast("Error loading settings", "danger");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [API_BASE_URL]);

  // ✅ Load user items
  useEffect(() => {
    const fetchItems = async () => {
      if (!user) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/items`);
        const data = await res.json();

        if (res.ok) {
          const userItems = data.filter(
            (item) =>
              item.userId?._id === user?.id &&
              (item.status === "Deposited" || item.status === "Pending Verification")
          );
          setItems(userItems);
        } else {
          showToast(data.error || "Failed to fetch items", "danger");
        }
      } catch (error) {
        console.error("Error fetching items:", error);
        showToast("Error fetching items", "danger");
      }
    };
    fetchItems();
  }, [user, API_BASE_URL]);

  // ✅ Handle claim request
  const handleClaim = async (itemId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/items/${itemId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Pending Verification" }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast("✅ Requested claim, waiting for verification!", "success");
        setItems((prev) =>
          prev.map((item) =>
            item._id === itemId ? { ...item, status: "Pending Verification" } : item
          )
        );
      } else {
        showToast(data.error || "❌ Failed to update status", "danger");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      showToast("⚠️ Server error while updating item.", "danger");
    }
  };

  if (loading) return <p className="text-center mt-5">Loading settings...</p>;

  const canClaim = settings?.studentAccess && !settings?.loginRestriction;

  return (
    <div className="min-vh-100 bg-light d-flex flex-column position-relative">
      {/* FIXED HEADER */}
      <div
        className="text-center py-4 bg-dark text-white shadow-sm"
        style={{ position: "fixed", top: 0, left: 0, width: "100%", zIndex: 1000 }}
      >
        <div className="d-flex align-items-center justify-content-between px-3">
          <button
            className="btn btn-link text-white p-0"
            onClick={goBack}
            style={{ textDecoration: "none" }}
          >
            <LuArrowLeft size={22} />
          </button>
          <h4 className="fw-bold mb-0 flex-grow-1 text-center">Claim Items</h4>
          <div style={{ width: "22px" }}></div>
        </div>
        <small>Manage your deposited items here</small>
      </div>

      {/* CONTENT */}
      <div
        className="container flex-grow-1 py-4"
        style={{
          marginTop: "100px",
          overflowY: "auto",
          maxHeight: "calc(100vh - 100px)",
        }}
      >
        {items.length > 0 ? (
          <div className="row g-4">
            {items.map((item) => (
              <div key={item._id} className="col-12 col-md-6">
                <div
                  className="card border-0 shadow-sm rounded-4 overflow-hidden h-100"
                  style={{
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    backgroundColor: "#fff",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.01)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  {/* IMAGE */}
                  <div
                    className="bg-secondary-subtle d-flex align-items-center justify-content-center"
                    style={{
                      height: "220px",
                      overflow: "hidden",
                      borderBottom: "1px solid #eee",
                      cursor: item.photo?.data ? "pointer" : "default",
                    }}
                    onClick={() =>
                      item.photo?.data &&
                      setSelectedImage(`${API_BASE_URL}/api/items/${item._id}/photo`)
                    }
                  >
                    {item.photo?.data ? (
                      <img
                        src={`${API_BASE_URL}/api/items/${item._id}/photo`}
                        alt="Item"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          objectPosition: "center",
                        }}
                      />
                    ) : (
                      <FaBoxOpen size={70} color="#6c757d" />
                    )}
                  </div>

                  {/* INFO */}
                  <div className="p-3 d-flex flex-column justify-content-between">
                    <div>
                      <h6 className="fw-bold text-dark mb-1">
                        {item.description || "No description"}
                      </h6>
                      <small className="text-muted d-block mb-2">
                        {new Date(item.createdAt).toLocaleString([], {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </small>
                    </div>

                    {/* CLAIM BUTTON */}
                    <div className="mt-2">
                      <button
                        className={`btn fw-semibold w-100 py-2 rounded-3 ${
                          !canClaim
                            ? "btn-secondary"
                            : item.status === "Pending Verification"
                            ? "btn-secondary"
                            : "btn-dark"
                        }`}
                        style={{
                          fontSize: "0.9rem",
                          transition: "0.2s",
                          cursor:
                            !canClaim || item.status === "Pending Verification"
                              ? "not-allowed"
                              : "pointer",
                        }}
                        onClick={() =>
                          canClaim &&
                          item.status !== "Pending Verification" &&
                          handleClaim(item._id)
                        }
                        disabled={!canClaim || item.status === "Pending Verification"}
                      >
                        {!canClaim
                          ? "⚠️ Claiming unavailable – contact admin"
                          : item.status === "Pending Verification"
                          ? "⏳ Verifying..."
                          : "Claim"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted mt-5">
            <FaBoxOpen size={60} className="mb-3" />
            <h6>No items to claim yet</h6>
            <p className="small">
              Items you deposited will appear here once verified.
            </p>
          </div>
        )}
      </div>

      {/* FULLSCREEN IMAGE VIEWER */}
      {selectedImage && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-75 d-flex align-items-center justify-content-center"
          style={{ zIndex: 2000, cursor: "zoom-out" }}
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Full View"
            className="rounded shadow-lg"
            style={{ maxWidth: "90%", maxHeight: "90%", objectFit: "contain" }}
          />
        </div>
      )}

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

export default UserClaimPage;
