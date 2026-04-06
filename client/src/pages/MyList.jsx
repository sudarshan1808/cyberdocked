import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import ContentCard from "../components/ContentCard.jsx";
import { useContent } from "../context/ContentContext.jsx";
import { useWatchlist } from "../hooks/useWatchlist.js";

export default function MyList() {
  const navigate = useNavigate();
  const { contentData, loading } = useContent();
  const { ids, toggle } = useWatchlist();

  const items = useMemo(() => {
    return contentData.filter((item) => ids.includes(String(item.id)));
  }, [contentData, ids]);

  if (loading) {
    return (
      <div className="content" style={{ paddingTop: 120 }}>
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <>
      <header className="site-header">
        <div className="logo">
          <Link to="/">
            <img src="/logo/CYBERFLIX MAIN PAGE LOGO.png" alt="CyberFlix Logo" />
          </Link>
        </div>
        <button type="button" className="back-btn" onClick={() => window.history.back()}>
          ← Back
        </button>
      </header>

      <section className="content">
        <h2>My Watchlist</h2>
        <div id="myListGrid" className="card-grid">
          {!ids.length ? (
            <h3>Your watchlist is empty</h3>
          ) : (
            items.map((i) => (
              <div key={i.id} className="content-card">
                <img src={i.image} alt="" />
                <div className="card-body">
                  <h3>{i.title}</h3>
                  <div className="card-actions">
                    <button type="button" className="remove-btn" onClick={() => toggle(i.id)}>
                      Remove
                    </button>
                    <button
                      type="button"
                      className="detail-btn"
                      onClick={() => navigate(`/details/${i.id}`)}
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
