"use client";

import { useState, type ReactNode } from "react";
import { createExpense } from "@/actions/expense";
import { Button } from "@/components/ui/button";

type BudgetLine = {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
};

export function AddExpenseForm({ lines, actionSlot }: { lines: BudgetLine[]; actionSlot?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");

  // Build unique categories from lines
  const categories = Array.from(
    new Map(lines.map((l) => [l.categoryId, l.categoryName])).entries()
  ).map(([id, name]) => ({ id, name }));

  const filteredLines = selectedCategory
    ? lines.filter((l) => l.categoryId === selectedCategory)
    : [];

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
      <div className="mb-6 flex items-center justify-between">
        <Button onClick={() => setOpen(true)}>
          + Add Expense
        </Button>
        <div>{actionSlot}</div>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-2xl border-2 border-gray-200 bg-white p-4 shadow-md dark:border-[#252345] dark:bg-[#13112b] dark:shadow-[0_0_20px_rgba(129,140,248,0.12)]">
      <h2 className="mb-4 text-lg font-semibold">Add Expense</h2>
      <form action={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:bg-[#1a1835] dark:border-[#252345]"
              required
            >
              <option value="">Select category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Budget Line</label>
            <select
              name="budgetLineId"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:bg-[#1a1835] dark:border-[#252345]"
              required
              disabled={!selectedCategory}
            >
              <option value="">{selectedCategory ? "Select line..." : "Select category first"}</option>
              {filteredLines.map((l) => (
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
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:bg-[#1a1835] dark:border-[#252345]"
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
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:bg-[#1a1835] dark:border-[#252345]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <input
              name="description"
              placeholder="Optional"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:bg-[#1a1835] dark:border-[#252345]"
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
