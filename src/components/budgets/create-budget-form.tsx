"use client";

import { useState } from "react";
import { createBudget } from "@/actions/budget";
import { Button } from "@/components/ui/button";
import { CurrencySelect } from "@/components/shared/currency-select";

export function CreateBudgetForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setLoading(true);
    const result = await createBudget(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setOpen(false);
    }
    setLoading(false);
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="mb-6">
        + New Budget
      </Button>
    );
  }

  return (
    <div className="mb-6 rounded-2xl border-2 border-gray-200 bg-white p-4 shadow-md dark:border-sp-border dark:bg-sp-bg dark:shadow-[0_0_20px_var(--sp-glow)]">
      <h2 className="mb-4 text-lg font-semibold">Create Budget</h2>
      <form action={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="e.g. Household 2026"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:bg-sp-surface dark:border-sp-border"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="year" className="block text-sm font-medium">
              Year
            </label>
            <input
              id="year"
              name="year"
              type="number"
              required
              defaultValue={new Date().getFullYear()}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:bg-sp-surface dark:border-sp-border"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium">
              Currency
            </label>
            <CurrencySelect name="currency" defaultValue="EUR" className="mt-1" />
          </div>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
