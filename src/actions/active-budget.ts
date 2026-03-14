"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

export async function setActiveBudget(budgetId: string) {
  const user = await getAuthUser();

  // Verify ownership
  const budget = await db.budget.findFirst({
    where: { id: budgetId, userId: user.id },
  });
  if (!budget) return { error: "Budget not found." };

  const cookieStore = await cookies();
  cookieStore.set("activeBudgetId", budgetId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/dashboard");
  revalidatePath("/budgets");
  revalidatePath("/expenses");
  return { success: true };
}

export async function getActiveBudget() {
  const user = await getAuthUser();

  const cookieStore = await cookies();
  const activeBudgetId = cookieStore.get("activeBudgetId")?.value;

  // Try to get the saved budget
  if (activeBudgetId) {
    const budget = await db.budget.findFirst({
      where: { id: activeBudgetId, userId: user.id },
    });
    if (budget) return budget;
  }

  // Fallback: get the first budget (but don't set cookie here - can't in Server Component)
  const firstBudget = await db.budget.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return firstBudget;
}
