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
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
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
    if (!activeBudgetId || !activeBudget) return;
    if (deleteConfirm !== activeBudget.name) {
      setError("Name does not match.");
      return;
    }
    setError("");
    setLoading(true);
    await deleteBudget(activeBudgetId);
    setShowDelete(false);
    setDeleteConfirm("");
    setLoading(false);
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
        className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm font-medium dark:border-gray-700 dark:bg-gray-800"
      >
        {budgets.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name} ({b.year})
          </option>
        ))}
      </select>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5">
        <button
          title="New budget"
          onClick={() => { setShowCreate(true); setShowEdit(false); setShowDelete(false); }}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          ＋
        </button>
        {activeBudget && (
          <>
            <button
              title="Edit budget"
              onClick={() => { setShowEdit(true); setShowCreate(false); setShowDelete(false); }}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              ✎
            </button>
            <button
              title="Delete budget"
              onClick={() => { setShowDelete(true); setShowCreate(false); setShowEdit(false); setDeleteConfirm(""); setError(""); }}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-red-200 text-sm text-red-500 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              ✕
            </button>
          </>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <form action={handleCreate} className="space-y-2 rounded-lg border border-gray-200 p-2 dark:border-gray-700">
          <input
            name="name"
            required
            placeholder="Budget name"
            className="w-full rounded-lg border border-gray-200 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800"
          />
          <div className="flex gap-2">
            <input
              name="year"
              type="number"
              required
              defaultValue={new Date().getFullYear()}
              className="w-20 rounded-lg border border-gray-200 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800"
            />
            <select
              name="currency"
              defaultValue="EUR"
              className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800"
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
        <form action={handleEdit} className="space-y-2 rounded-lg border border-gray-200 p-2 dark:border-gray-700">
          <input
            name="name"
            required
            defaultValue={activeBudget.name}
            className="w-full rounded-lg border border-gray-200 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800"
          />
          <div className="flex gap-2">
            <input
              name="year"
              type="number"
              required
              defaultValue={activeBudget.year}
              className="w-20 rounded-lg border border-gray-200 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800"
            />
            <select
              name="currency"
              defaultValue={activeBudget.currency}
              className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800"
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

      {/* Delete confirmation */}
      {showDelete && activeBudget && (
        <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
          <p className="text-xs font-medium text-red-700 dark:text-red-400">
            This will permanently delete this budget, all its lines and expenses.
          </p>
          <p className="text-xs text-red-600 dark:text-red-400">
            Type &ldquo;<span className="font-bold">{activeBudget.name}</span>&rdquo; to confirm:
          </p>
          <input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder={activeBudget.name}
            className="w-full rounded-lg border border-red-200 px-2 py-1 text-sm dark:border-red-800 dark:bg-gray-800"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-1">
            <Button
              size="xs"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading || deleteConfirm !== activeBudget.name}
            >
              {loading ? "..." : "Delete"}
            </Button>
            <Button size="xs" variant="outline" onClick={() => { setShowDelete(false); setDeleteConfirm(""); setError(""); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
