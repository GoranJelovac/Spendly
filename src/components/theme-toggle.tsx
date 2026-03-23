"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-7 w-20" />;

  return (
    <div className="flex items-center rounded-full border bg-gray-100 p-0.5 dark:border-sp-border dark:bg-sp-surface">
      <button
        onClick={() => setTheme("light")}
        className={`rounded-full px-2 py-1 text-xs transition-colors ${
          theme === "light"
            ? "bg-white text-gray-900 shadow-sm dark:bg-sp-accent dark:text-white"
            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        }`}
        title="Light"
      >
        &#9728;
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`rounded-full px-2 py-1 text-xs transition-colors ${
          theme === "dark"
            ? "bg-white text-gray-900 shadow-sm dark:bg-sp-accent dark:text-white"
            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        }`}
        title="Dark"
      >
        &#9790;
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`rounded-full px-2 py-1 text-xs transition-colors ${
          theme === "system"
            ? "bg-white text-gray-900 shadow-sm dark:bg-sp-accent dark:text-white"
            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        }`}
        title="System"
      >
        &#9881;
      </button>
    </div>
  );
}
