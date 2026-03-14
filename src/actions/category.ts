"use server";

import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

export async function getCategories(budgetId: string) {
  const user = await getAuthUser();

  const budget = await db.budget.findFirst({
    where: { id: budgetId, userId: user.id },
  });
  if (!budget) return [];

  return db.category.findMany({
    where: { budgetId },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { lines: true } } },
  });
}

export async function createCategory(budgetId: string, formData: FormData) {
  const user = await getAuthUser();
  const name = (formData.get("name") as string)?.trim();

  if (!name) return { error: "Name is required." };

  const budget = await db.budget.findFirst({
    where: { id: budgetId, userId: user.id },
  });
  if (!budget) return { error: "Budget not found." };

  const existing = await db.category.findUnique({
    where: { budgetId_name: { budgetId, name } },
  });
  if (existing) return { error: "A category with this name already exists." };

  const maxOrder = await db.category.aggregate({
    where: { budgetId },
    _max: { sortOrder: true },
  });

  await db.category.create({
    data: {
      budgetId,
      name,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });

  revalidatePath("/categories");
  revalidatePath("/budgets");
  return { success: "Category created!" };
}

export async function deleteCategory(id: string) {
  const user = await getAuthUser();

  const category = await db.category.findUnique({
    where: { id },
    include: { budget: true },
  });

  if (!category || category.budget.userId !== user.id) {
    return { error: "Category not found." };
  }

  if (category.name === "General") {
    return { error: "Cannot delete the General category." };
  }

  // Move lines to General
  const general = await db.category.findUnique({
    where: { budgetId_name: { budgetId: category.budgetId, name: "General" } },
  });

  if (general) {
    await db.budgetLine.updateMany({
      where: { categoryId: id },
      data: { categoryId: general.id },
    });
  }

  await db.category.delete({ where: { id } });

  revalidatePath("/categories");
  revalidatePath("/budgets");
  return { success: "Category deleted. Lines moved to General." };
}

export async function renameCategory(id: string, formData: FormData) {
  const user = await getAuthUser();
  const name = (formData.get("name") as string)?.trim();

  if (!name) return { error: "Name is required." };

  const category = await db.category.findUnique({
    where: { id },
    include: { budget: true },
  });

  if (!category || category.budget.userId !== user.id) {
    return { error: "Category not found." };
  }

  if (category.name === "General") {
    return { error: "Cannot rename the General category." };
  }

  const existing = await db.category.findFirst({
    where: { budgetId: category.budgetId, name, NOT: { id } },
  });
  if (existing) return { error: "A category with this name already exists." };

  await db.category.update({
    where: { id },
    data: { name },
  });

  revalidatePath("/categories");
  revalidatePath("/budgets");
  return { success: "Category renamed!" };
}
