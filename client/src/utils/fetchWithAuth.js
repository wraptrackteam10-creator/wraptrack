let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed() {
  refreshSubscribers.forEach((cb) => cb());
  refreshSubscribers = [];
}

export async function fetchWithAuth(url, options = {}) {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
  
  const makeRequest = () => fetch(url, { ...options, credentials: "include" });

  let res = await makeRequest();

  // 401 = token expired on server, need to refresh
  if (res.status === 401) {
    if (url.includes("/api/refresh") || url.includes("/api/logout")) {
      window.dispatchEvent(new Event("session-expired"));
      throw new Error("Session expired");
    }

    if (isRefreshing) {
      // Already refreshing, wait for it
      try {
        await new Promise((resolve) => {
          subscribeTokenRefresh(() => resolve());
        });
        res = await makeRequest();
        if (res.status === 401) {
          window.dispatchEvent(new Event("session-expired"));
          throw new Error("Session expired");
        }
        return res;
      } catch (err) {
        window.dispatchEvent(new Event("session-expired"));
        throw new Error("Session expired");
      }
    }

    isRefreshing = true;

    try {
      const refreshRes = await fetch(`${API_BASE_URL}/api/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (refreshRes.ok) {
        isRefreshing = false;
        onRefreshed();
        // Retry original request with new token
        res = await makeRequest();
        if (res.status === 401) {
          window.dispatchEvent(new Event("session-expired"));
          throw new Error("Session expired");
        }
        return res;
      } else {
        isRefreshing = false;
        window.dispatchEvent(new Event("session-expired"));
        throw new Error("Session expired");
      }
    } catch (err) {
      isRefreshing = false;
      window.dispatchEvent(new Event("session-expired"));
      throw new Error("Session expired");
    }
  }

  return res;
}