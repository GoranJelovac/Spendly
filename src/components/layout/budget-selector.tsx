"use client";

import { useState } from "react";
import { setActiveBudget } from "@/actions/active-budget";
import { createBudget, deleteBudget, updateBudget } from "@/actions/budget";
import { currencyFlagUrl } from "@/lib/constants";
import { CurrencySelect } from "@/components/shared/currency-select";

type Budget = {
  id: string;
  name: string;
  year: number;
  currency: string;
};

const INPUT_CLS =
  "w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm dark:border-sp-border dark:bg-sp-bg";

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

  function closeAll() {
    setShowCreate(false);
    setShowEdit(false);
    setShowDelete(false);
    setDeleteConfirm("");
    setError("");
  }

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

  // Empty state
  if (budgets.length === 0 && !showCreate) {
    return (
      <div className="px-3">
        <button
          onClick={() => setShowCreate(true)}
          className="flex w-full items-center justify-center gap-1 rounded-lg bg-sp-accent px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-sp-accent-hover"
        >
          + New Budget
        </button>
      </div>
    );
  }

  // Delete replace — takes over entire card
  if (showDelete && activeBudget) {
    return (
      <div className="space-y-2 px-3">
        <div className="py-2 text-center">
          <p className="text-lg">⚠</p>
          <p className="mt-1 text-xs font-medium text-red-500">
            Permanently delete &ldquo;{activeBudget.name}&rdquo; and all its data?
          </p>
          <p className="mt-2 text-[10px] text-red-400">
            Type &ldquo;<span className="font-bold">{activeBudget.name}</span>&rdquo; to confirm:
          </p>
          <input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder={activeBudget.name}
            className="mt-1.5 w-full rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-center text-sm dark:border-red-800 dark:bg-sp-bg"
          />
          {error && <p className="mt-1 text-[10px] text-red-500">{error}</p>}
          <button
            onClick={handleDelete}
            disabled={loading || deleteConfirm !== activeBudget.name}
            className="mt-2 w-full rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? "..." : "Delete"}
          </button>
          <button
            onClick={closeAll}
            className="mt-1 w-full rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-gray-700 dark:text-sp-muted dark:hover:text-sp-text"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 px-3">
      {/* Dropdown + currency badge */}
      <div className="flex items-center gap-1.5">
        <select
          value={activeBudgetId || ""}
          onChange={(e) => handleSwitch(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm font-semibold dark:border-sp-border dark:bg-sp-bg"
        >
          {budgets.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        {activeBudget && (
          <span className="flex shrink-0 items-center gap-1.5 rounded-md bg-sp-accent/10 px-2 py-1 text-[11px] font-bold text-sp-accent">
            <img
              src={currencyFlagUrl(activeBudget.currency, 32)}
              alt=""
              className="h-[12px] w-[16px] rounded-[1px] object-cover"
            />
            {activeBudget.currency}
          </span>
        )}
      </div>

      {/* Spread action buttons */}
      {!showCreate && !showEdit && (
        <div className="flex gap-1">
          <button
            onClick={() => { closeAll(); setShowCreate(true); }}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-sp-accent/10 px-2 py-1.5 text-[11px] font-semibold text-sp-accent transition-colors hover:bg-sp-accent/20"
          >
            New
          </button>
          {activeBudget && (
            <>
              <button
                onClick={() => { closeAll(); setShowEdit(true); }}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-sp-accent/10 px-2 py-1.5 text-[11px] font-semibold text-sp-accent transition-colors hover:bg-sp-accent/20"
              >
                Edit
              </button>
              <button
                onClick={() => { closeAll(); setShowDelete(true); }}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-red-50 px-2 py-1.5 text-[11px] font-semibold text-red-500 transition-colors hover:bg-red-100 dark:bg-[rgba(239,68,68,0.08)] dark:text-red-400 dark:hover:bg-[rgba(239,68,68,0.15)]"
              >
                Del
              </button>
            </>
          )}
        </div>
      )}

      {/* Create form — stacked, full-width buttons, no separator */}
      {showCreate && (
        <form action={handleCreate} className="space-y-1.5">
          <input
            name="name"
            required
            placeholder="Budget name"
            className={INPUT_CLS}
          />
          <input
            name="year"
            type="number"
            required
            defaultValue={new Date().getFullYear()}
            className={INPUT_CLS}
          />
          <CurrencySelect name="currency" defaultValue="EUR" />
          {error && <p className="text-[10px] text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-sp-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-sp-accent-hover disabled:opacity-50"
          >
            {loading ? "..." : "Create"}
          </button>
          <button
            type="button"
            onClick={() => setShowCreate(false)}
            className="w-full rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-gray-700 dark:text-sp-muted dark:hover:text-sp-text"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Edit form — stacked, full-width buttons, no separator */}
      {showEdit && activeBudget && (
        <form action={handleEdit} className="space-y-1.5">
          <input
            name="name"
            required
            defaultValue={activeBudget.name}
            className={INPUT_CLS}
          />
          <input
            name="year"
            type="number"
            required
            defaultValue={activeBudget.year}
            className={INPUT_CLS}
          />
          <CurrencySelect name="currency" defaultValue={activeBudget.currency} />
          {error && <p className="text-[10px] text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-sp-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-sp-accent-hover disabled:opacity-50"
          >
            {loading ? "..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setShowEdit(false)}
            className="w-full rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-gray-700 dark:text-sp-muted dark:hover:text-sp-text"
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}
