"use server";

import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";

export type ParsedTransaction = {
  date: string;
  line: string;
  amount: number;
  description: string;
};

export type PreviewRow = ParsedTransaction & {
  status: "ready" | "error";
  error?: string;
};

export async function downloadContributionsCsv(budgetId: string) {
  const user = await getAuthUser();

  const contributions = await db.contribution.findMany({
    where: { userId: user.id, budgetLine: { budgetId } },
    include: { budgetLine: true },
    orderBy: { date: "desc" },
  });

  if (contributions.length === 0) return { error: "No contributions to export." };

  const header = "Date,Line,Amount,Description\n";
  const rows = contributions
    .map((c) => {
      const date = c.date.toISOString().split("T")[0];
      return `${date},${csvEscape(c.budgetLine.name)},${c.amount},${csvEscape(c.description || "")}`;
    })
    .join("\n");

  return { csv: header + rows };
}

export async function previewImportContributions(
  budgetId: string,
  rows: ParsedTransaction[]
): Promise<{ rows: PreviewRow[] } | { error: string }> {
  const user = await getAuthUser();

  const budget = await db.budget.findFirst({
    where: { id: budgetId, userId: user.id },
    include: { lines: true },
  });

  if (!budget) return { error: "Budget not found." };

  const lineMap = new Map(budget.lines.map((l) => [l.name.toLowerCase(), l]));

  const result: PreviewRow[] = rows.map((row) => {
    const match = lineMap.get(row.line.toLowerCase());
    if (!match) {
      return { ...row, status: "error" as const, error: `Line "${row.line}" not found` };
    }
    return { ...row, status: "ready" as const };
  });

  return { rows: result };
}

export async function applyImportContributions(
  budgetId: string,
  rows: ParsedTransaction[]
) {
  const user = await getAuthUser();

  const budget = await db.budget.findFirst({
    where: { id: budgetId, userId: user.id },
    include: { lines: true },
  });

  if (!budget) return { error: "Budget not found." };

  const lineMap = new Map(budget.lines.map((l) => [l.name.toLowerCase(), l]));

  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    const match = lineMap.get(row.line.toLowerCase());
    if (!match) {
      skipped++;
      continue;
    }

    await db.contribution.create({
      data: {
        budgetLineId: match.id,
        userId: user.id,
        amount: row.amount,
        description: row.description || null,
        date: new Date(row.date),
      },
    });
    created++;
  }

  revalidatePath("/contributions");
  revalidatePath("/dashboard");
  return { success: `Imported ${created} contribution(s).${skipped > 0 ? ` Skipped ${skipped} (line not found).` : ""}` };
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
