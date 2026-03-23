"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCategory, renameCategory, deleteCategory } from "@/actions/category";

type Category = {
  id: string;
  name: string;
  _count: { lines: number };
};

type DropdownItem = {
  id: string;
  name: string;
  count: number;
  protected: boolean;
};

export function CategorySelector({
  categories,
  activeCategoryId,
  budgetId,
  totalLineCount,
}: {
  categories: Category[];
  activeCategoryId: string | null;
  budgetId: string;
  totalLineCount: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const items: DropdownItem[] = [
    { id: "all", name: "All", count: totalLineCount, protected: true },
    ...categories.map((c) => ({
      id: c.id,
      name: c.name,
      count: c._count.lines,
      protected: c.name === "General",
    })),
  ];

  const activeItem = activeCategoryId
    ? items.find((i) => i.id === activeCategoryId) || items[0]
    : items[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function navigateTo(item: DropdownItem) {
    setDropdownOpen(false);
    const catParam = item.id === "all" ? "" : `cat=${item.id}`;
    const url = `/budget-plan${catParam ? `?${catParam}` : ""}`;
    startTransition(() => router.push(url));
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const fd = new FormData();
    fd.set("name", newCatName.trim());
    const result = await createCategory(budgetId, fd);
    if (result?.error) {
      setError(result.error);
    } else {
      setNewCatName("");
      setAddingCategory(false);
      startTransition(() => router.refresh());
    }
  }

  async function handleRename(id: string) {
    setError("");
    const fd = new FormData();
    fd.set("name", editName.trim());
    const result = await renameCategory(id, fd);
    if (result?.error) {
      setError(result.error);
    } else {
      setEditingId(null);
      startTransition(() => router.refresh());
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? Its lines will move to General.`)) return;
    await deleteCategory(id);
    if (activeCategoryId === id) {
      navigateTo(items[0]);
    }
    startTransition(() => router.refresh());
  }

  return (
    <div>
      <div className="flex items-center gap-2.5 rounded-t-2xl border border-sp-border bg-sp-surface px-3.5 py-2.5">
        <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-gray-500 dark:text-sp-muted">
          Category
        </span>

        {/* Dropdown */}
        <div className="relative max-w-[280px] flex-1" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex w-full items-center justify-between rounded-[10px] border border-sp-border bg-white px-3 py-2 text-[14px] font-semibold transition-colors hover:border-sp-accent dark:bg-sp-bg"
          >
            <span>
              {activeItem.name}
              <span className="ml-1.5 text-[11px] font-medium text-gray-500 dark:text-sp-muted">
                · {activeItem.count} lines
              </span>
            </span>
            <span className="ml-2 text-[10px] text-gray-500 dark:text-sp-muted">▼</span>
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-xl border border-sp-border bg-white p-1 shadow-lg dark:bg-sp-bg">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigateTo(item)}
                  className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium transition-colors hover:bg-sp-accent/[0.06] ${
                    item.id === activeItem.id
                      ? "bg-sp-accent/[0.06] font-semibold text-sp-accent"
                      : "text-gray-700 dark:text-sp-text"
                  }`}
                >
                  <span>{item.name}</span>
                  <span className="text-[11px] text-gray-500 dark:text-sp-muted">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category actions: New, Rename, Delete */}
        <div className="flex gap-1.5">
          <button
            onClick={() => setAddingCategory(true)}
            className="flex h-7 items-center rounded-lg border border-sp-border px-2.5 text-[12px] font-medium text-gray-500 transition-all hover:border-sp-accent hover:bg-sp-accent/[0.06] hover:text-sp-accent dark:text-sp-muted"
          >
            New
          </button>
          {!activeItem.protected && (
            <>
              <button
                onClick={() => { setEditingId(activeItem.id); setEditName(activeItem.name); }}
                className="flex h-7 items-center rounded-lg border border-sp-border px-2.5 text-[12px] font-medium text-gray-500 transition-all hover:border-sp-accent hover:bg-sp-accent/[0.06] hover:text-sp-accent dark:text-sp-muted"
              >
                Rename
              </button>
              <button
                onClick={() => handleDelete(activeItem.id, activeItem.name)}
                className="flex h-7 items-center rounded-lg border border-sp-border px-2.5 text-[12px] font-medium text-gray-500 transition-all hover:border-red-400 hover:bg-red-500/[0.06] hover:text-red-500 dark:text-sp-muted"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Inline add category form */}
      {addingCategory && (
        <div className="flex items-center gap-2 border-x border-sp-border bg-sp-surface px-3.5 py-2">
          <input
            autoFocus
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="Category name..."
            className="flex-1 rounded-lg border border-sp-border bg-white px-3 py-1.5 text-sm outline-none focus:border-sp-accent dark:bg-sp-bg"
          />
          <button type="button" onClick={(e) => { e.preventDefault(); handleAddCategory(e); }} className="rounded-lg bg-sp-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-sp-accent-hover">
            Add
          </button>
          <button
            type="button"
            onClick={() => { setAddingCategory(false); setNewCatName(""); setError(""); }}
            className="rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-sp-muted"
          >
            Cancel
          </button>
          {error && <p className="ml-2 text-xs text-red-500">{error}</p>}
        </div>
      )}

      {/* Inline rename form */}
      {editingId && (
        <div className="flex items-center gap-2 border-x border-sp-border bg-sp-surface px-3.5 py-2">
          <input
            autoFocus
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename(editingId);
              if (e.key === "Escape") setEditingId(null);
            }}
            className="flex-1 rounded-lg border border-sp-border bg-white px-3 py-1.5 text-sm outline-none focus:border-sp-accent dark:bg-sp-bg"
          />
          <button onClick={() => handleRename(editingId)} className="rounded-lg bg-sp-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-sp-accent-hover">
            Save
          </button>
          <button
            onClick={() => { setEditingId(null); setError(""); }}
            className="rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-sp-muted"
          >
            Cancel
          </button>
          {error && <p className="ml-2 text-xs text-red-500">{error}</p>}
        </div>
      )}
    </div>
  );
}
