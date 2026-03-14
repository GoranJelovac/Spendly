"use client";

import { useState } from "react";
import { deleteBudgetLine, updateBudgetLine } from "@/actions/budget-line";
import { Button } from "@/components/ui/button";

type BudgetLine = {
  id: string;
  name: string;
  code: string | null;
  monthlyAmount: number;
  sortOrder: number;
};

export function BudgetLineTable({
  lines,
  currency,
}: {
  lines: BudgetLine[];
  currency: string;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleUpdate(id: string, formData: FormData) {
    setError("");
    const result = await updateBudgetLine(id, formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setEditingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this line and all its expenses?")) return;
    await deleteBudgetLine(id);
  }

  if (lines.length === 0) {
    return <p className="text-gray-500">No budget lines yet. Add one above!</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b text-gray-500">
          <tr>
            <th className="pb-2 font-medium">Name</th>
            <th className="pb-2 font-medium">Code</th>
            <th className="pb-2 text-right font-medium">Monthly ({currency})</th>
            <th className="pb-2 text-right font-medium">Yearly ({currency})</th>
            <th className="pb-2 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.id} className="border-b">
              {editingId === line.id ? (
                <td colSpan={5} className="py-2">
                  <form
                    action={(fd) => handleUpdate(line.id, fd)}
                    className="flex items-end gap-2"
                  >
                    <input
                      name="name"
                      defaultValue={line.name}
                      required
                      className="w-40 rounded-md border px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-700"
                    />
                    <input
                      name="code"
                      defaultValue={line.code || ""}
                      className="w-20 rounded-md border px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-700"
                    />
                    <input
                      name="monthlyAmount"
                      type="number"
                      step="0.01"
                      defaultValue={line.monthlyAmount}
                      required
                      className="w-28 rounded-md border px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-700"
                    />
                    <Button size="sm" type="submit">
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </form>
                  {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
                </td>
              ) : (
                <>
                  <td className="py-2">{line.name}</td>
                  <td className="py-2 text-gray-500">{line.code || "—"}</td>
                  <td className="py-2 text-right">{line.monthlyAmount.toFixed(2)}</td>
                  <td className="py-2 text-right">
                    {(line.monthlyAmount * 12).toFixed(2)}
                  </td>
                  <td className="py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(line.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(line.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
