"use client";

import { useState } from "react";
import { setActiveBudget } from "@/actions/active-budget";
import { createBudget, deleteBudget, updateBudget } from "@/actions/budget";
import { Button } from "@/components/ui/button";

type Budget = {
  id: string;
  name: string;
  year: number;
  currency: string;
};

export function BudgetSelector({
  budgets,
  activeBudgetId,
}: {
  budgets: Budget[];
  activeBudgetId: string | null;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const activeBudget = budgets.find((b) => b.id === activeBudgetId);

  async function handleSwitch(budgetId: string) {
    await setActiveBudget(budgetId);
  }

  async function handleCreate(formData: FormData) {
    setError("");
    setLoading(true);
    const result = await createBudget(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setShowCreate(false);
    }
    setLoading(false);
  }

  async function handleEdit(formData: FormData) {
    if (!activeBudgetId) return;
    setError("");
    setLoading(true);
    const result = await updateBudget(activeBudgetId, formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setShowEdit(false);
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!activeBudgetId) return;
    if (!confirm("Delete this budget and all its lines and expenses?")) return;
    await deleteBudget(activeBudgetId);
  }

  if (budgets.length === 0 && !showCreate) {
    return (
      <div className="px-3">
        <Button
          size="sm"
          className="w-full"
          onClick={() => setShowCreate(true)}
        >
          + New Budget
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2 px-3">
      {/* Budget dropdown */}
      <select
        value={activeBudgetId || ""}
        onChange={(e) => handleSwitch(e.target.value)}
        className="w-full rounded-md border bg-white px-2 py-1.5 text-sm font-medium dark:bg-gray-800 dark:border-gray-700"
      >
        {budgets.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name} ({b.year})
          </option>
        ))}
      </select>

      {/* Action buttons */}
      <div className="flex gap-1">
        <Button
          size="xs"
          variant="outline"
          className="flex-1 text-xs"
          onClick={() => { setShowCreate(true); setShowEdit(false); }}
        >
          + New
        </Button>
        {activeBudget && (
          <>
            <Button
              size="xs"
              variant="outline"
              className="flex-1 text-xs"
              onClick={() => { setShowEdit(true); setShowCreate(false); }}
            >
              Edit
            </Button>
            <Button
              size="xs"
              variant="destructive"
              className="text-xs"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <form action={handleCreate} className="space-y-2 rounded-md border p-2">
          <input
            name="name"
            required
            placeholder="Budget name"
            className="w-full rounded border px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-700"
          />
          <div className="flex gap-2">
            <input
              name="year"
              type="number"
              required
              defaultValue={new Date().getFullYear()}
              className="w-20 rounded border px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-700"
            />
            <select
              name="currency"
              defaultValue="EUR"
              className="flex-1 rounded border px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
              <option value="RSD">RSD</option>
            </select>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-1">
            <Button size="xs" type="submit" disabled={loading}>
              {loading ? "..." : "Create"}
            </Button>
            <Button size="xs" variant="outline" type="button" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Edit form */}
      {showEdit && activeBudget && (
        <form action={handleEdit} className="space-y-2 rounded-md border p-2">
          <input
            name="name"
            required
            defaultValue={activeBudget.name}
            className="w-full rounded border px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-700"
          />
          <div className="flex gap-2">
            <input
              name="year"
              type="number"
              required
              defaultValue={activeBudget.year}
              className="w-20 rounded border px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-700"
            />
            <select
              name="currency"
              defaultValue={activeBudget.currency}
              className="flex-1 rounded border px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
              <option value="RSD">RSD</option>
            </select>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-1">
            <Button size="xs" type="submit" disabled={loading}>
              {loading ? "..." : "Save"}
            </Button>
            <Button size="xs" variant="outline" type="button" onClick={() => setShowEdit(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
