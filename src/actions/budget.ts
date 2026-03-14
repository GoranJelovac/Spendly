"use server";

import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";
import { TIER_LIMITS, type SubscriptionTier } from "@/lib/constants";
import { revalidatePath } from "next/cache";

export async function createBudget(formData: FormData) {
  const user = await getAuthUser();
  const name = formData.get("name") as string;
  const year = parseInt(formData.get("year") as string);
  const currency = (formData.get("currency") as string) || "EUR";

  if (!name || !year) {
    return { error: "Name and year are required." };
  }

  // Check tier limits
  const dbUser = await db.user.findUnique({ where: { id: user.id } });
  const tier = (dbUser?.subscriptionTier || "free") as SubscriptionTier;
  const budgetCount = await db.budget.count({ where: { userId: user.id } });

  if (budgetCount >= TIER_LIMITS[tier].budgets) {
    return {
      error: `You've reached the limit of ${TIER_LIMITS[tier].budgets} budget(s) on the ${tier} plan. Upgrade to add more.`,
    };
  }

  // Check unique name
  const existing = await db.budget.findUnique({
    where: { userId_name: { userId: user.id, name } },
  });

  if (existing) {
    return { error: "You already have a budget with this name." };
  }

  const budget = await db.budget.create({
    data: { userId: user.id, name, year, currency },
  });

  // Auto-create "General" category
  await db.category.create({
    data: { budgetId: budget.id, name: "General", sortOrder: 0 },
  });

  revalidatePath("/budgets");
  return { success: "Budget created!" };
}

export async function getBudgets() {
  const user = await getAuthUser();
  return db.budget.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { lines: true } } },
  });
}

export async function getBudget(id: string) {
  const user = await getAuthUser();
  return db.budget.findFirst({
    where: { id, userId: user.id },
    include: {
      categories: { orderBy: { sortOrder: "asc" } },
      lines: {
        orderBy: { sortOrder: "asc" },
        include: { category: true },
      },
    },
  });
}

export async function updateBudget(id: string, formData: FormData) {
  const user = await getAuthUser();
  const name = formData.get("name") as string;
  const year = parseInt(formData.get("year") as string);
  const currency = (formData.get("currency") as string) || "EUR";

  if (!name || !year) {
    return { error: "Name and year are required." };
  }

  const budget = await db.budget.findFirst({
    where: { id, userId: user.id },
  });

  if (!budget) {
    return { error: "Budget not found." };
  }

  // Check unique name (excluding current)
  const existing = await db.budget.findFirst({
    where: {
      userId: user.id,
      name,
      NOT: { id },
    },
  });

  if (existing) {
    return { error: "You already have a budget with this name." };
  }

  await db.budget.update({
    where: { id },
    data: { name, year, currency },
  });

  revalidatePath("/budgets");
  revalidatePath(`/budgets/${id}`);
  return { success: "Budget updated!" };
}

export async function deleteBudget(id: string) {
  const user = await getAuthUser();

  const budget = await db.budget.findFirst({
    where: { id, userId: user.id },
  });

  if (!budget) {
    return { error: "Budget not found." };
  }

  await db.budget.delete({ where: { id } });

  revalidatePath("/budgets");
  return { success: "Budget deleted!" };
}
