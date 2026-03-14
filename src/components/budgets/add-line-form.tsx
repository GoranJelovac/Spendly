"use client";

import { useState } from "react";
import { createBudgetLine } from "@/actions/budget-line";
import { Button } from "@/components/ui/button";

export function AddLineForm({ budgetId }: { budgetId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setLoading(true);
    const result = await createBudgetLine(budgetId, formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setOpen(false);
    }
    setLoading(false);
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="mb-4">
        + Add Line
      </Button>
    );
  }

  return (
    <div className="mb-4 rounded-lg border bg-white p-4 dark:bg-gray-900">
      <h2 className="mb-3 text-lg font-semibold">Add Budget Line</h2>
      <form action={handleSubmit} className="space-y-3">
        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="name" className="block text-sm font-medium">
              Name
            </label>
            <input
              id="name"
              name="name"
              required
              placeholder="e.g. Groceries"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          <div className="w-24">
            <label htmlFor="code" className="block text-sm font-medium">
              Code
            </label>
            <input
              id="code"
              name="code"
              placeholder="GRC"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          <div className="w-32">
            <label htmlFor="monthlyAmount" className="block text-sm font-medium">
              Monthly
            </label>
            <input
              id="monthlyAmount"
              name="monthlyAmount"
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
