
import { useEffect, useState, type ReactNode } from "react";

import {
  ThemeContext,
  type Theme,
} from "./theme-context";

const STORAGE_KEY = "enterprise-dashboard-theme";

type ThemeProviderProps = {
  children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (
      saved === "light" ||
      saved === "dark" ||
      saved === "system"
    ) {
      return saved;
    }

    return "system";
  });

  useEffect(() => {
    const root = document.documentElement;

    const media = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    const applyTheme = () => {
      const resolvedTheme =
        theme === "system"
          ? media.matches
            ? "dark"
            : "light"
          : theme;

      root.classList.toggle("dark", resolvedTheme === "dark");
      root.style.colorScheme = resolvedTheme;
    };

    applyTheme();

    if (theme === "system") {
      media.addEventListener("change", applyTheme);

      return () => {
        media.removeEventListener("change", applyTheme);
      };
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(STORAGE_KEY, newTheme);
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
