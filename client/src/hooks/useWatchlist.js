import { useCallback, useEffect, useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

const LOCAL_KEY = "myList";

function readLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function writeLocal(ids) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(ids));
}

export function useWatchlist() {
  const { isAuthenticated, user, setUser } = useAuth();
  const [localIds, setLocalIds] = useState(readLocal);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocalIds(readLocal());
    }
  }, [isAuthenticated]);

  const ids = isAuthenticated
    ? (user?.watchlist || []).map(String)
    : localIds;

  const has = useCallback(
    (contentId) => ids.includes(String(contentId)),
    [ids]
  );

  const toggle = useCallback(
    async (contentId) => {
      const id = Number(contentId);
      if (Number.isNaN(id)) return;

      if (isAuthenticated) {
        const res = await api.toggleWatchlist(id);
        setUser((u) => (u ? { ...u, watchlist: res.watchlist } : u));
      } else {
        setLocalIds((prev) => {
          const s = new Set(prev.map(String));
          const key = String(id);
          if (s.has(key)) s.delete(key);
          else s.add(key);
          const next = Array.from(s);
          writeLocal(next);
          return next;
        });
      }
    },
    [isAuthenticated, setUser]
  );

  return { ids, has, toggle };
}
