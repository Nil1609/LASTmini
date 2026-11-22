"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
  theme: "light",
  setTheme: () => {},
});

export function ThemeProvider({ children, defaultTheme = "light" }) {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    try {
      // Force white/light theme as requested by user
      localStorage.setItem("aulaf-theme", "light");
      document.documentElement.setAttribute("data-theme", "light");
      document.documentElement.classList.remove("dark");
      setTheme("light");
    } catch (e) {
      // Ignore
    }
  }, []);

  const updateTheme = (newTheme) => {
    setTheme(newTheme);
    try {
      localStorage.setItem("aulaf-theme", newTheme);
      document.documentElement.setAttribute("data-theme", newTheme);
    } catch (e) {
      // Ignore storage errors
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
