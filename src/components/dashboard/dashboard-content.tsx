"use client";

import { useState, useEffect, useMemo } from "react";
import { getDashboardData, type DashboardData } from "@/actions/dashboard";
import { PlannedVsSpentChart, BudgetBreakdownChart, SpendingOverviewChart } from "@/components/dashboard/charts";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <h3 className="font-semibold">{title}</h3>
        <span className="text-gray-400 text-sm">{open ? "\u25B2" : "\u25BC"}</span>
      </button>
      {open && <div className="border-t px-4 pb-4 pt-3">{children}</div>}
    </div>
  );
}

export function DashboardContent({
  budgetId,
  budgetName,
  budgetYear,
  budgetCurrency,
}: {
  budgetId: string;
  budgetName: string;
  budgetYear: number;
  budgetCurrency: string;
}) {
  const [period, setPeriod] = useState<"month" | "ytd" | "bymonth">("month");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [byMonthMode, setByMonthMode] = useState<"single" | "cumulative">("single");
  const [viewMode, setViewMode] = useState<"lines" | "categories">("lines");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getDashboardData(
      budgetId,
      period,
      period === "bymonth" ? selectedMonth : undefined,
      period === "bymonth" ? byMonthMode : undefined
    ).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [budgetId, period, selectedMonth, byMonthMode]);

  const filteredLines = useMemo(() => {
    if (!data) return [];
    if (categoryFilter === "all") return data.lines;
    return data.lines.filter((l) => l.categoryId === categoryFilter);
  }, [data, categoryFilter]);

  const displayTotals = useMemo(() => {
    if (!data) return { planned: 0, spent: 0, remaining: 0, percentage: 0 };
    if (categoryFilter === "all" && viewMode === "lines") return data.totals;

    const items = viewMode === "categories" && categoryFilter === "all"
      ? data.categories
      : filteredLines;

    const planned = items.reduce((s, l) => s + l.planned, 0);
    const spent = items.reduce((s, l) => s + l.spent, 0);
    const remaining = planned - spent;
    const percentage = planned > 0 ? (spent / planned) * 100 : 0;
    return { planned, spent, remaining, percentage };
  }, [data, filteredLines, viewMode, categoryFilter]);

  const displayItems = useMemo(() => {
    if (!data) return [];
    if (viewMode === "categories") {
      if (categoryFilter !== "all") return filteredLines;
      return data.categories;
    }
    return filteredLines;
  }, [data, viewMode, categoryFilter, filteredLines]);

  const uniqueCategories = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, string>();
    data.lines.forEach((l) => map.set(l.categoryId, l.categoryName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [data]);

  return (
    <div className="space-y-4">
      {/* Budget name - always visible */}
      <p className="text-gray-500">
        {budgetName} &middot; {budgetYear} &middot; {budgetCurrency}
      </p>

      {/* Filters section */}
      <CollapsibleSection title="Filters">
        <div className="space-y-3">
          {/* Period selector */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-gray-500 w-12">Period</span>
            <div className="flex rounded-md border">
              {(["month", "ytd", "bymonth"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-sm ${
                    period === p
                      ? "bg-black text-white dark:bg-white dark:text-black"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  {p === "ytd" ? "Year to Date" : p === "month" ? "This Month" : "By Month"}
                </button>
              ))}
            </div>
          </div>

          {/* By Month controls */}
          {period === "bymonth" && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-gray-500 w-12">Month</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="rounded-md border px-3 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-700"
              >
                {MONTH_NAMES.map((name, i) => (
                  <option key={i} value={i}>{name}</option>
                ))}
              </select>
              <div className="flex rounded-md border">
                <button
                  onClick={() => setByMonthMode("single")}
                  className={`px-3 py-1.5 text-sm ${
                    byMonthMode === "single"
                      ? "bg-black text-white dark:bg-white dark:text-black"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  Only {MONTH_NAMES[selectedMonth]}
                </button>
                <button
                  onClick={() => setByMonthMode("cumulative")}
                  className={`px-3 py-1.5 text-sm ${
                    byMonthMode === "cumulative"
                      ? "bg-black text-white dark:bg-white dark:text-black"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  Jan &ndash; {MONTH_NAMES[selectedMonth]}
                </button>
              </div>
            </div>
          )}

          {/* View mode + category filter */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-gray-500 w-12">View</span>
            <div className="flex rounded-md border">
              <button
                onClick={() => { setViewMode("lines"); setCategoryFilter("all"); }}
                className={`px-3 py-1.5 text-sm ${
                  viewMode === "lines"
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                Lines
              </button>
              <button
                onClick={() => { setViewMode("categories"); setCategoryFilter("all"); }}
                className={`px-3 py-1.5 text-sm ${
                  viewMode === "categories"
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                Categories
              </button>
            </div>
            {viewMode === "categories" && uniqueCategories.length > 1 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-md border px-3 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="all">All categories</option>
                {uniqueCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : !data ? (
        <p className="text-gray-500">No data found.</p>
      ) : (
        <>
          {/* Summary section */}
          <CollapsibleSection title="Summary">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <SummaryCard
                label="Planned"
                value={displayTotals.planned}
                currency={budgetCurrency}
              />
              <SummaryCard
                label="Spent"
                value={displayTotals.spent}
                currency={budgetCurrency}
              />
              <SummaryCard
                label="Remaining"
                value={displayTotals.remaining}
                currency={budgetCurrency}
                color={displayTotals.remaining < 0 ? "red" : "green"}
              />
              <SummaryCard
                label="Used"
                value={displayTotals.percentage}
                suffix="%"
                color={displayTotals.percentage > 100 ? "red" : undefined}
              />
            </div>
          </CollapsibleSection>

          {/* Charts section */}
          <CollapsibleSection title="Charts">
            <PlannedVsSpentChart
              data={displayItems.map((l) => ({
                name: l.name,
                planned: l.planned,
                spent: l.spent,
              }))}
              currency={budgetCurrency}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <BudgetBreakdownChart
                data={displayItems.map((l) => ({
                  name: l.name,
                  planned: l.planned,
                  spent: l.spent,
                }))}
                currency={budgetCurrency}
              />
              <SpendingOverviewChart
                data={displayItems.map((l) => ({
                  name: l.name,
                  planned: l.planned,
                  spent: l.spent,
                }))}
                totalPlanned={displayTotals.planned}
                currency={budgetCurrency}
              />
            </div>
          </CollapsibleSection>

          {/* Details section */}
          <CollapsibleSection title="Details">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b text-gray-500">
                  <tr>
                    <th className="pb-2 font-medium">
                      {viewMode === "categories" && categoryFilter === "all" ? "Category" : "Line"}
                    </th>
                    {viewMode === "lines" && (
                      <th className="pb-2 font-medium">Category</th>
                    )}
                    <th className="pb-2 text-right font-medium">
                      Planned ({budgetCurrency})
                    </th>
                    <th className="pb-2 text-right font-medium">
                      Spent ({budgetCurrency})
                    </th>
                    <th className="pb-2 text-right font-medium">
                      Remaining ({budgetCurrency})
                    </th>
                    <th className="pb-2 font-medium">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {displayItems.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-2 font-medium">{item.name}</td>
                      {viewMode === "lines" && (
                        <td className="py-2 text-xs text-gray-500">
                          {"categoryName" in item ? String(item.categoryName) : ""}
                        </td>
                      )}
                      <td className="py-2 text-right">{item.planned.toFixed(2)}</td>
                      <td className="py-2 text-right">{item.spent.toFixed(2)}</td>
                      <td
                        className={`py-2 text-right ${
                          item.remaining < 0 ? "text-red-500" : "text-green-600"
                        }`}
                      >
                        {item.remaining.toFixed(2)}
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                            <div
                              className={`h-2 rounded-full ${
                                item.percentage > 100
                                  ? "bg-red-500"
                                  : item.percentage > 80
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              }`}
                              style={{
                                width: `${Math.min(item.percentage, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="w-12 text-xs text-gray-500">
                            {item.percentage.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  currency,
  suffix,
  color,
}: {
  label: string;
  value: number;
  currency?: string;
  suffix?: string;
  color?: "red" | "green";
}) {
  return (
    <div className="rounded-lg border bg-gray-50 p-3 dark:bg-gray-800">
      <p className="text-xs text-gray-500">{label}</p>
      <p
        className={`text-xl font-bold ${
          color === "red"
            ? "text-red-500"
            : color === "green"
            ? "text-green-600"
            : ""
        }`}
      >
        {value.toFixed(suffix === "%" ? 1 : 2)}
        {suffix || (currency ? ` ${currency}` : "")}
      </p>
    </div>
  );
}
