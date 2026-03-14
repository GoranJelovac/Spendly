"use server";

import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";

export async function exportExpensesCsv(budgetId?: string) {
  const user = await getAuthUser();

  // Check tier (Pro+ only)
  const dbUser = await db.user.findUnique({ where: { id: user.id } });
  if (!dbUser || dbUser.subscriptionTier === "free") {
    return { error: "CSV export is available on Pro and Business plans." };
  }

  const expenses = await db.expense.findMany({
    where: {
      userId: user.id,
      ...(budgetId && { budgetLine: { budgetId } }),
    },
    include: {
      budgetLine: { include: { budget: true } },
    },
    orderBy: { date: "asc" },
  });

  const header = "Date,Budget,Category,Description,Amount,Currency\n";
  const rows = expenses
    .map(
      (e) =>
        `${new Date(e.date).toISOString().split("T")[0]},${csvEscape(e.budgetLine.budget.name)},${csvEscape(e.budgetLine.name)},${csvEscape(e.description || "")},${e.amount},${e.budgetLine.budget.currency}`
    )
    .join("\n");

  return { csv: header + rows };
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
