"use client";

import { useState } from "react";
import Link from "next/link";
import { deleteBudget } from "@/actions/budget";
import { Button } from "@/components/ui/button";

type Budget = {
  id: string;
  name: string;
  year: number;
  currency: string;
  createdAt: Date;
  _count: { lines: number };
};

export function BudgetList({ budgets }: { budgets: Budget[] }) {
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this budget? All lines and expenses will be removed.")) {
      return;
    }
    setDeleting(id);
    await deleteBudget(id);
    setDeleting(null);
  }

  if (budgets.length === 0) {
    return (
      <p className="text-gray-500">
        No budgets yet. Create your first one above!
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {budgets.map((budget) => (
        <div
          key={budget.id}
          className="flex items-center justify-between rounded-lg border bg-white p-4 dark:bg-gray-900"
        >
          <Link
            href={`/budgets/${budget.id}`}
            className="flex-1 hover:underline"
          >
            <h3 className="font-semibold">{budget.name}</h3>
            <p className="text-sm text-gray-500">
              {budget.year} &middot; {budget.currency} &middot;{" "}
              {budget._count.lines} line(s)
            </p>
          </Link>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(budget.id)}
            disabled={deleting === budget.id}
          >
            {deleting === budget.id ? "Deleting..." : "Delete"}
          </Button>
        </div>
      ))}
    </div>
  );
}
