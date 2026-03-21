"use server";

import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

export async function createContribution(formData: FormData) {
  const user = await getAuthUser();
  const budgetLineId = formData.get("budgetLineId") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const description = (formData.get("description") as string) || null;
  const date = formData.get("date") as string;

  if (!budgetLineId || isNaN(amount) || !date) {
    return { error: "Budget line, amount, and date are required." };
  }

  const line = await db.budgetLine.findUnique({
    where: { id: budgetLineId },
    include: { budget: true },
  });

  if (!line || line.budget.userId !== user.id) {
    return { error: "Budget line not found." };
  }

  await db.contribution.create({
    data: {
      budgetLineId,
      userId: user.id,
      amount,
      description,
      date: new Date(date),
    },
  });

  revalidatePath("/contributions");
  revalidatePath("/dashboard");
  return { success: "Contribution added!" };
}

export async function getContributions(filters?: {
  budgetId?: string;
  budgetLineId?: string;
  from?: string;
  to?: string;
}) {
  const user = await getAuthUser();

  return db.contribution.findMany({
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

export async function getContributionsPaginated(
  filters: { budgetId?: string; budgetLineId?: string; from?: string; to?: string },
  page: number = 1,
  pageSize: number = 20,
) {
  const user = await getAuthUser();

  const where = {
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
  };

  const [items, total] = await Promise.all([
    db.contribution.findMany({
      where,
      include: {
        budgetLine: {
          include: { budget: true },
        },
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.contribution.count({ where }),
  ]);

  return { items, total };
}

export async function updateContribution(id: string, formData: FormData) {
  const user = await getAuthUser();
  const budgetLineId = formData.get("budgetLineId") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const description = (formData.get("description") as string) || null;
  const date = formData.get("date") as string;

  if (!budgetLineId || isNaN(amount) || !date) {
    return { error: "Budget line, amount, and date are required." };
  }

  const contribution = await db.contribution.findFirst({
    where: { id, userId: user.id },
  });

  if (!contribution) {
    return { error: "Contribution not found." };
  }

  const line = await db.budgetLine.findUnique({
    where: { id: budgetLineId },
    include: { budget: true },
  });

  if (!line || line.budget.userId !== user.id) {
    return { error: "Budget line not found." };
  }

  await db.contribution.update({
    where: { id },
    data: { budgetLineId, amount, description, date: new Date(date) },
  });

  revalidatePath("/contributions");
  revalidatePath("/dashboard");
  return { success: "Contribution updated!" };
}

export async function deleteContribution(id: string) {
  const user = await getAuthUser();

  const contribution = await db.contribution.findFirst({
    where: { id, userId: user.id },
  });

  if (!contribution) {
    return { error: "Contribution not found." };
  }

  await db.contribution.delete({ where: { id } });

  revalidatePath("/contributions");
  revalidatePath("/dashboard");
  return { success: "Contribution deleted!" };
}

export async function deleteContributions(ids: string[]) {
  const user = await getAuthUser();

  if (ids.length === 0) return { error: "No contributions selected." };

  const count = await db.contribution.deleteMany({
    where: { id: { in: ids }, userId: user.id },
  });

  revalidatePath("/contributions");
  revalidatePath("/dashboard");
  return { success: `Deleted ${count.count} contribution(s).` };
}
