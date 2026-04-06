import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import SiteHeader from "../components/SiteHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import ContentCard from "../components/ContentCard.jsx";
import { useContent } from "../context/ContentContext.jsx";
import { useWatchlist } from "../hooks/useWatchlist.js";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";
import {
  calculateMatchScore,
  calculateRatingMatchScore,
  getConfidence,
  getTopMatchingGenres,
  getTopRatingGenres,
} from "../lib/recommend.js";
import { searchContent } from "../lib/search.js";

const HERO_TITLES = [
  "Spider-Man:No Way Home",
  "Game of Thrones",
  "Avengers: Endgame",
  "Inception",
];

const TRENDING_GRID_TITLES = [
  "Naruto Shippuden",
  "Avengers: Endgame",
  "Avengers: Infinity War",
  "The Dark Knight",
  "Inception",
  "Spider-Man:No Way Home",
  "The Batman",
  "Breaking Bad",
  "Game of Thrones",
  "Naruto",
  "Attack on Titan",
  "Death Note",
  "Demon Slayer",
];

const CATEGORY_ITEMS = [
  "anime",
  "sports",
  "drama",
  "horror",
  "action",
  "comedy",
  "emotional",
  "thriller",
];

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

function assetSrc(p) {
  if (!p) return "";
  return p.startsWith("/") ? p : `/${p}`;
}

export default function Home() {
  const { contentData, loading, error } = useContent();
  const { isAuthenticated } = useAuth();
  const { has, toggle } = useWatchlist();
  const navigate = useNavigate();

  const [heroIndex, setHeroIndex] = useState(0);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchTitle, setSearchTitle] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [contentHeader, setContentHeader] = useState("Trending Now");
  const [gridItems, setGridItems] = useState([]);
  const [categoryHeader, setCategoryHeader] = useState("");
  const [categoryItems, setCategoryItems] = useState([]);

  const [prefs, setPrefs] = useState({
    action: 0,
    comedy: 0,
    horror: 0,
    thriller: 0,
    emotional: 0,
  });
  const [typeFilters, setTypeFilters] = useState({
    Movie: true,
    Shows: true,
    Anime: true,
  });

  const filterBtnRef = useRef(null);
  const filterPopupRef = useRef(null);
  const preferencePanelRef = useRef(null);
  const sliderRefs = useRef([]);

  const heroList = useMemo(() => {
    return HERO_TITLES.map((t) => contentData.find((i) => i.title === t)).filter(Boolean);
  }, [contentData]);

  const heroItem = heroList[heroIndex] || null;

  useLayoutEffect(() => {
    if (!filterOpen) return;
    const position = () => {
      const btn = filterBtnRef.current;
      const panel = preferencePanelRef.current;
      const pop = filterPopupRef.current;
      if (!btn || !panel || !pop) return;
      const btnRect = btn.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const left = Math.max(8, btnRect.left - panelRect.left);
      const top = btnRect.bottom - panelRect.top + 8;
      pop.style.left = `${left}px`;
      pop.style.top = `${top}px`;
    };
    position();
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, [filterOpen]);

  useEffect(() => {
    SLIDER_KEYS.forEach((key, i) => {
      updateSliderStyle(sliderRefs.current[i], prefs[key], SLIDER_COLORS[key]);
    });
  }, [prefs]);

  const showTrending = useCallback(() => {
    const trending = TRENDING_GRID_TITLES.map((title) => contentData.find((i) => i.title === title))
      .filter(Boolean)
      .map((i) => ({
        ...i,
        matchScore: 100,
        confidence: "high",
        reason: "Trending",
      }));
    setGridItems(trending);
    setContentHeader("Trending Now");
  }, [contentData]);

  useEffect(() => {
    if (contentData.length) showTrending();
  }, [contentData, showTrending]);

  const onRecommend = () => {
    const user = prefs;
    const types = Object.keys(typeFilters).filter((k) => typeFilters[k]);
    const hasPreferences = Object.values(user).some((v) => v > 0);

    const scored = contentData
      .filter((i) => types.includes(i.type))
      .map((i) => {
        const s = calculateMatchScore(user, i.genres || {});
        const top = getTopMatchingGenres(user, i.genres || {});
        return {
          ...i,
          matchScore: s,
          confidence: getConfidence(s),
          reason: top.length > 0 ? top.join(" & ") : "popular content",
        };
      })
      .filter((i) => (hasPreferences ? i.matchScore > 0 : true))
      .sort((a, b) => b.matchScore - a.matchScore);

    setContentHeader("AI RATINGS MATCH");
    setGridItems(scored);
  };

  const onUserRatingsMatch = async () => {
    const user = prefs;
    const types = Object.keys(typeFilters).filter((k) => typeFilters[k]);
    const hasPreferences = Object.values(user).some((v) => v > 0);

    // Get ratings for all content
    const ratingsPromises = contentData.map(async (item) => {
      try {
        const ratings = await api.getRatings(item.id);
        if (ratings.length > 0) {
          const averages = {};
          SLIDER_KEYS.forEach((key) => {
            const sum = ratings.reduce((acc, r) => acc + r.ratings[key], 0);
            averages[key.charAt(0).toUpperCase() + key.slice(1)] = Math.round(sum / ratings.length);
          });
          return { ...item, userAverages: averages, hasUserRatings: true };
        }
        return null; // Only return content with user ratings
      } catch {
        return null; // Skip content where API fails
      }
    });

    const itemsWithRatings = (await Promise.all(ratingsPromises)).filter(Boolean);

    const scored = itemsWithRatings
      .filter((i) => types.includes(i.type))
      .map((i) => {
        const s = calculateRatingMatchScore(user, i.userAverages);
        const top = getTopRatingGenres(user, i.userAverages);
        return {
          ...i,
          matchScore: s,
          confidence: getConfidence(s),
          reason: top.length > 0 ? `${top.join(" & ")} (user rated)` : "user preferences",
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    setContentHeader("USER RATINGS MATCH");
    setGridItems(scored);
  };

  const onCategoryPick = (selected) => {
    const sel = selected.toLowerCase();
    const filtered = contentData.filter((content) => {
      if (sel === "anime") return content.type === "Anime";
      const genreKey = sel.charAt(0).toUpperCase() + sel.slice(1);
      return content.genres && content.genres[genreKey] > 0;
    });
    setCategoryHeader(sel.toUpperCase());
    setCategoryItems(filtered);
    setCategoriesOpen(false);
    document.getElementById("categorySection")?.scrollIntoView({ behavior: "smooth" });
  };

  const performSearch = (query) => {
    const q = query.trim();
    if (!q) return;
    const results = searchContent(contentData, q);
    setSearchTitle(`Search Results for "${q}"`);
    setSearchResults(results);
    setSearchVisible(true);
    document.getElementById("searchSection")?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setCategoriesOpen(false);
        setFilterOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!filterOpen) return;
    const onDoc = (e) => {
      if (filterPopupRef.current?.contains(e.target) || filterBtnRef.current?.contains(e.target)) {
        return;
      }
      setFilterOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [filterOpen]);

  if (loading) {
    return (
      <div className="content" style={{ paddingTop: 120 }}>
        <p>Loading…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="content" style={{ paddingTop: 120 }}>
        <p>{error}</p>
      </div>
    );
  }

  // The main grid is always either Trending or Recommended, and in the original
  // UI both show the match bar + score.
  const showMatch = true;

  return (
    <>
      <SiteHeader
        onCategoriesClick={() => setCategoriesOpen(true)}
        searchInput={searchInput}
        onSearchInput={setSearchInput}
        onSearchSubmit={() => performSearch(searchInput)}
      />

      <div
        className={`categories-popup ${categoriesOpen ? "open" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setCategoriesOpen(false);
        }}
      >
        <div className="categories-inner">
          <button type="button" onClick={() => setCategoriesOpen(false)}>
            ✕
          </button>
          <h3>Select Category</h3>
          <ul>
            {CATEGORY_ITEMS.map((c) => (
              <li key={c} data-category={c} onClick={() => onCategoryPick(c)}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section
        id="searchSection"
        className="content"
        style={{ display: searchVisible ? "block" : "none" }}
      >
        <h2>{searchTitle}</h2>
        <div className="card-grid">
          {searchResults.length === 0 ? (
            <p>No results found.</p>
          ) : (
            searchResults.map((i) => (
              <ContentCard
                key={i.id}
                item={i}
                showMatch={false}
                inWatchlist={has(i.id)}
                onToggleWatchlist={toggle}
              />
            ))
          )}
        </div>
      </section>

      <section
        className="hero"
        style={
          heroItem
            ? {
                background: `url('${assetSrc(heroItem.image)}') center/cover no-repeat`,
              }
            : undefined
        }
      >
        {heroItem && (
          <>
            <div className="overlay" onClick={() => navigate(`/details/${heroItem.id}`)}>
              <div className="content">
                {heroItem.heroLogo ? (
                  <>
                    <img
                      className="hero-logo"
                      src={assetSrc(heroItem.heroLogo)}
                      alt=""
                    />
                    <h1 style={{ display: "none" }}>{heroItem.title}</h1>
                  </>
                ) : (
                  <>
                    <h1 style={{ display: "block", textShadow: "0 0 20px rgba(0,191,255,0.6)" }}>
                      {heroItem.title}
                    </h1>
                  </>
                )}
                <span>{heroItem.type}</span>
                <p>{heroItem.description}</p>
              </div>
            </div>
            <button
              type="button"
              className="arrow left"
              onClick={() =>
                setHeroIndex((idx) => (idx <= 0 ? heroList.length - 1 : idx - 1))
              }
            >
              ❮
            </button>
            <button
              type="button"
              className="arrow right"
              onClick={() =>
                setHeroIndex((idx) => (idx >= heroList.length - 1 ? 0 : idx + 1))
              }
            >
              ❯
            </button>
          </>
        )}
      </section>

      <section className="preference-panel" ref={preferencePanelRef}>
        <h2>Choose Your Preferences</h2>
        <button
          type="button"
          ref={filterBtnRef}
          className="filter-toggle"
          aria-expanded={filterOpen}
          onClick={(e) => {
            e.stopPropagation();
            setFilterOpen((o) => !o);
          }}
        >
          Filter to your preference ▾
        </button>

        <div
          ref={filterPopupRef}
          className={`filter-pop ${filterOpen ? "open" : ""}`}
          aria-hidden={!filterOpen}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="filter-pop-inner" role="document" tabIndex={-1}>
            <div className="filter-caret" aria-hidden />
            <button
              type="button"
              className="filter-close"
              aria-label="Close Filters"
              onClick={() => setFilterOpen(false)}
            >
              ✕
            </button>

            <div className="sliders" id="sliders">
              {SLIDER_KEYS.map((key, idx) => (
                <div className="slider-group" key={key}>
                  <label>
                    {key.charAt(0).toUpperCase() + key.slice(1)}: <span>{prefs[key]}</span>%
                  </label>
                  <input
                    ref={(el) => {
                      sliderRefs.current[idx] = el;
                      if (el) {
                        updateSliderStyle(el, prefs[key], SLIDER_COLORS[key]);
                      }
                    }}
                    type="range"
                    min={0}
                    max={100}
                    value={prefs[key]}
                    onChange={(e) =>
                      setPrefs((p) => ({ ...p, [key]: Number(e.target.value) }))
                    }
                  />
                </div>
              ))}
            </div>

            <div className="type-filters">
              {["Movie", "Shows", "Anime"].map((t) => (
                <label key={t}>
                  <input
                    type="checkbox"
                    checked={typeFilters[t]}
                    onChange={(e) =>
                      setTypeFilters((f) => ({ ...f, [t]: e.target.checked }))
                    }
                  />{" "}
                  {t === "Movie" ? "Movies" : t === "Shows" ? "Shows" : "Anime"}
                </label>
              ))}
            </div>

            <div className="pop-actions">
              <button
                type="button"
                id="recommendBtn"
                onClick={() => {
                  onRecommend();
                  setFilterOpen(false);
                }}
              >
                AI Ratings Match
              </button>
              <button
                type="button"
                className="user-ratings-btn"
                onClick={() => {
                  onUserRatingsMatch();
                  setFilterOpen(false);
                }}
              >
                User Ratings Match
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="content">
        <h2 id="contentHeader">{contentHeader}</h2>
        <div id="cardGrid" className="card-grid">
          {gridItems.map((i) => (
            <ContentCard
              key={i.id}
              item={i}
              showMatch={showMatch}
              inWatchlist={has(i.id)}
              onToggleWatchlist={toggle}
            />
          ))}
        </div>
      </section>

      <section id="categorySection" className="content">
        <h2 id="categoryHeader">{categoryHeader}</h2>
        <div id="categoryGrid" className="card-grid">
          {categoryItems.map((i) => (
            <ContentCard
              key={i.id}
              item={i}
              showMatch={false}
              inWatchlist={has(i.id)}
              onToggleWatchlist={toggle}
            />
          ))}
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
