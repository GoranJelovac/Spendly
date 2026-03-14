"use server";

import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";
import { getMonthlyAmounts, getPlannedForRange } from "@/lib/budget-utils";

export type DashboardLine = {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  monthlyAmount: number;
  planned: number;
  spent: number;
  remaining: number;
  percentage: number;
};

export type DashboardCategory = {
  id: string;
  name: string;
  planned: number;
  spent: number;
  remaining: number;
  percentage: number;
};

export type DashboardData = {
  budget: {
    id: string;
    name: string;
    year: number;
    currency: string;
  };
  lines: DashboardLine[];
  categories: DashboardCategory[];
  totals: {
    planned: number;
    spent: number;
    remaining: number;
    percentage: number;
  };
};

export async function getDashboardData(
  budgetId: string,
  period: "month" | "ytd" | "bymonth",
  selectedMonth?: number,
  byMonthMode?: "single" | "cumulative"
): Promise<DashboardData | null> {
  const user = await getAuthUser();

  const budget = await db.budget.findFirst({
    where: { id: budgetId, userId: user.id },
    include: {
      lines: {
        orderBy: { sortOrder: "asc" },
        include: { expenses: true, category: true },
      },
    },
  });

  if (!budget) return null;

  const now = new Date();
  let dateFrom: Date;
  let dateTo: Date;
  let fromMonth: number;
  let toMonth: number;

  if (period === "month") {
    fromMonth = now.getMonth();
    toMonth = now.getMonth();
    dateFrom = new Date(now.getFullYear(), fromMonth, 1);
    dateTo = new Date(now.getFullYear(), toMonth + 1, 0, 23, 59, 59);
  } else if (period === "ytd") {
    fromMonth = 0;
    toMonth = now.getMonth();
    dateFrom = new Date(budget.year, 0, 1);
    dateTo = now;
  } else {
    // bymonth
    const m = selectedMonth ?? now.getMonth();
    if (byMonthMode === "cumulative") {
      fromMonth = 0;
      toMonth = m;
      dateFrom = new Date(budget.year, 0, 1);
      dateTo = new Date(budget.year, m + 1, 0, 23, 59, 59);
    } else {
      fromMonth = m;
      toMonth = m;
      dateFrom = new Date(budget.year, m, 1);
      dateTo = new Date(budget.year, m + 1, 0, 23, 59, 59);
    }
  }

  const lines = budget.lines.map((line) => {
    const amounts = getMonthlyAmounts(line);
    const planned = getPlannedForRange(amounts, fromMonth, toMonth);
    const spent = line.expenses
      .filter((e) => e.date >= dateFrom && e.date <= dateTo)
      .reduce((sum, e) => sum + e.amount, 0);
    const remaining = planned - spent;
    const percentage = planned > 0 ? (spent / planned) * 100 : 0;

    return {
      id: line.id,
      name: line.name,
      categoryId: line.categoryId,
      categoryName: line.category.name,
      monthlyAmount: line.monthlyAmount,
      planned,
      spent,
      remaining,
      percentage,
    };
  });

  const totals = {
    planned: lines.reduce((s, l) => s + l.planned, 0),
    spent: lines.reduce((s, l) => s + l.spent, 0),
    remaining: lines.reduce((s, l) => s + l.remaining, 0),
    percentage: 0,
  };
  totals.percentage =
    totals.planned > 0 ? (totals.spent / totals.planned) * 100 : 0;

  // Aggregate by category
  const catMap = new Map<string, { id: string; name: string; planned: number; spent: number }>();
  for (const line of lines) {
    const existing = catMap.get(line.categoryId);
    if (existing) {
      existing.planned += line.planned;
      existing.spent += line.spent;
    } else {
      catMap.set(line.categoryId, {
        id: line.categoryId,
        name: line.categoryName,
        planned: line.planned,
        spent: line.spent,
      });
    }
  }
  const categories: DashboardCategory[] = Array.from(catMap.values()).map((c) => ({
    ...c,
    remaining: c.planned - c.spent,
    percentage: c.planned > 0 ? (c.spent / c.planned) * 100 : 0,
  }));

  return {
    budget: {
      id: budget.id,
      name: budget.name,
      year: budget.year,
      currency: budget.currency,
    },
    lines,
    categories,
    totals,
  };
}
