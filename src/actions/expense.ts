"use server";

import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

export async function createExpense(formData: FormData) {
  const user = await getAuthUser();
  const budgetLineId = formData.get("budgetLineId") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const description = (formData.get("description") as string) || null;
  const date = formData.get("date") as string;

  if (!budgetLineId || isNaN(amount) || !date) {
    return { error: "Budget line, amount, and date are required." };
  }

  // Verify ownership through budget line -> budget -> user
  const line = await db.budgetLine.findUnique({
    where: { id: budgetLineId },
    include: { budget: true },
  });

  if (!line || line.budget.userId !== user.id) {
    return { error: "Budget line not found." };
  }

  await db.expense.create({
    data: {
      budgetLineId,
      userId: user.id,
      amount,
      description,
      date: new Date(date),
    },
  });

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  revalidatePath(`/budgets/${line.budgetId}`);
  return { success: "Expense added!" };
}

export async function getExpenses(filters?: {
  budgetId?: string;
  budgetLineId?: string;
  from?: string;
  to?: string;
}) {
  const user = await getAuthUser();

  return db.expense.findMany({
    where: {
      userId: user.id,
      ...(filters?.budgetLineId && { budgetLineId: filters.budgetLineId }),
      ...(filters?.budgetId && {
        budgetLine: { budgetId: filters.budgetId },
      }),
      ...((filters?.from || filters?.to) && {
        date: {
          ...(filters?.from && { gte: new Date(filters.from) }),
          ...(filters?.to && { lte: new Date(filters.to) }),
        },
      }),
    },
    include: {
      budgetLine: {
        include: { budget: true },
      },
    },
    orderBy: { date: "desc" },
  });
}

export async function deleteExpense(id: string) {
  const user = await getAuthUser();

  const expense = await db.expense.findFirst({
    where: { id, userId: user.id },
  });

  if (!expense) {
    return { error: "Expense not found." };
  }

  await db.expense.delete({ where: { id } });

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { success: "Expense deleted!" };
}

export async function getUserBudgetsWithLines() {
  const user = await getAuthUser();
  return db.budget.findMany({
    where: { userId: user.id },
    include: { lines: { orderBy: { sortOrder: "asc" } } },
    orderBy: { name: "asc" },
  });
}
