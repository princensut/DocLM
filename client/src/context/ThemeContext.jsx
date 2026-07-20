import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import * as authApi from "../api/authApi";

const ThemeContext = createContext(null);
const STORAGE_KEY = "theme-preference";

export function ThemeProvider({ children }) {
  const { user, setUser } = useAuth();
  const [theme, setThemeState] = useState(() => localStorage.getItem(STORAGE_KEY) || "light");

  // Instant paint from localStorage cache, then reconcile with the
  // user's persisted profile preference once it loads (avoids a
  // flash of the wrong theme). See FRONTEND.md §3.
  useEffect(() => {
    if (user?.themePreference && user.themePreference !== theme) {
      setThemeState(user.themePreference);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.themePreference]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = async () => {
    const next = theme === "light" ? "dark" : "light";
    setThemeState(next);
    if (user) {
      try {
        const updatedUser = await authApi.updateTheme(next);
        setUser(updatedUser);
      } catch {
        // Non-critical - the local preference still applies this session.
      }
    }
  };

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
