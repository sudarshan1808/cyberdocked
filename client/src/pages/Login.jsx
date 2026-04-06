import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api, setToken } from "../api.js";
import "../styles/login-page.css";

export default function Login() {
  const navigate = useNavigate();
  const { login, register, isAuthenticated, setUser } = useAuth();
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      if (mode === "login") {
        // Handle login
        try {
          await login(email, password);
          navigate("/");
        } catch (ex) {
          // Check if email verification is required
          if (ex.status === 403 && ex.data?.requiresVerification) {
            setErr("Please verify your email before logging in");
            setTimeout(() => navigate("/verify-email"), 2000);
          } else {
            setErr(ex.data?.error || ex.message || "Login failed");
          }
        }
      } else {
        // Handle registration
        try {
          const data = await api.register(username, email, password);
          // Store token temporarily (not verified yet)
          setToken(data.token);
          setUser(data.user);
          // Redirect to verification page instead of home
          navigate("/verify-email");
        } catch (ex) {
          setErr(ex.data?.error || ex.message || "Registration failed");
        }
      }
    } catch (ex) {
      setErr(ex.data?.error || ex.message || "Something went wrong");
    }
  };

  return (
    <div className="login-route">
      <div className="login-container">
        <div className="left-panel">
          <div className="branding">
            <h1>CYBERFLIX</h1>
          </div>
          <div className="left-content">
            <h2>SIGN IN TO YOUR</h2>
            <span>ADVENTURE</span>
          </div>
        </div>

        <div className="right-panel">
          <div className="form-box">
            <h1>{mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}</h1>
            <p className="subtext">Access your CyberFlix dashboard</p>
            {err && <p style={{ color: "#ff4c6a", marginBottom: 12 }}>{err}</p>}
            <form onSubmit={onSubmit}>
              {mode === "register" && (
                <input
                  type="text"
                  placeholder="Username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              )}
              <input
                type="email"
                placeholder="Email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="submit" className="primary-btn">
                {mode === "login" ? "Sign In" : "Register"}
              </button>
            </form>

            <button
              type="button"
              className="primary-btn"
              style={{ marginTop: 12, background: "linear-gradient(90deg,#00bfff,#32e0ff)", color: "#050a14" }}
              onClick={() => setMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Need an account? Register" : "Have an account? Sign In"}
            </button>

            <div className="divider">or continue with</div>

            <div className="social-login">
              <button type="button" className="google" onClick={() => navigate("/")}>
                Google
              </button>
              <button type="button" className="facebook" onClick={() => navigate("/")}>
                Facebook
              </button>
            </div>

            <p className="terms">
              By continuing you agree to our <span>Terms & Conditions</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
