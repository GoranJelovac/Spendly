"use client";

import { useState } from "react";
import { createCategory, deleteCategory, renameCategory } from "@/actions/category";
import { Button } from "@/components/ui/button";

type CategoryItem = {
  id: string;
  name: string;
  _count: { lines: number };
};

export function CategoryList({
  categories,
  budgetId,
}: {
  categories: CategoryItem[];
  budgetId: string;
}) {
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleCreate(formData: FormData) {
    setError("");
    const result = await createCategory(budgetId, formData);
    if (result?.error) setError(result.error);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? Lines will be moved to General.`)) return;
    setError("");
    const result = await deleteCategory(id);
    if (result?.error) setError(result.error);
  }

  async function handleRename(id: string, formData: FormData) {
    setError("");
    const result = await renameCategory(id, formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setEditingId(null);
    }
  }

  return (
    <div>
      {/* Add form */}
      <form action={handleCreate} className="mb-6 flex gap-2">
        <input
          name="name"
          required
          placeholder="New category name"
          className="rounded-md border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
        />
        <Button type="submit" size="sm">
          Add Category
        </Button>
      </form>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      {/* Category list */}
      <div className="rounded-lg border bg-white dark:bg-gray-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b text-gray-500">
            <tr>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 text-right font-medium">Lines</th>
              <th className="p-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} className="border-b last:border-0">
                <td className="p-3">
                  {editingId === cat.id ? (
                    <form
                      action={(fd) => handleRename(cat.id, fd)}
                      className="flex gap-2"
                    >
                      <input
                        name="name"
                        defaultValue={cat.name}
                        required
                        className="rounded-md border px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-700"
                      />
                      <Button size="sm" type="submit">Save</Button>
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </form>
                  ) : (
                    <span className="font-medium">{cat.name}</span>
                  )}
                </td>
                <td className="p-3 text-right text-gray-500">
                  {cat._count.lines}
                </td>
                <td className="p-3 text-right">
                  {cat.name !== "General" && editingId !== cat.id && (
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(cat.id)}
                      >
                        Rename
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(cat.id, cat.name)}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
