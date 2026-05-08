"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";

const STORAGE_KEY = "theme";

function getInitialTheme() {
  if (typeof window === "undefined") return "light";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    return getInitialTheme();
  });

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    setTheme(next);
  }

  const iconName = theme === "dark" ? "ri:sun-line" : "ri:moon-line";
  const label = `Switch to ${theme === "dark" ? "light" : "dark"} mode`;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      suppressHydrationWarning
      className="hidden h-9 w-9 items-center justify-center rounded-full   text-slate-700  transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900 sm:inline-flex"
      aria-label={label}
    >
      <Icon name={iconName} size={18} color="currentColor" />
    </button>
  );
}
