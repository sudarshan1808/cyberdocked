import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function SiteHeader({ onCategoriesClick, searchInput, onSearchInput, onSearchSubmit }) {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const header = document.querySelector(".site-header");
      if (!header) return;
      if (window.scrollY > 60) header.classList.add("scrolled");
      else header.classList.remove("scrolled");
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="site-header">
      <div className="left-section">
        <div className="logo">
          <Link to="/">
            <img src="/logo/CYBERFLIX MAIN PAGE LOGO.png" alt="CyberFlix Logo" />
          </Link>
        </div>
        <nav>
          <Link to="/">Home</Link>
          <a href="#" id="categoriesBtn" onClick={(e) => { e.preventDefault(); onCategoriesClick?.(); }}>
            Categories
          </a>
          <Link to="/mylist">MyList</Link>
          <button
            type="button"
            className="search-btn nav-search-btn"
            onClick={() => {
              setSearchOpen((o) => !o);
              setTimeout(() => document.getElementById("searchInput")?.focus(), 0);
            }}
            title="Search"
          >
            🔍
          </button>
        </nav>
      </div>

      <div className="right-section">
        <input
          id="searchInput"
          type="text"
          className={`search-input ${searchOpen ? "active" : ""}`}
          placeholder="Search..."
          value={searchInput}
          onChange={(e) => onSearchInput?.(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSearchSubmit?.();
          }}
        />
        <div
          className="profile-pic"
          onClick={() => {
            if (isAuthenticated) navigate("/profile");
            else navigate("/login");
          }}
          role="presentation"
          title={isAuthenticated ? "Your profile" : "Sign in"}
        >
          <img src={isAuthenticated && user?.profilePicture ? user.profilePicture : "/pic.jpg"} alt="Profile" />
        </div>
        {isAuthenticated && (
          <button type="button" className="signout-btn" onClick={logout}>
            Sign Out
          </button>
        )}
      </div>
    </header>
  );
}
