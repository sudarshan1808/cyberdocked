import React from "react";
import { Link } from "react-router-dom";

const PAGES = {
  help: {
    title: "Help Center",
    body: (
      <>
        <p>Use the preference sliders to generate recommendations.</p>
        <p>Click “Details” to see more information.</p>
        <p>Use search to quickly find specific titles.</p>
      </>
    ),
  },
  privacy: {
    title: "Privacy Policy",
    body: (
      <>
        <p>We respect your privacy.</p>
        <p>CyberFlix does not sell or share your personal data.</p>
        <p>
          Signed-in users: account email and watchlist are stored securely in our database. Guests:
          watchlist is stored in your browser.
        </p>
      </>
    ),
  },
  about: {
    title: "About CyberFlix",
    body: (
      <>
        <p>CyberFlix is a personalized content recommendation platform.</p>
        <p>We help users discover movies, shows, and anime based on preferences.</p>
        <p>Built with MongoDB, Express, React, Node.js, and Chart.js.</p>
      </>
    ),
  },
  conditions: {
    title: "Conditions of Use",
    body: (
      <>
        <p>By accessing CyberFlix, you agree to comply with our terms and conditions.</p>
        <p>All content is for personal, non-commercial use only.</p>
        <p>Unauthorized reproduction or redistribution is prohibited.</p>
      </>
    ),
  },
};

export default function StaticPage({ page }) {
  const cfg = PAGES[page];
  if (!cfg) return null;
  return (
    <>
      <header className="site-header">
        <div className="logo">
          <Link to="/">
            <img src="/logo/CYBERFLIX MAIN PAGE LOGO.png" alt="CyberFlix Logo" />
          </Link>
        </div>
        <nav>
          <Link to="/">Home</Link>
        </nav>
      </header>
      <section className="content">
        <h2>{cfg.title}</h2>
        {cfg.body}
      </section>
    </>
  );
}
