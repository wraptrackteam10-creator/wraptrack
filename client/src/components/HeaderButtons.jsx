// src/components/HeaderButtons.jsx
import React, { useEffect, useState } from "react";

function HeaderButtons() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Listen for PWA install prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
  };

  const handleHelpClick = () => {
    alert(
      "Help Guide:\n\n- Enter your username and password.\n- Admins, students, visitors, faculty, and guards have different dashboards.\n- Click 'Install' to add this app to your home screen (PWA)."
    );
  };

  return (
    <div style={{ position: "fixed", top: 10, right: 10, zIndex: 1000, display: "flex", gap: "10px" }}>
      <button className="btn btn-secondary" onClick={handleHelpClick} title="Help">
        ?
      </button>
      {deferredPrompt && (
        <button className="btn btn-success" onClick={handleInstallClick} title="Install App">
          Install
        </button>
      )}
    </div>
  );
}

export default HeaderButtons;
