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
