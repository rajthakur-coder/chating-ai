"use client";

import Icon from "@/components/ui/Icon";
import { useThemeStore } from "@/store/useThemeStore";
import { useEffect } from "react";

export default function ThemeToggle() {
  const { theme, initializeTheme, toggleTheme } = useThemeStore();

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

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
