import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, setToken } from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const applyAuth = useCallback((token, userPayload) => {
    setToken(token);
    setUser(userPayload);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const data = await api.login(email, password);
      applyAuth(data.token, data.user);
      return data;
    },
    [applyAuth]
  );

  const register = useCallback(
    async (username, email, password) => {
      const data = await api.register(username, email, password);
      applyAuth(data.token, data.user);
      return data;
    },
    [applyAuth]
  );

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setReady(true);
      return;
    }
    api
      .me()
      .then((u) => setUser(u))
      .catch(() => logout())
      .finally(() => setReady(true));
  }, [logout]);

  const value = useMemo(
    () => ({
      user,
      ready,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      setUser,
    }),
    [user, ready, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
