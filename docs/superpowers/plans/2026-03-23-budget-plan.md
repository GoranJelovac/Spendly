# Budget Plan Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge Categories and Budget Lines into a single "Budget Plan" page with a sliding-window category carousel.

**Architecture:** Server component page at `/budget-plan` fetches budget, categories, and paginated lines. A client-side `CategoryCarousel` component manages category navigation with a sliding window of 5 visible slots. URL search params (`?cat=` and `?page=`) drive which category's lines are shown. Existing components (AddLineForm, BudgetLineTable, MonthlyBreakdown, ImportExportLines) are reused with minimal changes.

**Tech Stack:** Next.js App Router, React Server Components, Tailwind CSS, Prisma, Server Actions

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/app/(dashboard)/budget-plan/page.tsx` | Create | Server component: auth, data fetching, URL params |
| `src/components/budget-plan/category-carousel.tsx` | Create | Client component: sliding-window carousel with arrows, inline add/edit/delete |
| `src/components/budget-plan/budget-plan-content.tsx` | Create | Client wrapper: coordinates carousel + line table + totals |
| `src/actions/budget-line.ts` | Modify | Add `getBudgetLinesByCategoryPaginated()` |
| `src/components/budgets/budget-line-table.tsx` | Modify | Add optional `hideCategory` prop (skip grouping when viewing single category) |
| `src/components/layout/sidebar.tsx` | Modify | Replace Categories + Budget Lines nav items with Budget Plan |
| `src/components/layout/mobile-nav.tsx` | Modify | Same nav item change |
| `src/app/(dashboard)/categories/page.tsx` | Delete | Replaced by budget-plan |
| `src/components/categories/category-list.tsx` | Delete | Category management now inline in carousel |
| `src/app/(dashboard)/budgets/page.tsx` | Delete | Replaced by budget-plan |

---

### Task 1: Add server action for category-filtered budget lines

**Files:**
- Modify: `src/actions/budget-line.ts`

- [ ] **Step 1: Add `getBudgetLinesByCategoryPaginated` function**

Add this function after the existing `getBudgetLinesPaginated` (around line 30):

```typescript
export async function getBudgetLinesByCategoryPaginated(
  budgetId: string,
  categoryId: string,
  page: number = 1,
  pageSize: number = 20,
) {
  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");

  const [items, total] = await Promise.all([
    prisma.budgetLine.findMany({
      where: {
        budgetId,
        categoryId,
        budget: { userId: session.user.id },
      },
      include: { category: true },
      orderBy: { sortOrder: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.budgetLine.count({
      where: {
        budgetId,
        categoryId,
        budget: { userId: session.user.id },
      },
    }),
  ]);

  return { items, total };
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/actions/budget-line.ts
git commit -m "feat: add getBudgetLinesByCategoryPaginated server action"
```

---

### Task 2: Add `hideCategory` prop to BudgetLineTable

When viewing a single category, we don't need the category grouping headers.

**Files:**
- Modify: `src/components/budgets/budget-line-table.tsx`

- [ ] **Step 1: Add `hideCategory` optional prop**

In the component props (around line 30), add `hideCategory?: boolean`:

```typescript
export function BudgetLineTable({
  lines,
  currency,
  categories,
  currentPage,
  totalPages,
  pageSize,
  hideCategory = false,
}: {
  lines: BudgetLine[];
  currency: string;
  categories: CategoryOption[];
  currentPage: number;
  totalPages: number;
  pageSize: number;
  hideCategory?: boolean;
}) {
```

- [ ] **Step 2: Skip grouping when `hideCategory` is true**

In the render logic, when `hideCategory` is true, render lines as a flat list (no category group headers, no expand/collapse). The existing grouped rendering should only happen when `hideCategory` is false.

Find the section that renders `groupedLines` with category headers and wrap it:

```tsx
{hideCategory ? (
  // Flat list — no category headers
  filteredLines.map((line, idx) => (
    // ... same row rendering as inside grouped view
  ))
) : (
  // Existing grouped rendering with category headers
  groupedLines.map((group) => (
    // ... existing code
  ))
)}
```

- [ ] **Step 3: Verify it compiles and existing page still works**

Run: `npx tsc --noEmit`
Expected: No errors (default `hideCategory=false` preserves existing behavior)

- [ ] **Step 4: Commit**

```bash
git add src/components/budgets/budget-line-table.tsx
git commit -m "feat: add hideCategory prop to BudgetLineTable for flat rendering"
```

---

### Task 3: Create CategoryCarousel component

**Files:**
- Create: `src/components/budget-plan/category-carousel.tsx`

- [ ] **Step 1: Create the component file**

```typescript
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCategory, renameCategory, deleteCategory } from "@/actions/category";

type Category = {
  id: string;
  name: string;
  _count: { lines: number };
};

const VISIBLE_SLOTS = 5;

export function CategoryCarousel({
  categories,
  activeCategoryId,
  budgetId,
  totalLineCount,
}: {
  categories: Category[];
  activeCategoryId: string | null; // null = "All"
  budgetId: string;
  totalLineCount: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");

  // Build items list: "All" pseudo-item + real categories
  const items = [
    { id: "all", name: "All", count: totalLineCount, protected: true },
    ...categories.map((c) => ({
      id: c.id,
      name: c.name,
      count: c._count.lines,
      protected: c.name === "General",
    })),
  ];

  const activeIndex = activeCategoryId
    ? items.findIndex((i) => i.id === activeCategoryId)
    : 0;
  const currentIdx = activeIndex === -1 ? 0 : activeIndex;

  // Sliding window
  function getWindowStart() {
    const n = items.length;
    if (n <= VISIBLE_SLOTS) return 0;
    let start = currentIdx - Math.floor(VISIBLE_SLOTS / 2);
    if (start < 0) start = 0;
    if (start + VISIBLE_SLOTS > n) start = n - VISIBLE_SLOTS;
    return start;
  }

  const windowStart = getWindowStart();
  const windowSize = Math.min(VISIBLE_SLOTS, items.length);
  const windowEnd = windowStart + windowSize;
  const visibleItems = items.slice(windowStart, windowEnd);

  function navigateTo(idx: number) {
    if (idx < 0 || idx >= items.length) return;
    const item = items[idx];
    const catParam = item.id === "all" ? "" : `cat=${item.id}`;
    const url = `/budget-plan${catParam ? `?${catParam}` : ""}`;
    startTransition(() => router.push(url));
  }

  // Category CRUD handlers
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
    // If we deleted the active category, go to All
    if (activeCategoryId === id) {
      navigateTo(0);
    }
    startTransition(() => router.refresh());
  }

  return (
    <div>
      {/* Carousel bar */}
      <div className="flex items-center border-b-2 border-sp-border">
        {/* First + Prev arrows */}
        <button
          disabled={currentIdx === 0}
          onClick={() => navigateTo(0)}
          className="flex h-[42px] w-9 shrink-0 items-center justify-center text-[20px] font-semibold text-gray-500 transition-colors hover:text-sp-accent disabled:opacity-25 disabled:hover:text-gray-500 dark:text-sp-muted"
        >
          «
        </button>
        <button
          disabled={currentIdx === 0}
          onClick={() => navigateTo(currentIdx - 1)}
          className="flex h-[42px] w-9 shrink-0 items-center justify-center text-[20px] font-semibold text-gray-500 transition-colors hover:text-sp-accent disabled:opacity-25 disabled:hover:text-gray-500 dark:text-sp-muted"
        >
          ‹
        </button>

        {/* Visible slots */}
        <div className="flex flex-1 items-stretch justify-center overflow-hidden">
          {visibleItems.map((item, vIdx) => {
            const realIdx = windowStart + vIdx;
            const isActive = realIdx === currentIdx;
            const isLeftEdge = windowStart > 0 && vIdx === 0 && !isActive;
            const isRightEdge = windowEnd < items.length && vIdx === windowSize - 1 && !isActive;
            const isEdge = isLeftEdge || isRightEdge;

            return (
              <button
                key={item.id}
                onClick={() => navigateTo(realIdx)}
                className={`flex max-w-[180px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-[13px] font-medium transition-colors ${
                  isActive
                    ? "-mb-[2px] border-sp-accent text-sp-accent font-semibold text-[14px]"
                    : "-mb-[2px] border-transparent text-gray-500 hover:text-gray-800 dark:text-sp-muted dark:hover:text-sp-text"
                } ${isEdge ? "opacity-35 hover:opacity-60" : ""}`}
              >
                <span>{item.name}</span>
                <span
                  className={`rounded-lg border px-1.5 py-px text-[10px] font-medium ${
                    isActive
                      ? "border-sp-accent bg-sp-accent/[0.08] text-sp-accent"
                      : "border-sp-border bg-sp-surface text-gray-500 dark:text-sp-muted"
                  }`}
                >
                  {item.count}
                </span>
                {/* Edit/Delete icons on active non-protected */}
                {isActive && !item.protected && (
                  <span className="ml-0.5 flex gap-0.5">
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(item.id);
                        setEditName(item.name);
                      }}
                      className="flex h-[18px] w-[18px] cursor-pointer items-center justify-center rounded text-[11px] text-gray-500 transition-colors hover:bg-sp-accent/[0.08] hover:text-sp-accent dark:text-sp-muted"
                    >
                      ✎
                    </span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id, item.name);
                      }}
                      className="flex h-[18px] w-[18px] cursor-pointer items-center justify-center rounded text-[11px] text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-500 dark:text-sp-muted"
                    >
                      ✕
                    </span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Add category button */}
        <button
          onClick={() => setAddingCategory(true)}
          className="mx-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-dashed border-sp-border text-[14px] text-gray-500 transition-all hover:border-sp-accent hover:bg-sp-accent/[0.08] hover:text-sp-accent dark:text-sp-muted"
        >
          +
        </button>

        {/* Next + Last arrows */}
        <button
          disabled={currentIdx === items.length - 1}
          onClick={() => navigateTo(currentIdx + 1)}
          className="flex h-[42px] w-9 shrink-0 items-center justify-center text-[20px] font-semibold text-gray-500 transition-colors hover:text-sp-accent disabled:opacity-25 disabled:hover:text-gray-500 dark:text-sp-muted"
        >
          ›
        </button>
        <button
          disabled={currentIdx === items.length - 1}
          onClick={() => navigateTo(items.length - 1)}
          className="flex h-[42px] w-9 shrink-0 items-center justify-center text-[20px] font-semibold text-gray-500 transition-colors hover:text-sp-accent disabled:opacity-25 disabled:hover:text-gray-500 dark:text-sp-muted"
        >
          »
        </button>
      </div>

      {/* Inline add category form */}
      {addingCategory && (
        <form onSubmit={handleAddCategory} className="flex items-center gap-2 px-4 py-2">
          <input
            autoFocus
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="Category name..."
            className="flex-1 rounded-lg border border-sp-border bg-transparent px-3 py-1.5 text-sm outline-none focus:border-sp-accent"
          />
          <button
            type="submit"
            className="rounded-lg bg-sp-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-sp-accent-hover"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => { setAddingCategory(false); setNewCatName(""); setError(""); }}
            className="rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-sp-muted"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Inline rename form */}
      {editingId && (
        <div className="flex items-center gap-2 px-4 py-2">
          <input
            autoFocus
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename(editingId);
              if (e.key === "Escape") setEditingId(null);
            }}
            className="flex-1 rounded-lg border border-sp-border bg-transparent px-3 py-1.5 text-sm outline-none focus:border-sp-accent"
          />
          <button
            onClick={() => handleRename(editingId)}
            className="rounded-lg bg-sp-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-sp-accent-hover"
          >
            Save
          </button>
          <button
            onClick={() => { setEditingId(null); setError(""); }}
            className="rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-sp-muted"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="px-4 py-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors (or import path issues to fix)

- [ ] **Step 3: Commit**

```bash
git add src/components/budget-plan/category-carousel.tsx
git commit -m "feat: create CategoryCarousel component with sliding window navigation"
```

---

### Task 4: Create Budget Plan server page

**Files:**
- Create: `src/app/(dashboard)/budget-plan/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveBudget } from "@/actions/active-budget";
import { getBudget } from "@/actions/budget";
import { getBudgetLinesPaginated, getBudgetLinesByCategoryPaginated } from "@/actions/budget-line";
import { getCategories } from "@/actions/category";
import { BudgetLineTable } from "@/components/budgets/budget-line-table";
import { AddLineForm } from "@/components/budgets/add-line-form";
import { ImportExportLines } from "@/components/budgets/import-export-lines";
import { MonthlyBreakdown } from "@/components/budgets/monthly-breakdown";
import { CategoryCarousel } from "@/components/budget-plan/category-carousel";
import { getMonthlyAmounts } from "@/lib/budget-utils";

const PAGE_SIZE = 15;

export default async function BudgetPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const activeBudget = await getActiveBudget();

  if (!activeBudget) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 font-[var(--font-jakarta)] sm:px-6">
        <h1 className="mb-4 text-2xl font-bold">Budget Plan</h1>
        <div className="rounded-2xl bg-white p-8 text-center shadow-md dark:bg-sp-bg">
          <p className="text-gray-500">
            No budget selected. Create one using the selector in the sidebar.
          </p>
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const catParam = params.cat || null; // null = "All"
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);

  const [budget, categories] = await Promise.all([
    getBudget(activeBudget.id),
    getCategories(activeBudget.id),
  ]);
  if (!budget) return null;

  // Fetch lines: all or filtered by category
  const { items: paginatedLines, total } = catParam
    ? await getBudgetLinesByCategoryPaginated(activeBudget.id, catParam, page, PAGE_SIZE)
    : await getBudgetLinesPaginated(activeBudget.id, page, PAGE_SIZE);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const totalLineCount = budget.lines.length;
  const isAllView = !catParam;

  // Monthly totals across ALL lines (for MonthlyBreakdown)
  const monthTotals = Array(12).fill(0);
  for (const line of budget.lines) {
    const amounts = getMonthlyAmounts(line);
    for (let i = 0; i < 12; i++) {
      monthTotals[i] += amounts[i];
    }
  }

  // Category monthly/yearly totals (for the active category total bar)
  let catMonthly = 0;
  let catYearly = 0;
  if (catParam) {
    const catLines = budget.lines.filter((l) => l.categoryId === catParam);
    for (const line of catLines) {
      const amounts = getMonthlyAmounts(line);
      const avg = amounts.reduce((s, v) => s + v, 0) / 12;
      const yearly = amounts.reduce((s, v) => s + v, 0);
      catMonthly += avg;
      catYearly += yearly;
    }
  }

  // Find active category name
  const activeCatName = catParam
    ? categories.find((c) => c.id === catParam)?.name || "Unknown"
    : "All";

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 font-[var(--font-jakarta)] sm:px-6">
      <h1 className="mb-6 text-center text-2xl font-bold">Budget Plan</h1>

      <MonthlyBreakdown monthTotals={monthTotals} currency={budget.currency} />

      <CategoryCarousel
        categories={categories}
        activeCategoryId={catParam}
        budgetId={budget.id}
        totalLineCount={totalLineCount}
      />

      <div className="rounded-b-2xl border border-t-0 border-sp-border bg-sp-surface p-4">
        <AddLineForm
          budgetId={budget.id}
          categories={budget.categories}
          actionSlot={<ImportExportLines budgetId={budget.id} />}
        />
        <BudgetLineTable
          lines={paginatedLines}
          currency={budget.currency}
          categories={budget.categories}
          currentPage={page}
          totalPages={totalPages}
          pageSize={PAGE_SIZE}
          hideCategory={!isAllView}
        />

        {/* Category total bar (only when viewing a specific category) */}
        {catParam && (
          <div className="mt-2 flex justify-between rounded-[10px] bg-sp-accent/[0.08] px-3 py-2.5 text-[13px] font-semibold text-sp-accent">
            <span>{activeCatName} Total ({budget.lines.filter((l) => l.categoryId === catParam).length} lines)</span>
            <span>
              {new Intl.NumberFormat(undefined, { style: "currency", currency: budget.currency }).format(catMonthly)} / mo
              {" · "}
              {new Intl.NumberFormat(undefined, { style: "currency", currency: budget.currency }).format(catYearly)} / yr
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/budget-plan/page.tsx
git commit -m "feat: create Budget Plan page with carousel and category filtering"
```

---

### Task 5: Update navigation (sidebar + mobile nav)

**Files:**
- Modify: `src/components/layout/sidebar.tsx` (lines 7-13)
- Modify: `src/components/layout/mobile-nav.tsx` (lines 9-15)

- [ ] **Step 1: Update sidebar `mainItems`**

Replace the Categories and Budget Lines entries with a single Budget Plan entry:

```typescript
const mainItems = [
  { href: "/dashboard", label: "Dashboard", icon: "⌂" },
  { href: "/budget-plan", label: "Budget Plan", icon: "≡" },
  { href: "/expenses", label: "Expenses", icon: "⚖" },
  { href: "/contributions", label: "Contributions", icon: "↥" },
];
```

- [ ] **Step 2: Update mobile-nav `mainItems`**

Same change:

```typescript
const mainItems = [
  { href: "/dashboard", label: "Dashboard", icon: "⌂" },
  { href: "/budget-plan", label: "Budget Plan", icon: "≡" },
  { href: "/expenses", label: "Expenses", icon: "⚖" },
  { href: "/contributions", label: "Contributions", icon: "↥" },
];
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/sidebar.tsx src/components/layout/mobile-nav.tsx
git commit -m "feat: update navigation to show Budget Plan instead of Categories + Budget Lines"
```

---

### Task 6: Update BudgetLineTable pagination links

The pagination in BudgetLineTable currently links to `?page=N`. It needs to preserve the `?cat=` param when on the Budget Plan page.

**Files:**
- Modify: `src/components/budgets/budget-line-table.tsx`

- [ ] **Step 1: Check how Pagination component works**

Read `src/components/shared/pagination.tsx` to see how it generates page links. It likely uses `usePathname` + `useSearchParams`.

- [ ] **Step 2: Verify pagination preserves search params**

If the Pagination component already uses `useSearchParams` and merges params, no change is needed. If it only sets `?page=N`, update it to preserve existing params (especially `cat`).

The typical fix is:
```typescript
const params = new URLSearchParams(searchParams.toString());
params.set("page", String(pageNum));
return `${pathname}?${params.toString()}`;
```

- [ ] **Step 3: Commit if changes were needed**

```bash
git add src/components/shared/pagination.tsx
git commit -m "fix: preserve search params in pagination links"
```

---

### Task 7: Remove old pages and test

**Files:**
- Delete: `src/app/(dashboard)/categories/page.tsx`
- Delete: `src/components/categories/category-list.tsx`
- Delete: `src/app/(dashboard)/budgets/page.tsx`

- [ ] **Step 1: Delete old files**

```bash
rm src/app/(dashboard)/categories/page.tsx
rm src/components/categories/category-list.tsx
rm src/app/(dashboard)/budgets/page.tsx
```

- [ ] **Step 2: Check for any remaining imports of deleted files**

Search for imports of the deleted files and remove them:
```bash
grep -r "categories/page\|category-list\|budgets/page" src/
```

- [ ] **Step 3: Verify everything compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Manual test**

1. Open the app, click "Budget Plan" in sidebar
2. Verify carousel shows All + all categories
3. Click arrows to navigate between categories
4. Verify lines change when switching categories
5. Verify "All" view shows grouped lines
6. Verify add/edit/delete category works inline
7. Verify add line form works
8. Verify pagination works within a category
9. Check dark mode
10. Check mobile nav

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove old Categories and Budget Lines pages"
```

---

### Task 8: Update TODO.md

**Files:**
- Modify: `TODO.md`

- [ ] **Step 1: Mark completed items and clean up**

Mark the "Spojiti Categories i Budget Lines" item as done. The scroll/zebra items are also addressed by the redesign.

- [ ] **Step 2: Commit**

```bash
git add TODO.md
git commit -m "docs: update TODO after Budget Plan merge"
```
