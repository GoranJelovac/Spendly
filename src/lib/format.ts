/** Format a number with European style: dot for thousands, comma for decimals.
 *  e.g. 1234.56 → "1.234,56" */
export function fmt(value: number, decimals = 2): string {
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
