"use client";

import { useState } from "react";
import { createBudgetLine } from "@/actions/budget-line";
import { Button } from "@/components/ui/button";

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

type CategoryOption = { id: string; name: string };

export function AddLineForm({
  budgetId,
  categories,
}: {
  budgetId: string;
  categories: CategoryOption[];
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"fixed" | "custom">("fixed");
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
      setMode("fixed");
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
    <div className="mb-4 rounded-2xl bg-white p-5 shadow-md dark:bg-[#13112b] dark:border-2 dark:border-[#252345] dark:shadow-[0_0_20px_rgba(129,140,248,0.12)]">
      <h2 className="mb-3 text-lg font-semibold">Add Budget Line</h2>
      <form action={handleSubmit} className="space-y-3">
        <input type="hidden" name="amountMode" value={mode} />

        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[140px]">
            <label htmlFor="name" className="block text-sm font-medium">
              Name
            </label>
            <input
              id="name"
              name="name"
              required
              placeholder="e.g. Groceries"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:bg-[#1a1835] dark:border-[#252345]"
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
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:bg-[#1a1835] dark:border-[#252345]"
            />
          </div>
          <div className="w-40">
            <label htmlFor="categoryId" className="block text-sm font-medium">
              Category
            </label>
            <select
              id="categoryId"
              name="categoryId"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:bg-[#1a1835] dark:border-[#252345]"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mode toggle */}
        <div>
          <label className="block text-sm font-medium mb-1">Amount type</label>
          <div className="flex rounded-md border w-fit">
            <button
              type="button"
              onClick={() => setMode("fixed")}
              className={`px-3 py-1.5 text-sm ${
                mode === "fixed"
                  ? "bg-black text-white dark:bg-[#818cf8] dark:text-white"
                  : "hover:bg-gray-50 dark:hover:bg-[#1a1835]"
              }`}
            >
              Fixed monthly
            </button>
            <button
              type="button"
              onClick={() => setMode("custom")}
              className={`px-3 py-1.5 text-sm ${
                mode === "custom"
                  ? "bg-black text-white dark:bg-[#818cf8] dark:text-white"
                  : "hover:bg-gray-50 dark:hover:bg-[#1a1835]"
              }`}
            >
              Custom per month
            </button>
          </div>
        </div>

        {mode === "fixed" ? (
          <div className="w-40">
            <label htmlFor="monthlyAmount" className="block text-sm font-medium">
              Monthly amount
            </label>
            <input
              id="monthlyAmount"
              name="monthlyAmount"
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:bg-[#1a1835] dark:border-[#252345]"
            />
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {MONTH_SHORT.map((name, i) => (
              <div key={i}>
                <label className="block text-xs text-gray-500">{name}</label>
                <input
                  name={`month_${i}`}
                  type="number"
                  step="0.01"
                  defaultValue="0"
                  className="mt-0.5 w-full rounded-md border px-2 py-1.5 text-sm dark:bg-[#1a1835] dark:border-[#252345]"
                />
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add"}
          </Button>
          <Button type="button" variant="outline" onClick={() => { setOpen(false); setMode("fixed"); }}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
