import React, { useEffect, useMemo, useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

ChartJS.register(ArcElement, Tooltip, Legend);

const SLIDER_KEYS = ["action", "comedy", "horror", "thriller", "emotional"];
const SLIDER_COLORS = {
  action: "var(--action)",
  comedy: "var(--comedy)",
  horror: "var(--horror)",
  thriller: "var(--thriller)",
  emotional: "var(--emotional)",
};

function updateSliderStyle(sliderEl, value, colorVar) {
  if (!sliderEl) return;
  const v = Number(value);
  sliderEl.style.background = `linear-gradient(to right,
    ${colorVar} 0%,${colorVar} ${v}%,
    var(--track-bg) ${v}%,
    var(--track-bg) 100%)`;
}

const genreColors = {
  Action: "#FF1E3C",
  Comedy: "#FF9F40",
  Horror: "#0D0887",
  Thriller: "#8E44AD",
  Emotional: "#00BFFF",
};

const platformLogos = {
  netflix: "/6 Streaming platforms logos/netflix_logo.png",
  prime: "/6 Streaming platforms logos/amazon_prime_logo.png",
  hotstar: "/6 Streaming platforms logos/disney_hotstar_logo.png",
  zee5: "/6 Streaming platforms logos/zee5_logo.png",
  crunchyroll: "/6 Streaming platforms logos/crunchyroll_logo.png",
};

export default function Details() {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [item, setItem] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRatings, setUserRatings] = useState({
    action: 0,
    comedy: 0,
    horror: 0,
    thriller: 0,
    emotional: 0,
  });
  const [allRatings, setAllRatings] = useState([]);
  const [showRatings, setShowRatings] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ratingAverages, setRatingAverages] = useState({});
  const [submitMessage, setSubmitMessage] = useState("");
  const sliderRefs = useRef([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getContentById(id)
      .then((data) => {
        if (!cancelled) setItem(data);
      })
      .catch(() => {
        if (!cancelled) setError("Not found");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!item || !isAuthenticated || !user) return;
    // Load user's existing rating
    api
      .getRatings(item.id)
      .then((ratings) => {
        const userRating = ratings.find((r) => r.userId._id === user.id);
        if (userRating) {
          setUserRatings(userRating.ratings);
        }
      })
      .catch(() => {
        // Ignore errors for ratings
      });
  }, [item, isAuthenticated, user]);

  useEffect(() => {
    SLIDER_KEYS.forEach((key, i) => {
      updateSliderStyle(sliderRefs.current[i], userRatings[key], SLIDER_COLORS[key]);
    });
  }, [userRatings]);

  const submitRating = async () => {
    if (!item || !isAuthenticated) return;
    setSubmitting(true);
    setSubmitMessage("");
    try {
      await api.submitRating(item.id, userRatings);
      setSubmitMessage("Rating submitted successfully!");
      setTimeout(() => setSubmitMessage(""), 3000);
    } catch (err) {
      console.error("Failed to submit rating:", err);
      setSubmitMessage("Failed to submit rating. Please try again.");
      setTimeout(() => setSubmitMessage(""), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const loadAllRatings = async () => {
    if (!item) return;
    try {
      const ratings = await api.getRatings(item.id);
      setAllRatings(ratings);
      setShowRatings(true);

      // Calculate averages
      if (ratings.length > 0) {
        const averages = {};
        SLIDER_KEYS.forEach((key) => {
          const sum = ratings.reduce((acc, r) => acc + r.ratings[key], 0);
          averages[key] = Math.round(sum / ratings.length);
        });
        setRatingAverages(averages);
      } else {
        setRatingAverages({});
      }
    } catch (err) {
      console.error("Failed to load ratings:", err);
    }
  };

  const chartData = useMemo(() => {
    if (!item?.genres) return null;
    const labels = Object.keys(item.genres);
    const values = Object.values(item.genres).map(Number);
    const colors = labels.map((label) => genreColors[label] || "#888");
    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
        },
      ],
    };
  }, [item]);

  if (loading) {
    return (
      <div className="content" style={{ paddingTop: 120 }}>
        <p>Loading…</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="content" style={{ paddingTop: 120 }}>
        <p>{error || "Not found"}</p>
        <Link to="/">Back home</Link>
      </div>
    );
  }

  const meta = [item.type, item.runtime, item.Release_Date, item.Age].filter(Boolean);
  const assetSrc = (p) => {
    if (!p) return "";
    return p.startsWith("/") ? p : `/${p}`;
  };

  return (
    <>
      <header className="site-header">
        <div className="detail-logo">
          <Link to="/">
            <img src="/logo/cyberflix details page logo new.png" alt="Cyberflix Logo" />
          </Link>
        </div>
      </header>

      <section
        className="details-page"
        style={{
          backgroundImage: `url('${assetSrc(item.image)}')`,
        }}
      >
        <section className="details-hero">
          <div className="details-hero-overlay">
            <div className="details-hero-content">
              {item.heroLogo ? (
                <img
                  className="detail-logo"
                  src={assetSrc(item.heroLogo)}
                  alt=""
                  style={{ display: "block" }}
                />
              ) : (
                <h1 style={{ display: "block" }}>{item.title}</h1>
              )}
              <p id="detailMeta">{meta.join(" | ")}</p>
              <div id="detailRatings" className="ratings">
                {item.imdb && (
                  <div className="rating">
                    <img src="/ratings logo/imdb_logo.png" className="rating-logo" alt="" />
                    <span>{item.imdb}</span>
                  </div>
                )}
                {item.rottenTomatoes && (
                  <div className="rating">
                    <img src="/ratings logo/rotten_tomatoes_logo.png" className="rating-logo" alt="" />
                    <span>{item.rottenTomatoes}</span>
                  </div>
                )}
                {item.ign && (
                  <div className="rating">
                    <img src="/ratings logo/ign_logo.png" className="rating-logo" alt="" />
                    <span>{item.ign}</span>
                  </div>
                )}
              </div>
              <h3 className="watch-title">Available On:</h3>
              <div id="streamingPlatforms" className="streaming-platforms">
                {(item.platforms || []).map((p) => (
                  <img key={p} src={platformLogos[p]} className="platform-logo" alt={p} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="details-content">
          <div className="details-container">
            <div className="details-left">
              <p id="detailDescription">{item.description}</p>
              <div id="detailReviews" className="reviews-box">
                {item.reviews?.length > 0 && (
                  <>
                    <h3>Reviews</h3>
                    <ul>
                      {item.reviews.map((r, idx) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
              {isAuthenticated && (
                <div className="rating-section">
                  <h3>Rate this {item.type}</h3>
                  <div className="sliders">
                    {SLIDER_KEYS.map((key, idx) => (
                      <div className="slider-group" key={key}>
                        <label>
                          {key.charAt(0).toUpperCase() + key.slice(1)}: <span>{userRatings[key]}</span>%
                        </label>
                        <input
                          ref={(el) => {
                            sliderRefs.current[idx] = el;
                            if (el) {
                              updateSliderStyle(el, userRatings[key], SLIDER_COLORS[key]);
                            }
                          }}
                          type="range"
                          min={0}
                          max={100}
                          value={userRatings[key]}
                          onChange={(e) =>
                            setUserRatings((p) => ({ ...p, [key]: Number(e.target.value) }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <button onClick={submitRating} disabled={submitting} className="primary-btn">
                    {submitting ? "Submitting..." : "Submit Rating"}
                  </button>
                  {submitMessage && <p className="submit-message">{submitMessage}</p>}
                </div>
              )}
              <button onClick={loadAllRatings} className="primary-btn">
                Show All Ratings
              </button>
              {showRatings && (
                <div className="all-ratings">
                  <h3>All User Ratings</h3>
                  {allRatings.length === 0 ? (
                    <p>No ratings yet.</p>
                  ) : (
                    <>
                      <div className="rating-averages">
                        <h4>Average Ratings:</h4>
                        <div className="averages-list">
                          {SLIDER_KEYS.map((key) => (
                            <div key={key} className="average-item">
                              <span className="average-label">{key.charAt(0).toUpperCase() + key.slice(1)}:</span>
                              <span className="average-value">{ratingAverages[key] || 0}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <ul>
                        {allRatings.map((rating) => (
                          <li key={rating._id}>
                            <div className="rating-user">
                              <img src={rating.userId.profilePicture || "/pic.jpg"} alt="" />
                              <span>{rating.userId.username}</span>
                            </div>
                            <div className="rating-values">
                              {SLIDER_KEYS.map((key) => (
                                <span key={key}>
                                  {key}: {rating.ratings[key]}%
                                </span>
                              ))}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="details-right">
              <div className="chart-row">
                <div className="chart-container">
                  {chartData && (
                    <Pie
                      data={chartData}
                      options={{
                        responsive: true,
                        plugins: { legend: { display: false } },
                      }}
                    />
                  )}
                </div>
                <div id="detailGenres" className="genre-stats">
                  {Object.entries(item.genres || {}).map(([genre, value]) => (
                    <div className="genre-item" key={genre}>
                      <div className="genre-label">
                        <span className={`genre-dot ${genre.toLowerCase()}`} />
                        {genre}
                      </div>
                      <span className="genre-percent">{value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </section>
    </>
  );
}
