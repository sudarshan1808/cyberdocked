import React from "react";
import { useNavigate } from "react-router-dom";

export default function ContentCard({
  item,
  showMatch = false,
  onToggleWatchlist,
  inWatchlist,
}) {
  const navigate = useNavigate();
  const assetSrc = (p) => {
    if (!p) return "";
    return p.startsWith("/") ? p : `/${p}`;
  };

  return (
    <div className="content-card">
      <img src={assetSrc(item.image)} alt="" />
      <div className="card-body">
        <h3>{item.title}</h3>
        {showMatch && (
          <>
            <p className="match-score">
              Match: {item.matchScore}%{" "}
              <span className={`confidence ${item.confidence}`}>{item.confidence}</span>
            </p>
            <div className="match-bar">
              <div
                className="match-fill"
                style={{
                  width: `${item.matchScore}%`,
                  background: "linear-gradient(90deg,var(--accent-blue),var(--accent-red))",
                  height: "8px",
                  borderRadius: "6px",
                }}
              />
            </div>
            <p>
              Recommended because you like <b>{item.reason || "similar genres"}</b>
            </p>
          </>
        )}
        <p>{item.description}</p>
        <div className="card-actions">
          <button
            type="button"
            className="detail-btn"
            onClick={() => navigate(`/details/${item.id}`)}
          >
            Details
          </button>
          <button
            type="button"
            className={`watchlist-btn ${inWatchlist ? "added" : ""}`}
            onClick={() => onToggleWatchlist?.(item.id)}
          >
            {inWatchlist ? "✔ Added" : "+ MyList"}
          </button>
        </div>
      </div>
    </div>
  );
}
