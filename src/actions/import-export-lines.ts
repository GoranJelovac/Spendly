"use server";

import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { getAuthUser } from "@/lib/auth-utils";
import { TIER_LIMITS, type SubscriptionTier } from "@/lib/constants";
import { getMonthlyAmounts } from "@/lib/budget-utils";
import { revalidatePath } from "next/cache";

const MONTH_HEADERS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export async function downloadBudgetLinesCsv(budgetId: string) {
  const user = await getAuthUser();

  const budget = await db.budget.findFirst({
    where: { id: budgetId, userId: user.id },
    include: {
      lines: {
        orderBy: { sortOrder: "asc" },
        include: { category: true },
      },
    },
  });

  if (!budget) return { error: "Budget not found." };

  const header = `Category,Name,Code,${MONTH_HEADERS.join(",")}\n`;

  const rows = budget.lines
    .map((line) => {
      const amounts = getMonthlyAmounts(line);
      return `${csvEscape(line.category.name)},${csvEscape(line.name)},${csvEscape(line.code || "")},${amounts.join(",")}`;
    })
    .join("\n");

  return { csv: header + rows };
}

export type ImportedLine = {
  name: string;
  code: string;
  category: string;
  months: number[];
  status: "new" | "changed" | "unchanged";
  existingMonths?: number[];
  existingCategory?: string;
};

export async function previewImport(
  budgetId: string,
  lines: { name: string; code: string; category: string; months: number[] }[]
): Promise<{ lines: ImportedLine[] } | { error: string }> {
  const user = await getAuthUser();

  const budget = await db.budget.findFirst({
    where: { id: budgetId, userId: user.id },
    include: {
      lines: {
        orderBy: { sortOrder: "asc" },
        include: { category: true },
      },
    },
  });

  if (!budget) return { error: "Budget not found." };

  const existingMap = new Map(
    budget.lines.map((l) => [l.name, l])
  );

  const result: ImportedLine[] = lines.map((imported) => {
    const existing = existingMap.get(imported.name);

    if (!existing) {
      return { ...imported, status: "new" as const };
    }

    const existingAmounts = getMonthlyAmounts(existing);
    const hasChanges =
      imported.code !== (existing.code || "") ||
      imported.category !== existing.category.name ||
      imported.months.some((m, i) => m !== existingAmounts[i]);

    return {
      ...imported,
      status: hasChanges ? ("changed" as const) : ("unchanged" as const),
      existingMonths: existingAmounts,
      existingCategory: existing.category.name,
    };
  });

  return { lines: result };
}

export async function applyImport(
  budgetId: string,
  linesToApply: { name: string; code: string; category: string; months: number[] }[]
) {
  const user = await getAuthUser();

  const budget = await db.budget.findFirst({
    where: { id: budgetId, userId: user.id },
    include: { lines: true, categories: true },
  });

  if (!budget) return { error: "Budget not found." };

  // Check tier limits
  const dbUser = await db.user.findUnique({ where: { id: user.id } });
  const tier = (dbUser?.subscriptionTier || "free") as SubscriptionTier;
  const existingNames = new Set(budget.lines.map((l) => l.name));
  const newCount = linesToApply.filter((l) => !existingNames.has(l.name)).length;
  const totalAfter = budget.lines.length + newCount;

  if (totalAfter > TIER_LIMITS[tier].lines) {
    return {
      error: `Import would exceed the limit of ${TIER_LIMITS[tier].lines} lines on the ${tier} plan.`,
    };
  }

  // Build category map, auto-create missing categories
  const categoryMap = new Map(budget.categories.map((c) => [c.name, c.id]));
  let maxCatOrder = Math.max(0, ...budget.categories.map((c) => c.sortOrder));

  for (const line of linesToApply) {
    const catName = line.category || "General";
    if (!categoryMap.has(catName)) {
      maxCatOrder++;
      const newCat = await db.category.create({
        data: { budgetId, name: catName, sortOrder: maxCatOrder },
      });
      categoryMap.set(catName, newCat.id);
    }
  }

  let maxOrder = Math.max(0, ...budget.lines.map((l) => l.sortOrder));

  for (const line of linesToApply) {
    const avg = line.months.reduce((s, a) => s + a, 0) / 12;
    const allSame = line.months.every((m) => m === line.months[0]);
    const categoryId = categoryMap.get(line.category || "General")!;

    const existing = budget.lines.find((l) => l.name === line.name);

    if (existing) {
      await db.budgetLine.update({
        where: { id: existing.id },
        data: {
          code: line.code || null,
          categoryId,
          monthlyAmount: allSame ? line.months[0] : avg,
          monthlyAmounts: allSame ? Prisma.DbNull : line.months,
        },
      });
    } else {
      maxOrder++;
      await db.budgetLine.create({
        data: {
          budgetId,
          categoryId,
          name: line.name,
          code: line.code || null,
          monthlyAmount: allSame ? line.months[0] : avg,
          monthlyAmounts: allSame ? Prisma.DbNull : line.months,
          sortOrder: maxOrder,
        },
      });
    }
  }

  revalidatePath("/budgets");
  revalidatePath("/categories");
  return { success: `Applied ${linesToApply.length} line(s).` };
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
