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
    <div className="rounded-xl bg-white shadow-sm dark:bg-gray-900">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl"
      >
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {title}
        </h3>
        <span
          className={`text-gray-400 text-xs transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        >
          &#9660;
        </span>
      </button>
      {open && <div className="border-t border-gray-100 px-5 pb-5 pt-4 dark:border-gray-800">{children}</div>}
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
        active
          ? "bg-blue-600 text-white shadow-sm"
          : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
      }`}
    >
      {children}
    </button>
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
    if (!data) return { planned: 0, contributed: 0, available: 0, spent: 0, remaining: 0, percentage: 0 };
    if (categoryFilter === "all" && viewMode === "lines") return data.totals;

    const items = viewMode === "categories" && categoryFilter === "all"
      ? data.categories
      : filteredLines;

    const planned = items.reduce((s, l) => s + l.planned, 0);
    const contributed = items.reduce((s, l) => s + l.contributed, 0);
    const available = items.reduce((s, l) => s + l.available, 0);
    const spent = items.reduce((s, l) => s + l.spent, 0);
    const remaining = available - spent;
    const percentage = available > 0 ? (spent / available) * 100 : 0;
    return { planned, contributed, available, spent, remaining, percentage };
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
      {/* Budget name */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-2xl font-bold">{budgetName}</span>
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          {budgetYear}
        </span>
        <span className="text-sm text-gray-400">{budgetCurrency}</span>
      </div>

      {/* Filters */}
      <CollapsibleSection title="Filters">
        <div className="space-y-3">
          {/* Period */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="w-14 text-xs font-medium text-gray-500">Period</span>
            <div className="flex gap-1 rounded-full bg-gray-100 p-0.5 dark:bg-gray-800">
              <ToggleButton active={period === "month"} onClick={() => setPeriod("month")}>
                This Month
              </ToggleButton>
              <ToggleButton active={period === "ytd"} onClick={() => setPeriod("ytd")}>
                Year to Date
              </ToggleButton>
              <ToggleButton active={period === "bymonth"} onClick={() => setPeriod("bymonth")}>
                By Month
              </ToggleButton>
            </div>
          </div>

          {/* By Month controls */}
          {period === "bymonth" && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="w-14 text-xs font-medium text-gray-500">Month</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
              >
                {MONTH_NAMES.map((name, i) => (
                  <option key={i} value={i}>{name}</option>
                ))}
              </select>
              <div className="flex gap-1 rounded-full bg-gray-100 p-0.5 dark:bg-gray-800">
                <ToggleButton active={byMonthMode === "single"} onClick={() => setByMonthMode("single")}>
                  Only {MONTH_NAMES[selectedMonth]}
                </ToggleButton>
                <ToggleButton active={byMonthMode === "cumulative"} onClick={() => setByMonthMode("cumulative")}>
                  Jan &ndash; {MONTH_NAMES[selectedMonth]}
                </ToggleButton>
              </div>
            </div>
          )}

          {/* View mode */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="w-14 text-xs font-medium text-gray-500">View</span>
            <div className="flex gap-1 rounded-full bg-gray-100 p-0.5 dark:bg-gray-800">
              <ToggleButton
                active={viewMode === "lines"}
                onClick={() => { setViewMode("lines"); setCategoryFilter("all"); }}
              >
                Lines
              </ToggleButton>
              <ToggleButton
                active={viewMode === "categories"}
                onClick={() => { setViewMode("categories"); setCategoryFilter("all"); }}
              >
                Categories
              </ToggleButton>
            </div>
            {viewMode === "categories" && uniqueCategories.length > 1 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
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
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : !data ? (
        <p className="text-gray-500">No data found.</p>
      ) : (
        <>
          {/* Summary */}
          <CollapsibleSection title="Summary">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <SummaryCard
                label="Planned"
                value={displayTotals.planned}
                currency={budgetCurrency}
                accent="blue"
              />
              <SummaryCard
                label="Contributed"
                value={displayTotals.contributed}
                currency={budgetCurrency}
                accent="purple"
              />
              <SummaryCard
                label="Available"
                value={displayTotals.available}
                currency={budgetCurrency}
                accent="cyan"
              />
              <SummaryCard
                label="Spent"
                value={displayTotals.spent}
                currency={budgetCurrency}
                accent="red"
              />
              <SummaryCard
                label="Remaining"
                value={displayTotals.remaining}
                currency={budgetCurrency}
                accent="green"
                valueColor={displayTotals.remaining < 0 ? "red" : "green"}
              />
              <SummaryCard
                label="Used"
                value={displayTotals.percentage}
                suffix="%"
                accent="amber"
                valueColor={displayTotals.percentage > 100 ? "red" : undefined}
              />
            </div>
          </CollapsibleSection>

          {/* Charts */}
          <CollapsibleSection title="Charts">
            <PlannedVsSpentChart
              data={displayItems.map((l) => ({
                name: l.name,
                planned: l.planned,
                contributed: l.contributed,
                spent: l.spent,
              }))}
              currency={budgetCurrency}
            />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <BudgetBreakdownChart
                data={displayItems.map((l) => ({
                  name: l.name,
                  planned: l.planned,
                  contributed: l.contributed,
                  spent: l.spent,
                }))}
                currency={budgetCurrency}
              />
              <SpendingOverviewChart
                data={displayItems.map((l) => ({
                  name: l.name,
                  planned: l.available,
                  contributed: 0,
                  spent: l.spent,
                }))}
                totalPlanned={displayTotals.available}
                currency={budgetCurrency}
              />
            </div>
          </CollapsibleSection>

          {/* Details */}
          <CollapsibleSection title="Details">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-gray-500">
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="pb-3 font-medium">
                      {viewMode === "categories" && categoryFilter === "all" ? "Category" : "Line"}
                    </th>
                    {viewMode === "lines" && (
                      <th className="pb-3 font-medium">Category</th>
                    )}
                    <th className="pb-3 text-right font-medium">Planned</th>
                    <th className="pb-3 text-right font-medium">Contrib.</th>
                    <th className="pb-3 text-right font-medium">Available</th>
                    <th className="pb-3 text-right font-medium">Spent</th>
                    <th className="pb-3 text-right font-medium">Remaining</th>
                    <th className="pb-3 font-medium">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {displayItems.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50 last:border-0 dark:border-gray-800/50">
                      <td className="py-2.5 font-medium">{item.name}</td>
                      {viewMode === "lines" && (
                        <td className="py-2.5">
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            {"categoryName" in item ? String(item.categoryName) : ""}
                          </span>
                        </td>
                      )}
                      <td className="py-2.5 text-right tabular-nums">{item.planned.toFixed(2)}</td>
                      <td className="py-2.5 text-right tabular-nums ">{item.contributed > 0 ? item.contributed.toFixed(2) : "—"}</td>
                      <td className="py-2.5 text-right tabular-nums font-medium">{item.available.toFixed(2)}</td>
                      <td className="py-2.5 text-right tabular-nums">{item.spent.toFixed(2)}</td>
                      <td
                        className={`py-2.5 text-right tabular-nums font-medium ${
                          item.remaining < 0 ? "text-red-500" : "text-green-600"
                        }`}
                      >
                        {item.remaining.toFixed(2)}
                      </td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ease-out ${
                                item.percentage > 100
                                  ? "bg-red-500"
                                  : item.percentage > 80
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{
                                width: `${Math.min(item.percentage, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="w-12 text-xs tabular-nums text-gray-500">
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

const ACCENT_COLORS = {
  blue: "border-l-blue-500",
  purple: "border-l-purple-500",
  cyan: "border-l-cyan-500",
  red: "border-l-red-500",
  green: "border-l-emerald-500",
  amber: "border-l-amber-500",
};

const VALUE_COLORS = {
  red: "text-red-500",
  green: "text-emerald-600",
};

function SummaryCard({
  label,
  value,
  currency,
  suffix,
  accent,
  valueColor,
}: {
  label: string;
  value: number;
  currency?: string;
  suffix?: string;
  accent: keyof typeof ACCENT_COLORS;
  valueColor?: "red" | "green";
}) {
  return (
    <div
      className={`rounded-xl border-l-4 bg-gray-50 p-3.5 shadow-sm dark:bg-gray-800/50 ${ACCENT_COLORS[accent]}`}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p
        className={`mt-1 text-xl font-bold ${
          valueColor ? VALUE_COLORS[valueColor] : ""
        }`}
      >
        {value.toFixed(suffix === "%" ? 1 : 2)}
        {suffix || (currency ? ` ${currency}` : "")}
      </p>
    </div>
  );
}
