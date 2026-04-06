import React from "react";
import { Link } from "react-router-dom";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <Link to="/conditions">Conditions of Use</Link>
        <Link to="/privacy">Privacy Policy</Link>
        <Link to="/about">About Us</Link>
        <Link to="/help">Help</Link>
      </div>
      <p className="footer-copy">© 2026 CyberFlix. All rights reserved.</p>
    </footer>
  );
}
