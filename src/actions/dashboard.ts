"use server";

import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";

export type DashboardData = {
  budget: {
    id: string;
    name: string;
    year: number;
    currency: string;
  };
  lines: {
    id: string;
    name: string;
    monthlyAmount: number;
    planned: number;
    spent: number;
    remaining: number;
    percentage: number;
  }[];
  totals: {
    planned: number;
    spent: number;
    remaining: number;
    percentage: number;
  };
};

export async function getDashboardData(
  budgetId: string,
  period: "month" | "ytd" | "custom",
  customFrom?: string,
  customTo?: string
): Promise<DashboardData | null> {
  const user = await getAuthUser();

  const budget = await db.budget.findFirst({
    where: { id: budgetId, userId: user.id },
    include: {
      lines: {
        orderBy: { sortOrder: "asc" },
        include: { expenses: true },
      },
    },
  });

  if (!budget) return null;

  const now = new Date();
  let dateFrom: Date;
  let dateTo: Date;
  let months: number;

  if (period === "month") {
    dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    months = 1;
  } else if (period === "ytd") {
    dateFrom = new Date(budget.year, 0, 1);
    dateTo = now;
    months = now.getMonth() + 1;
  } else {
    dateFrom = customFrom ? new Date(customFrom) : new Date(budget.year, 0, 1);
    dateTo = customTo ? new Date(customTo) : now;
    const diffMs = dateTo.getTime() - dateFrom.getTime();
    months = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30)));
  }

  const lines = budget.lines.map((line) => {
    const planned = line.monthlyAmount * months;
    const spent = line.expenses
      .filter((e) => e.date >= dateFrom && e.date <= dateTo)
      .reduce((sum, e) => sum + e.amount, 0);
    const remaining = planned - spent;
    const percentage = planned > 0 ? (spent / planned) * 100 : 0;

    return {
      id: line.id,
      name: line.name,
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

  return {
    budget: {
      id: budget.id,
      name: budget.name,
      year: budget.year,
      currency: budget.currency,
    },
    lines,
    totals,
  };
}
