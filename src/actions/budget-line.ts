"use server";

import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";
import { TIER_LIMITS, type SubscriptionTier } from "@/lib/constants";
import { revalidatePath } from "next/cache";

function parseAmountsFromForm(formData: FormData): {
  mode: "fixed" | "custom";
  monthlyAmount: number;
  monthlyAmounts: number[] | null;
} {
  const mode = formData.get("amountMode") as string;

  if (mode === "custom") {
    const amounts: number[] = [];
    for (let i = 0; i < 12; i++) {
      amounts.push(parseFloat(formData.get(`month_${i}`) as string) || 0);
    }
    const avg = amounts.reduce((s, a) => s + a, 0) / 12;
    return { mode: "custom", monthlyAmount: avg, monthlyAmounts: amounts };
  }

  const monthlyAmount = parseFloat(formData.get("monthlyAmount") as string);
  return { mode: "fixed", monthlyAmount, monthlyAmounts: null };
}

export async function createBudgetLine(budgetId: string, formData: FormData) {
  const user = await getAuthUser();
  const name = formData.get("name") as string;
  const code = (formData.get("code") as string) || null;
  const categoryId = formData.get("categoryId") as string;
  const { monthlyAmount, monthlyAmounts } = parseAmountsFromForm(formData);

  if (!name || isNaN(monthlyAmount)) {
    return { error: "Name and amount are required." };
  }

  // Verify budget ownership
  const budget = await db.budget.findFirst({
    where: { id: budgetId, userId: user.id },
  });
  if (!budget) return { error: "Budget not found." };

  // Check tier limits
  const dbUser = await db.user.findUnique({ where: { id: user.id } });
  const tier = (dbUser?.subscriptionTier || "free") as SubscriptionTier;
  const lineCount = await db.budgetLine.count({ where: { budgetId } });

  if (lineCount >= TIER_LIMITS[tier].lines) {
    return {
      error: `You've reached the limit of ${TIER_LIMITS[tier].lines} line(s) on the ${tier} plan. Upgrade to add more.`,
    };
  }

  // Check unique name within budget
  const existing = await db.budgetLine.findUnique({
    where: { budgetId_name: { budgetId, name } },
  });
  if (existing) return { error: "A line with this name already exists in this budget." };

  const maxOrder = await db.budgetLine.aggregate({
    where: { budgetId },
    _max: { sortOrder: true },
  });

  // Resolve categoryId: use provided or default to General
  let resolvedCategoryId = categoryId;
  if (!resolvedCategoryId) {
    const general = await db.category.findFirst({
      where: { budgetId, name: "General" },
    });
    if (!general) return { error: "General category not found." };
    resolvedCategoryId = general.id;
  }

  await db.budgetLine.create({
    data: {
      budgetId,
      categoryId: resolvedCategoryId,
      name,
      code,
      monthlyAmount,
      monthlyAmounts: monthlyAmounts ?? undefined,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });

  revalidatePath("/budgets");
  return { success: "Line added!" };
}

export async function updateBudgetLine(id: string, formData: FormData) {
  const user = await getAuthUser();
  const name = formData.get("name") as string;
  const code = (formData.get("code") as string) || null;
  const categoryId = (formData.get("categoryId") as string) || undefined;
  const { monthlyAmount, monthlyAmounts } = parseAmountsFromForm(formData);

  if (!name || isNaN(monthlyAmount)) {
    return { error: "Name and amount are required." };
  }

  const line = await db.budgetLine.findUnique({
    where: { id },
    include: { budget: true },
  });

  if (!line || line.budget.userId !== user.id) {
    return { error: "Line not found." };
  }

  // Check unique name (excluding current)
  const existing = await db.budgetLine.findFirst({
    where: { budgetId: line.budgetId, name, NOT: { id } },
  });
  if (existing) return { error: "A line with this name already exists." };

  await db.budgetLine.update({
    where: { id },
    data: {
      name,
      code,
      categoryId,
      monthlyAmount,
      monthlyAmounts: monthlyAmounts ?? undefined,
    },
  });

  revalidatePath("/budgets");
  return { success: "Line updated!" };
}

export async function deleteBudgetLine(id: string) {
  const user = await getAuthUser();

  const line = await db.budgetLine.findUnique({
    where: { id },
    include: { budget: true },
  });

  if (!line || line.budget.userId !== user.id) {
    return { error: "Line not found." };
  }

  await db.budgetLine.delete({ where: { id } });

  revalidatePath("/budgets");
  return { success: "Line deleted!" };
}
