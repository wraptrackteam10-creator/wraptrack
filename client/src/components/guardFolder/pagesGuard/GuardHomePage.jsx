import { useEffect, useState } from "react";
import { GiClockwork } from "react-icons/gi";

function GuardHomePage() {
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

    const [summary, setSummary] = useState({
        deposited: 0,
        claimed: 0,
        pending: 0,
    });

    const [recent, setRecent] = useState([]);

    /* FETCH SUMMARY */
    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/items/summary`);
                const data = await res.json();
                setSummary(data);
            } catch (error) {
                console.error("Error fetching summary:", error);
            }
        };
        if (API_BASE_URL) fetchSummary();
    }, [API_BASE_URL]);

    /* FETCH RECENT ACTIVITY */
    useEffect(() => {
        const fetchAndBuildRecent = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/items`);
                const items = await res.json();
                if (!Array.isArray(items)) return setRecent([]);

                let events = [];

                items.forEach((it) => {
                    const userName =
                        `${(it.userId?.firstname || "").trim()} ${(it.userId?.lastname || "").trim()}`.trim() ||
                        "Unknown user";
                    const desc = it.description || "Item";

                    const pushEv = (when, type, text) => {
                        const ts = new Date(when);
                        if (!isNaN(ts)) {
                            events.push({
                                id: `${it._id}-${type}`,
                                itemId: it._id,
                                type,
                                status: type,
                                timestamp: ts,
                                text,
                            });
                        }
                    };

                    if (it.depositedAt)
                        pushEv(it.depositedAt, "Deposited", `${userName} deposited ${desc}`);

                    if (it.claimedAt)
                        pushEv(it.claimedAt, "Claimed", `${userName} claimed ${desc}`);

                    if (it.unclaimedAt)
                        pushEv(it.unclaimedAt, "Unclaimed", `${userName} was marked unclaimed (${desc})`);
                });

                events = events
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, 5);

                setRecent(events);
            } catch (error) {
                console.error("Error fetching recent:", error);
                setRecent([]);
            }
        };

        if (API_BASE_URL) fetchAndBuildRecent();
    }, [API_BASE_URL]);

    const currentDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const statusColor = (status) => {
        switch (status) {
            case "Claimed": return "#90EE90";
            case "Unclaimed": return "#F08080";
            default: return "#D4C9BE";
        }
    };

    const formatTime = (date) =>
        new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    return (
        <div
            style={{
                backgroundColor: "#F1EFEC",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                boxSizing: "border-box",
                overflow: "hidden",
            }}
        >
            {/* HEADER */}
            <div
                style={{
                    backgroundColor: "#fff",
                    border: "1px solid #D4C9BE",
                    borderRadius: 12,
                }}
                className="d-flex justify-content-between align-items-center mb-2 p-3"
            >
                <h4 className="m-0 fw-bold">Summary</h4>
                <span className="text-muted" style={{ color: "#030303" }}>{currentDate}</span>
            </div>

            {/* SUMMARY CARDS */}
            <div className="row g-2 mb-2 px-2">
                <div className="col-4">
                    <div style={cardStyle}>
                        <p style={cardTitle}>Deposited</p>
                        <span style={{ ...cardValue, color: "#345" }}>{summary.deposited}</span>
                    </div>
                </div>
                <div className="col-4">
                    <div style={cardStyle}>
                        <p style={cardTitle}>Claimed</p>
                        <span style={{ ...cardValue, color: "#90EE90" }}>{summary.claimed}</span>
                    </div>
                </div>
                <div className="col-4">
                    <div style={cardStyle}>
                        <p style={cardTitle}>Pending</p>
                        <span style={{ ...cardValue, color: "#FFD700" }}>{summary.pending}</span>
                    </div>
                </div>
            </div>

            {/* RECENT ACTIVITY HEADER */}
            <div
                style={{
                    backgroundColor: "#FFF",
                    border: "1px solid #D4C9BE",
                    borderRadius: 12,
                }}
                className="p-3 mb-2 mx-2"
            >
                <h6 className="m-0 fw-semibold d-flex align-items-center gap-2">
                    <GiClockwork /> Recent Activity
                </h6>
            </div>

            {/* RECENT LIST — DYNAMIC HEIGHT */}
            <div
                style={{
                    backgroundColor: "#FFF",
                    border: "1px solid #D4C9BE",
                    borderRadius: 16,
                    flexGrow: 1,
                    overflowY: "auto",
                }}
                className="mx-2"
            >
                {recent.length === 0 ? (
                    <div className="text-center p-3" style={{ color: "#BBB" }}>
                        No recent activity
                    </div>
                ) : (
                    recent.map((ev, idx) => (
                        <div
                            key={ev.id}
                            className="d-flex justify-content-between align-items-center p-3"
                            style={{
                                borderBottom: idx !== recent.length - 1 ? "1px solid #EEE" : "none",
                            }}
                        >
                            <div className="d-flex align-items-center gap-2">
                                <span
                                    style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: "50%",
                                        backgroundColor: statusColor(ev.status),
                                    }}
                                />
                                <div>
                                    <div style={{ fontWeight: 600 }}>{ev.text}</div>
                                    <div style={{ color: "#AAA", fontSize: 13 }}>
                                        {ev.type} · {ev.timestamp.toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                            <small style={{ color: "#AAA" }}>{formatTime(ev.timestamp)}</small>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

/* STYLES */
const cardStyle = {
    backgroundColor: "#FFF",
    border: "1px solid #D4C9BE",
    borderRadius: 16,
    padding: "14px 8px",
    textAlign: "center",
};

const cardTitle = {
    marginBottom: 4,
    fontSize: "0.85rem",
    color: "#030303",
    fontWeight: 600,
};

const cardValue = {
    fontSize: 22,
    fontWeight: 700,
};

export default GuardHomePage;
