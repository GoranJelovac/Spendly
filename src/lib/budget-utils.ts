/**
 * Get the monthly amounts array for a budget line.
 * If monthlyAmounts (JSON) exists, use it. Otherwise, fill all 12 months with monthlyAmount.
 */
export function getMonthlyAmounts(line: {
  monthlyAmount: number;
  monthlyAmounts: unknown;
}): number[] {
  if (
    Array.isArray(line.monthlyAmounts) &&
    line.monthlyAmounts.length === 12
  ) {
    return line.monthlyAmounts.map(Number);
  }
  return Array(12).fill(line.monthlyAmount);
}

/**
 * Get the planned amount for a specific range of months.
 */
export function getPlannedForRange(
  amounts: number[],
  fromMonth: number,
  toMonth: number
): number {
  let total = 0;
  for (let i = fromMonth; i <= toMonth; i++) {
    total += amounts[i] ?? 0;
  }
  return total;
}

/**
 * Get yearly total from monthly amounts.
 */
export function getYearlyTotal(amounts: number[]): number {
  return amounts.reduce((sum, a) => sum + a, 0);
}
