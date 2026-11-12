"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useUIStore } from "@/lib/stores/ui-store";
import { t } from "@/lib/i18n";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, [theme]);

  if (!mounted) {
    return (
      <div className="h-9 w-9" aria-hidden="true" />
    );
  }

  const isDarkMode =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const toggle = () => {
    setTheme(isDarkMode ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t.theme.toggleTheme}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-card text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {isDarkMode ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
