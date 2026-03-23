"use client";

import { useState, useEffect, useMemo } from "react";
import { getDashboardData, type DashboardData } from "@/actions/dashboard";
import { PlannedVsSpentChart, BudgetBreakdownChart, SpendingOverviewChart } from "@/components/dashboard/charts";
import { ColumnFilter } from "@/components/shared/column-filter";
import { useDecimals } from "@/lib/decimals-context";

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
    <div className="rounded-2xl border-2 border-gray-200 bg-white shadow-md dark:border-sp-border dark:bg-sp-bg dark:shadow-[0_0_20px_var(--sp-glow)]">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-t-2xl px-5 py-3.5 text-left transition-colors bg-sp-accent/8 hover:bg-sp-accent/12"
      >
        <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-500 dark:text-sp-muted">
          {title}
        </h3>
        <span
          className={`text-[10px] text-gray-400 dark:text-sp-muted transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        >
          &#9660;
        </span>
      </button>
      {open && <div className="border-t border-gray-100 px-5 pb-5 pt-4 dark:border-sp-border">{children}</div>}
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
      className={`rounded-xl px-3.5 py-1.5 text-[13px] font-medium transition-all ${
        active
          ? "bg-sp-accent text-white shadow-sm"
          : "text-gray-500 hover:bg-gray-100 dark:text-sp-muted dark:hover:bg-sp-accent/8"
      }`}
    >
      {children}
    </button>
  );
}

export function DashboardContent({
  budgetId,
  budgetCurrency,
}: {
  budgetId: string;
  budgetCurrency: string;
}) {
  const { fmtD } = useDecimals();
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

  // Column filters for Details table
  type ColKey = "name" | "categoryName" | "planned" | "contributed" | "available" | "spent" | "remaining" | "percentage";
  const [columnFilters, setColumnFilters] = useState<Record<string, Set<string>>>({});

  // Reset column filters when data/view changes
  useEffect(() => {
    setColumnFilters({});
  }, [data, viewMode, categoryFilter]);

  // Get unique values for each column from displayItems
  const columnValues = useMemo(() => {
    const cols: Record<ColKey, string[]> = {
      name: [],
      categoryName: [],
      planned: [],
      contributed: [],
      available: [],
      spent: [],
      remaining: [],
      percentage: [],
    };
    const sets: Record<ColKey, Set<string>> = {
      name: new Set(),
      categoryName: new Set(),
      planned: new Set(),
      contributed: new Set(),
      available: new Set(),
      spent: new Set(),
      remaining: new Set(),
      percentage: new Set(),
    };

    for (const item of displayItems) {
      const vals: Record<ColKey, string> = {
        name: item.name,
        categoryName: "categoryName" in item ? String(item.categoryName) : "",
        planned: fmtD(item.planned),
        contributed: item.contributed > 0 ? fmtD(item.contributed) : "—",
        available: fmtD(item.available),
        spent: fmtD(item.spent),
        remaining: fmtD(item.remaining),
        percentage: fmtD(item.percentage, 0) + "%",
      };
      for (const key of Object.keys(vals) as ColKey[]) {
        if (!sets[key].has(vals[key])) {
          sets[key].add(vals[key]);
          cols[key].push(vals[key]);
        }
      }
    }
    return cols;
  }, [displayItems]);

  function setColumnFilter(col: string, selected: Set<string>) {
    setColumnFilters((prev) => ({ ...prev, [col]: selected }));
  }

  function getSelectedForCol(col: ColKey): Set<string> {
    return columnFilters[col] || new Set(columnValues[col]);
  }

  // Apply column filters to displayItems
  const detailsItems = useMemo(() => {
    if (Object.keys(columnFilters).length === 0) return displayItems;

    return displayItems.filter((item) => {
      const vals: Record<ColKey, string> = {
        name: item.name,
        categoryName: "categoryName" in item ? String(item.categoryName) : "",
        planned: fmtD(item.planned),
        contributed: item.contributed > 0 ? fmtD(item.contributed) : "—",
        available: fmtD(item.available),
        spent: fmtD(item.spent),
        remaining: fmtD(item.remaining),
        percentage: fmtD(item.percentage, 0) + "%",
      };

      for (const [col, selected] of Object.entries(columnFilters)) {
        if (selected.size < columnValues[col as ColKey].length) {
          if (!selected.has(vals[col as ColKey])) return false;
        }
      }
      return true;
    });
  }, [displayItems, columnFilters, columnValues]);

  return (
    <div className="font-[var(--font-jakarta)]" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Filters */}
      <CollapsibleSection title="Filters">
        <div className="space-y-3">
          {/* Period */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="w-14 text-[12px] font-medium text-gray-500 dark:text-sp-muted">Period</span>
            <div className="flex gap-1 rounded-[16px] bg-gray-100 p-[3px] dark:bg-sp-surface">
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
              <span className="w-14 text-[12px] font-medium text-gray-500 dark:text-sp-muted">Month</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm dark:border-sp-border dark:bg-sp-surface dark:text-sp-text"
              >
                {MONTH_NAMES.map((name, i) => (
                  <option key={i} value={i}>{name}</option>
                ))}
              </select>
              <div className="flex gap-1 rounded-[16px] bg-gray-100 p-[3px] dark:bg-sp-surface">
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
            <span className="w-14 text-[12px] font-medium text-gray-500 dark:text-sp-muted">View</span>
            <div className="flex gap-1 rounded-[16px] bg-gray-100 p-[3px] dark:bg-sp-surface">
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
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm dark:border-sp-border dark:bg-sp-surface dark:text-sp-text"
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
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-sp-accent border-t-transparent" />
        </div>
      ) : !data ? (
        <p className="text-gray-500 dark:text-sp-muted">No data found.</p>
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
                valueColor={displayTotals.remaining < 0
                  ? (displayTotals.percentage > 150 ? "red" : displayTotals.percentage > 125 ? "orange" : "yellow")
                  : "green"}
              />
              <SummaryCard
                label="Used"
                value={displayTotals.percentage}
                suffix="%"
                accent="amber"
                valueColor={displayTotals.percentage > 150 ? "red" : displayTotals.percentage > 125 ? "orange" : displayTotals.percentage > 110 ? "yellow" : undefined}
              />
            </div>
          </CollapsibleSection>

          {/* Charts */}
          <CollapsibleSection title="Charts">
            <PlannedVsSpentChart
              data={displayItems.map((l) => ({
                name: l.name,
                categoryName: "categoryName" in l ? String(l.categoryName) : undefined,
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
                  categoryName: "categoryName" in l ? String(l.categoryName) : undefined,
                  planned: l.planned,
                  contributed: l.contributed,
                  spent: l.spent,
                }))}
                currency={budgetCurrency}
              />
              <SpendingOverviewChart
                data={displayItems.map((l) => ({
                  name: l.name,
                  categoryName: "categoryName" in l ? String(l.categoryName) : undefined,
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
            <div className="min-h-[20rem] overflow-x-auto overflow-y-auto" style={{ maxHeight: 600 }}>
              <table className="w-full border-separate border-spacing-y-2 text-left text-[14px]">
                <thead>
                  <tr className="bg-sp-accent/8">
                    <th className="rounded-l-2xl pb-2.5 pl-3 pt-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-gray-500 dark:text-sp-muted">
                      {viewMode === "categories" && categoryFilter === "all" ? "Category" : "Line"}
                      <ColumnFilter
                        values={columnValues.name}
                        selected={getSelectedForCol("name")}
                        onChange={(s) => setColumnFilter("name", s)}
                      />
                    </th>
                    {viewMode === "lines" && (
                      <th className="pb-2.5 pt-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-gray-500 dark:text-sp-muted">
                        Category
                        <ColumnFilter
                          values={columnValues.categoryName}
                          selected={getSelectedForCol("categoryName")}
                          onChange={(s) => setColumnFilter("categoryName", s)}
                        />
                      </th>
                    )}
                    <th className="pb-2.5 pt-2.5 text-right text-[10px] font-bold uppercase tracking-[0.08em] text-gray-500 dark:text-sp-muted">
                      Planned
                      <ColumnFilter
                        values={columnValues.planned}
                        selected={getSelectedForCol("planned")}
                        onChange={(s) => setColumnFilter("planned", s)}
                      />
                    </th>
                    <th className="pb-2.5 pt-2.5 text-right text-[10px] font-bold uppercase tracking-[0.08em] text-gray-500 dark:text-sp-muted">
                      Contrib.
                      <ColumnFilter
                        values={columnValues.contributed}
                        selected={getSelectedForCol("contributed")}
                        onChange={(s) => setColumnFilter("contributed", s)}
                      />
                    </th>
                    <th className="pb-2.5 pt-2.5 text-right text-[10px] font-bold uppercase tracking-[0.08em] text-gray-500 dark:text-sp-muted">
                      Available
                      <ColumnFilter
                        values={columnValues.available}
                        selected={getSelectedForCol("available")}
                        onChange={(s) => setColumnFilter("available", s)}
                      />
                    </th>
                    <th className="pb-2.5 pt-2.5 text-right text-[10px] font-bold uppercase tracking-[0.08em] text-gray-500 dark:text-sp-muted">
                      Spent
                      <ColumnFilter
                        values={columnValues.spent}
                        selected={getSelectedForCol("spent")}
                        onChange={(s) => setColumnFilter("spent", s)}
                      />
                    </th>
                    <th className="pb-2.5 pr-4 pt-2.5 text-right text-[10px] font-bold uppercase tracking-[0.08em] text-gray-500 dark:text-sp-muted">
                      Remaining
                      <ColumnFilter
                        values={columnValues.remaining}
                        selected={getSelectedForCol("remaining")}
                        onChange={(s) => setColumnFilter("remaining", s)}
                      />
                    </th>
                    <th className="rounded-r-2xl pb-2.5 pl-4 pt-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-gray-500 dark:text-sp-muted">
                      Progress
                      <ColumnFilter
                        values={columnValues.percentage}
                        selected={getSelectedForCol("percentage")}
                        onChange={(s) => setColumnFilter("percentage", s)}
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {detailsItems.map((item) => (
                    <tr key={item.id} className="bg-gray-50 dark:bg-sp-surface">
                      <td className="rounded-l-xl py-[6px] pl-3 font-semibold dark:text-sp-text">{item.name}</td>
                      {viewMode === "lines" && (
                        <td className="py-[6px]">
                          <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-sp-muted">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-sp-accent" />
                            {"categoryName" in item ? String(item.categoryName) : ""}
                          </span>
                        </td>
                      )}
                      <td className="py-[6px] text-right tabular-nums dark:text-sp-text">{fmtD(item.planned)}</td>
                      <td className="py-[6px] text-right tabular-nums dark:text-sp-text">{item.contributed > 0 ? fmtD(item.contributed) : "—"}</td>
                      <td className="py-[6px] text-right tabular-nums font-semibold dark:text-sp-text">{fmtD(item.available)}</td>
                      <td className="py-[6px] text-right tabular-nums dark:text-sp-text">{fmtD(item.spent)}</td>
                      <td
                        className={`py-[6px] pr-4 text-right tabular-nums font-semibold ${
                          item.remaining < 0
                            ? item.percentage > 150
                              ? "text-red-500"
                              : item.percentage > 125
                                ? "text-orange-500"
                                : "text-yellow-500"
                            : "text-emerald-500"
                        }`}
                      >
                        {fmtD(item.remaining)}
                      </td>
                      <td className="rounded-r-xl py-[6px] pl-4 pr-3">
                        <div className="flex items-center gap-2">
                          <div className="h-[11px] w-full rounded-xl bg-gray-200 dark:bg-sp-muted/15">
                            <div
                              className={`h-[11px] rounded-xl transition-all duration-500 ease-out ${
                                item.percentage > 150
                                  ? "bg-red-500"
                                  : item.percentage > 125
                                    ? "bg-orange-500"
                                    : item.percentage > 110
                                      ? "bg-yellow-500"
                                      : item.percentage > 80
                                        ? "bg-amber-500"
                                        : "bg-emerald-500"
                              }`}
                              style={{
                                width: `${Math.min(item.percentage, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="w-12 text-xs tabular-nums text-gray-500 dark:text-sp-muted">
                            {fmtD(item.percentage, 0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {detailsItems.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-4 text-center text-gray-400 dark:text-sp-muted">
                        No items match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>
        </>
      )}
    </div>
  );
}

const ACCENT_HEX = {
  blue: "#3b82f6",
  purple: "#8b5cf6",
  cyan: "#06b6d4",
  red: "#ef4444",
  green: "#10b981",
  amber: "#f59e0b",
};

const VALUE_COLORS = {
  red: "text-red-500",
  orange: "text-orange-500",
  yellow: "text-yellow-500",
  green: "text-emerald-500",
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
  accent: keyof typeof ACCENT_HEX;
  valueColor?: keyof typeof VALUE_COLORS;
}) {
  const { fmtD } = useDecimals();
  return (
    <div
      className="rounded-2xl border-2 bg-transparent p-[15px]"
      style={{ borderColor: ACCENT_HEX[accent] }}
    >
      <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-gray-500 dark:text-sp-muted">
        {label}
      </p>
      <p
        className={`mt-1 text-[18px] font-bold tabular-nums ${
          valueColor ? VALUE_COLORS[valueColor] : "dark:text-sp-text"
        }`}
      >
        {fmtD(value, suffix === "%" ? 1 : undefined)}
        {suffix || (currency ? ` ${currency}` : "")}
      </p>
    </div>
  );
}
