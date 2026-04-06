import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import "../styles/verify-email.css";

export default function VerifyEmail() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (code.length !== 6) {
      setError("Please enter a 6-digit code");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("cyberflix_token");
      if (!token) {
        setError("Session expired. Please register again.");
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      const response = await api.verifyEmail(code);
      
      if (response) {
        setSuccess(true);
        setError("");
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    } catch (err) {
      setError(err.data?.error || "An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("cyberflix_token");
      if (!token) {
        setError("Session expired. Please register again.");
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      const response = await api.resendVerificationEmail();

      if (response) {
        setError("");
        alert("✓ New verification code sent! Check your email.");
      }
    } catch (err) {
      setError(err.data?.error || "Failed to resend verification email. Please try again.");
      console.error(err);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="verify-email-page">
      <div className="verify-email-container">
        <div className="verify-email-card">
          {/* Header */}
          <div className="verify-header">
            <div className="verify-icon">✉️</div>
            <h1>Verify Your Email</h1>
            <p>Check your inbox for the verification code</p>
          </div>

          {/* Success State */}
          {success && (
            <div className="success-message">
              <p>✓ Email verified successfully!</p>
              <p>Redirecting to home...</p>
            </div>
          )}

          {/* Form */}
          {!success && (
            <form onSubmit={handleVerify} className="verify-form">
              <div className="form-group">
                <label htmlFor="code">Verification Code</label>
                <input
                  id="code"
                  type="text"
                  maxLength="6"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="code-input"
                  disabled={loading || resendLoading}
                  autoComplete="off"
                  inputMode="numeric"
                />
                <small>Enter the 6-digit code sent to your email</small>
              </div>

              {/* Error Message */}
              {error && <div className="error-message">{error}</div>}

              {/* Verify Button */}
              <button
                type="submit"
                disabled={loading || code.length !== 6 || resendLoading}
                className="verify-btn"
              >
                {loading ? "Verifying..." : "Verify Email"}
              </button>
            </form>
          )}

          {/* Resend Link */}
          {!success && (
            <div className="resend-section">
              <p>Didn't receive the code?</p>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading || loading}
                className="resend-btn"
              >
                {resendLoading ? "Sending..." : "Resend Code"}
              </button>
              <small>Code expires in 10 minutes</small>
            </div>
          )}

          {/* Info Box */}
          <div className="info-box">
            <p>
              <strong>💡 Tip:</strong> Check your spam folder if you don't see
              the email
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
