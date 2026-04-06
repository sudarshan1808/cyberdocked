import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Details from "./pages/Details.jsx";
import MyList from "./pages/MyList.jsx";
import Login from "./pages/Login.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import Profile from "./pages/Profile.jsx";
import StaticPage from "./pages/StaticPage.jsx";
import { useAuth } from "./context/AuthContext.jsx";

export default function App() {
  const { ready } = useAuth();
  if (!ready) {
    return (
      <div className="content" style={{ paddingTop: 120 }}>
        <p>Loading…</p>
      </div>
    );
  }
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/details/:id" element={<Details />} />
      <Route path="/mylist" element={<MyList />} />
      <Route path="/login" element={<Login />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/help" element={<StaticPage page="help" />} />
      <Route path="/privacy" element={<StaticPage page="privacy" />} />
      <Route path="/about" element={<StaticPage page="about" />} />
      <Route path="/conditions" element={<StaticPage page="conditions" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
