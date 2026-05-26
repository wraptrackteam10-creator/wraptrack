import LandingPage from "./components/landingpage/LandingPage";
import Login from "./components/loginpage/Login";
import Signup from "./components/signuppage/Signup";
import ForgotPassword from "./components/loginpage/ForgotPassword";

import DashboardAdmin from "./components/adminFolder/DashboardAdmin";
import UserManagement from "./components/adminFolder/pages/UserManagement";
import ItemManagement from "./components/adminFolder/pages/ItemManagement";
import Reports from "./components/adminFolder/pages/Reports";
import Settings from "./components/adminFolder/pages/Settings";
import Summary from "./components/adminFolder/pages/Summary";
import AddAccount from "./components/adminFolder/pages/AddAccount";

import DashboardUser from "./components/userFolder/DashboardUser";
import UserHomePage from "./components/userFolder/pagesUser/UserHomePage";
import UserDepositPage from "./components/userFolder/pagesUser/UserDepositPage";
import UserClaimPage from "./components/userFolder/pagesUser/UserClaimPage";
import UserHistoryLog from "./components/userFolder/pagesUser/UserHistoryLog";

import DashboardGuard from "./components/guardFolder/DashboardGuard";
import GuardHomePage from "./components/guardFolder/pagesGuard/GuardHomePage";
import GuardItemManagement from "./components/guardFolder/pagesGuard/GuardItemManagement";
import GuardHistoryLog from "./components/guardFolder/pagesGuard/GuardHistoryLog";

// import { SettingsProvider } from "./context/SettingsContext";

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";

function App() {
  const [sessionExpired, setSessionExpired] = useState(false);
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    const handler = () => setSessionExpired(true);
    window.addEventListener("session-expired", handler);

    return () => window.removeEventListener("session-expired", handler);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/logout`, {
        method: "POST",
        credentials: "include",
      });
    }catch (error) {
      console.error("Logout error", error);
    };

    localStorage.removeItem("user");
    window.location.href = "/sign-in";
  };
  
  return (
    <>
    {sessionExpired && (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
        }}
      >
        <div
          style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "8px",
            width: "300px",
            textAlign: "center",
          }}
        >
          <h5>Session Expired</h5>
          <p>Please login again.</p>
          <button
            onClick={() => {
              handleLogout();
            }}
            className="btn btn-primary"
          >
            OK
          </button>
        </div>
      </div>
    )}

    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/sign-in" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/sign-up" element={<Signup />} />

        <Route path="/admin/*" element={<DashboardAdmin />}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<Summary />} />
          <Route path="user-management" element={<UserManagement />} />
          <Route path="item-management" element={<ItemManagement />} />
          <Route path="reports" element={<Reports />} />
          <Route path="add-account" element={<AddAccount />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        
        <Route path="/user/*" element={<DashboardUser />}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<UserHomePage />} />
          <Route path="deposit" element={<UserDepositPage />} />
          <Route path="claim" element={<UserClaimPage />}/>
          <Route path="history" element={<UserHistoryLog />} />
        </Route>

        <Route path="/guard/*" element={<DashboardGuard />}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<GuardHomePage />} />
          <Route path="item-management" element={<GuardItemManagement />} />
          <Route path="history-log" element={<GuardHistoryLog />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;
