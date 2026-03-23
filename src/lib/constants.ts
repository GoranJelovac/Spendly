export const TIER_LIMITS = {
  free: { budgets: 1, lines: 10 },
  pro: { budgets: 5, lines: 50 },
  business: { budgets: Infinity, lines: Infinity },
} as const;

export type SubscriptionTier = keyof typeof TIER_LIMITS;

export const TIER_PRICES = {
  free: 0,
  pro: 5,
  business: 15,
} as const;

export const CURRENCIES = [
  "EUR", "USD", "GBP", "RSD", "CHF", "JPY", "CNY", "AUD", "CAD", "SEK",
  "NOK", "DKK", "PLN", "CZK", "HUF", "RON", "BGN", "HRK", "TRY", "BRL",
  "INR", "KRW", "MXN", "ZAR",
] as const;

export const CURRENCY_COUNTRIES: Record<string, string> = {
  EUR: "eu", USD: "us", GBP: "gb", RSD: "rs", CHF: "ch",
  JPY: "jp", CNY: "cn", AUD: "au", CAD: "ca", SEK: "se",
  NOK: "no", DKK: "dk", PLN: "pl", CZK: "cz", HUF: "hu",
  RON: "ro", BGN: "bg", HRK: "hr", TRY: "tr", BRL: "br",
  INR: "in", KRW: "kr", MXN: "mx", ZAR: "za",
};

export function currencyFlagUrl(code: string, size = 24): string {
  const country = CURRENCY_COUNTRIES[code];
  if (!country) return "";
  const h = Math.round(size * 0.75);
  return `https://flagcdn.com/${size}x${h}/${country}.png`;
}

export type AccentColor =
  | "blue" | "emerald" | "violet" | "amber" | "rose" | "cyan"
  | "orange" | "pink" | "teal" | "slate" | "indigo" | "red";

export const ACCENT_THEMES: Record<
  AccentColor,
  { label: string; swatch: string; light: { accent: string; hover: string; glow: string }; dark: { accent: string; hover: string; glow: string } }
> = {
  blue: {
    label: "Blue", swatch: "#3b82f6",
    light: { accent: "#3b82f6", hover: "#2563eb", glow: "rgba(59,130,246,0.08)" },
    dark:  { accent: "#3b82f6", hover: "#2563eb", glow: "rgba(59,130,246,0.12)" },
  },
  emerald: {
    label: "Emerald", swatch: "#10b981",
    light: { accent: "#059669", hover: "#047857", glow: "rgba(16,185,129,0.08)" },
    dark:  { accent: "#10b981", hover: "#059669", glow: "rgba(16,185,129,0.12)" },
  },
  violet: {
    label: "Violet", swatch: "#8b5cf6",
    light: { accent: "#7c3aed", hover: "#6d28d9", glow: "rgba(139,92,246,0.08)" },
    dark:  { accent: "#a78bfa", hover: "#8b5cf6", glow: "rgba(139,92,246,0.12)" },
  },
  amber: {
    label: "Amber", swatch: "#f59e0b",
    light: { accent: "#d97706", hover: "#b45309", glow: "rgba(245,158,11,0.08)" },
    dark:  { accent: "#f59e0b", hover: "#d97706", glow: "rgba(245,158,11,0.12)" },
  },
  rose: {
    label: "Rose", swatch: "#f43f5e",
    light: { accent: "#e11d48", hover: "#be123c", glow: "rgba(244,63,94,0.08)" },
    dark:  { accent: "#fb7185", hover: "#f43f5e", glow: "rgba(244,63,94,0.12)" },
  },
  cyan: {
    label: "Cyan", swatch: "#06b6d4",
    light: { accent: "#0891b2", hover: "#0e7490", glow: "rgba(6,182,212,0.08)" },
    dark:  { accent: "#22d3ee", hover: "#06b6d4", glow: "rgba(6,182,212,0.12)" },
  },
  orange: {
    label: "Orange", swatch: "#f97316",
    light: { accent: "#ea580c", hover: "#c2410c", glow: "rgba(249,115,22,0.08)" },
    dark:  { accent: "#fb923c", hover: "#f97316", glow: "rgba(249,115,22,0.12)" },
  },
  pink: {
    label: "Pink", swatch: "#ec4899",
    light: { accent: "#db2777", hover: "#be185d", glow: "rgba(236,72,153,0.08)" },
    dark:  { accent: "#f472b6", hover: "#ec4899", glow: "rgba(236,72,153,0.12)" },
  },
  teal: {
    label: "Teal", swatch: "#14b8a6",
    light: { accent: "#0d9488", hover: "#0f766e", glow: "rgba(20,184,166,0.08)" },
    dark:  { accent: "#2dd4bf", hover: "#14b8a6", glow: "rgba(20,184,166,0.12)" },
  },
  slate: {
    label: "Slate", swatch: "#64748b",
    light: { accent: "#475569", hover: "#334155", glow: "rgba(100,116,139,0.08)" },
    dark:  { accent: "#94a3b8", hover: "#64748b", glow: "rgba(100,116,139,0.12)" },
  },
  indigo: {
    label: "Indigo", swatch: "#6366f1",
    light: { accent: "#4f46e5", hover: "#4338ca", glow: "rgba(99,102,241,0.08)" },
    dark:  { accent: "#818cf8", hover: "#6366f1", glow: "rgba(99,102,241,0.12)" },
  },
  red: {
    label: "Red", swatch: "#ef4444",
    light: { accent: "#dc2626", hover: "#b91c1c", glow: "rgba(239,68,68,0.08)" },
    dark:  { accent: "#f87171", hover: "#ef4444", glow: "rgba(239,68,68,0.12)" },
  },
};
