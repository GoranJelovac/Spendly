"use client";

import { useState } from "react";
import { createExpense } from "@/actions/expense";
import { Button } from "@/components/ui/button";

type BudgetLine = {
  id: string;
  name: string;
};

export function AddExpenseForm({ lines }: { lines: BudgetLine[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setLoading(true);
    const result = await createExpense(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setOpen(false);
    }
    setLoading(false);
  }

  if (lines.length === 0) {
    return (
      <p className="mb-6 text-gray-500">
        No budget lines yet. Add some on the Budget Lines page first.
      </p>
    );
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="mb-6">
        + Add Expense
      </Button>
    );
  }

  return (
    <div className="mb-6 rounded-lg border bg-white p-4 dark:bg-gray-900">
      <h2 className="mb-4 text-lg font-semibold">Add Expense</h2>
      <form action={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Category</label>
            <select
              name="budgetLineId"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
              required
            >
              <option value="">Select category...</option>
              {lines.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Amount</label>
            <input
              name="amount"
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium">Date</label>
            <input
              name="date"
              type="date"
              required
              defaultValue={new Date().toISOString().split("T")[0]}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <input
              name="description"
              placeholder="Optional"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add Expense"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
