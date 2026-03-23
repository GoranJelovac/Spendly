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
