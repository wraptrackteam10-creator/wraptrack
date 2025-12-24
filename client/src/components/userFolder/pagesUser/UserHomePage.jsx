import { NavLink } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../usercss/imageStyle.css";

function UserHomePage() {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const [items, setItems] = useState([]);
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const user = JSON.parse(localStorage.getItem("user"));

  const cardsRef = useRef({});

  // Fetch user items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/items`);
        const data = await res.json();
        if (res.ok) {
          const userItems = data.filter(
            (item) =>
              item.userId?._id === user?.id &&
              item.action !== "Archive" &&
              item.status !== "Claimed"
          );
          setItems(userItems);
        } else {
          console.error("Failed to fetch items:", data.error);
        }
      } catch (error) {
        console.error("Error fetching items:", error);
      }
    };
    if (user) fetchItems();
  }, [user]);

  // Compute remaining time before penalty
  const getPenaltyTime = (status) => {
    if (status === "Unclaimed" || status === "Penalized") {
      return "⚠️ Item already penalized.";
    } else if (status === "Pending Verification") {
      return "Waiting for Verification";
    }

    const now = new Date();
    const penaltyTime = new Date();
    penaltyTime.setHours(22, 0, 0, 0);
    const diff = penaltyTime - now;

    if (diff <= 0) return "⚠️ Item already penalized";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    return `${hours}h ${minutes}m remaining before penalty`;
  };

  // Toggle details
  const handleViewDetails = (id) => {
    setExpandedItemId((prevId) => (prevId === id ? null : id));
  };

  // Close detail when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!expandedItemId) return;
      const cardElement = cardsRef.current[expandedItemId];
      if (cardElement && !cardElement.contains(e.target)) {
        setExpandedItemId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [expandedItemId]);

  return (
    <div
      className="d-flex flex-column"
      style={{ height: "100%", overflow: "hidden" }} // full height of Outlet
    >
      {/* FIXED HEADER */}
      <div
        className="text-center py-4 bg-dark text-white shadow-sm"
        style={{ position: "sticky", top: 0, zIndex: 10 }}
      >
        <h3 className="fw-bold mb-0">My Items Dashboard</h3>
        <small>
          Welcome back, {user?.firstname || "User"}{" "}
          <span className="wave-hand">👋</span>
        </small>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div
        style={{ flexGrow: 1, overflowY: "auto" }}
        className="bg-light"
      >
        {/* Buttons */}
        <div className="d-flex justify-content-center gap-4 p-3 flex-wrap">
          <NavLink to="/user/deposit">
            <button className="btn btn-outline-dark px-4 py-2 rounded-pill shadow-sm">
              <i className="bi bi-camera me-2"></i> Scan Item
            </button>
          </NavLink>
          <NavLink to="/user/claim">
            <button className="btn btn-dark px-4 py-2 rounded-pill shadow-sm">
              <i className="bi bi-box-arrow-up me-2"></i> Claim Item
            </button>
          </NavLink>
        </div>

        {/* Items List */}
        <div className="d-flex flex-nowrap align-items-start overflow-auto px-3 pb-4 mt-1 pt-2">
          {items.length > 0 ? (
            items.map((item) => (
              <div
                key={item._id}
                ref={(el) => (cardsRef.current[item._id] = el)}
                className="card me-3 shadow border-1 rounded-4"
                style={{
                  minWidth: "240px",
                  maxWidth: "240px",
                  flex: "0 0 auto",
                  transition:
                    "transform 0.2s ease, box-shadow 0.2s ease, height 0.3s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "translateY(-6px)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "translateY(0)")
                }
              >
                {/* Image */}
                <div
                  style={{
                    width: "100%",
                    height: "280px",
                    position: "relative",
                    overflow: "hidden",
                    borderTopLeftRadius: "1rem",
                    borderTopRightRadius: "1rem",
                    cursor: "pointer",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(item.photoUrl || "/logo.png");
                  }}
                >
                  <img
                    src={item.photoUrl || "/logo.png"}
                    alt="Item"
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transform: "translate(-50%, -50%)",
                      borderTopLeftRadius: "1rem",
                      borderTopRightRadius: "1rem",
                    }}
                  />

                  {item.status === "Unclaimed" && (
                    <button
                      className="btn btn-sm btn-danger position-absolute border-dark rounded-circle"
                      style={{
                        top: "10px",
                        right: "10px",
                        width: "32px",
                        height: "32px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                      }}
                      title="Remove this item"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (
                          window.confirm(
                            "Are you sure you want to archive this item?"
                          )
                        ) {
                          const res = await fetch(
                            `${API_BASE_URL}/api/items/${item._id}/action`,
                            {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ action: "Archive" }),
                            }
                          );
                          if (res.ok) {
                            alert("Item moved to archive.");
                            setItems((prev) =>
                              prev.filter((i) => i._id !== item._id)
                            );
                          } else {
                            alert("Failed to move item.");
                          }
                        }
                      }}
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  )}
                </div>

                {/* Card Content */}
                <div className="card-body">
                  <h6
                    className={`fw-bold mb-2 text-dark ${
                      expandedItemId === item._id ? "" : "fixed-description"
                    }`}
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp:
                        expandedItemId === item._id ? "none" : 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {item.description || "No description"}
                  </h6>

                  <p className="mb-1 small">
                    <strong>Owner:</strong> {user?.firstname}{" "}
                    {user?.lastname}
                  </p>

                  <span
                    className={`badge px-3 py-2 rounded-pill ${
                      item.status === "Unclaimed"
                        ? "bg-danger-subtle text-danger fw-semibold"
                        : item.status === "Pending Verification"
                        ? "bg-warning-subtle text-warning fw-semibold"
                        : "bg-primary-subtle text-primary fw-semibold"
                    }`}
                  >
                    {item.status}
                  </span>

                  {item.status === "Unclaimed" && (
                    <span className="ms-2 text-danger small">
                      <i className="bi bi-exclamation-triangle-fill"></i>{" "}
                      Penalty
                    </span>
                  )}

                  {expandedItemId === item._id && (
                    <div
                      className="mt-3 border-top pt-2"
                      style={{ animation: "fadeIn 0.3s ease-in-out" }}
                    >
                      <small className="text-muted d-block mb-2">
                        <strong>Date: </strong>
                        {new Date(item.createdAt).toLocaleString([], {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </small>
                      <p className="mb-1 small text-muted">
                        <i className="bi bi-clock me-1" />{" "}
                        {getPenaltyTime(item.status)}
                      </p>
                    </div>
                  )}

                  <div className="mt-3 d-grid">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(item._id);
                      }}
                      className="btn btn-outline-dark rounded-pill"
                    >
                      {expandedItemId === item._id
                        ? "Hide Details"
                        : "View Details"}
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted w-100 mt-5">
              <i className="bi bi-box-seam display-4 d-block mb-3"></i>
              <h6>No items found yet</h6>
              <p className="small">
                Start by scanning or claiming your items above.
              </p>
            </div>
          )}
        </div>

        {/* Fullscreen Image Viewer */}
        {selectedImage && (
          <div
            className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-75 d-flex align-items-center justify-content-center"
            style={{ zIndex: 1050, cursor: "zoom-out" }}
            onClick={() => setSelectedImage(null)}
          >
            <img
              src={selectedImage}
              alt="Full View"
              className="rounded shadow-lg"
              style={{
                maxWidth: "90%",
                maxHeight: "90%",
                objectFit: "contain",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default UserHomePage;
