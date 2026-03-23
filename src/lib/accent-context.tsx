"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { ACCENT_THEMES, type AccentColor } from "@/lib/constants";

type AccentContextValue = {
  accentColor: AccentColor;
  setAccentColor: (c: AccentColor) => void;
};

const AccentContext = createContext<AccentContextValue>({
  accentColor: "blue",
  setAccentColor: () => {},
});

function applyAccentVars(color: AccentColor) {
  const theme = ACCENT_THEMES[color];
  if (!theme) return;

  const isDark = document.documentElement.classList.contains("dark");
  const vars = isDark ? theme.dark : theme.light;

  document.documentElement.style.setProperty("--sp-accent", vars.accent);
  document.documentElement.style.setProperty("--sp-accent-hover", vars.hover);
  document.documentElement.style.setProperty("--sp-glow", vars.glow);
}

export function AccentProvider({
  initial,
  children,
}: {
  initial: AccentColor;
  children: ReactNode;
}) {
  const [accentColor, setAccentColor] = useState<AccentColor>(initial);

  // Apply on mount and when accent changes
  useEffect(() => {
    applyAccentVars(accentColor);
  }, [accentColor]);

  // Re-apply when dark/light mode changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      applyAccentVars(accentColor);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [accentColor]);

  return (
    <AccentContext.Provider value={{ accentColor, setAccentColor }}>
      {children}
    </AccentContext.Provider>
  );
}

export function useAccent() {
  return useContext(AccentContext);
}
