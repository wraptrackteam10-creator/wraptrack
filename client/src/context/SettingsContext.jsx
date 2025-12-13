import { createContext, useContext, useEffect, useState } from "react";

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load settings once
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/settings`);
        const data = await res.json();
        setSettings(data);
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
      setLoading(false);
    };
    loadSettings();
  }, [API_BASE_URL]);

  // Allow updates from Settings page
  const updateSettings = async (newSettings) => {
    setSettings(newSettings);

    await fetch(`${API_BASE_URL}/api/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSettings),
    });
  };

  const refreshSettings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/settings`);
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      console.error("Failed to refresh settings:", err);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
