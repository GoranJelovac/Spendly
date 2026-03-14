"use client";

import { useState, useEffect } from "react";
import { getDashboardData, type DashboardData } from "@/actions/dashboard";
import { BudgetVsActualChart, SpendingPieChart } from "@/components/dashboard/charts";

type Budget = { id: string; name: string; year: number; currency: string };

export function DashboardContent({ budgets }: { budgets: Budget[] }) {
  const [selectedBudget, setSelectedBudget] = useState(budgets[0]?.id || "");
  const [period, setPeriod] = useState<"month" | "ytd" | "custom">("month");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedBudget) return;
    setLoading(true);
    getDashboardData(selectedBudget, period).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [selectedBudget, period]);

  const currency = data?.budget.currency || "EUR";

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <select
          value={selectedBudget}
          onChange={(e) => setSelectedBudget(e.target.value)}
          className="rounded-md border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
        >
          {budgets.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.year})
            </option>
          ))}
        </select>

        <div className="flex rounded-md border">
          {(["month", "ytd", "custom"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-2 text-sm capitalize ${
                period === p
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {p === "ytd" ? "Year to Date" : p === "month" ? "This Month" : "Custom"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : !data ? (
        <p className="text-gray-500">No data found.</p>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <SummaryCard
              label="Planned"
              value={data.totals.planned}
              currency={currency}
            />
            <SummaryCard
              label="Spent"
              value={data.totals.spent}
              currency={currency}
            />
            <SummaryCard
              label="Remaining"
              value={data.totals.remaining}
              currency={currency}
              color={data.totals.remaining < 0 ? "red" : "green"}
            />
            <SummaryCard
              label="Used"
              value={data.totals.percentage}
              suffix="%"
              color={data.totals.percentage > 100 ? "red" : undefined}
            />
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <BudgetVsActualChart
              data={data.lines.map((l) => ({
                name: l.name,
                planned: l.planned,
                spent: l.spent,
              }))}
              currency={currency}
            />
            <SpendingPieChart
              data={data.lines.map((l) => ({
                name: l.name,
                planned: l.planned,
                spent: l.spent,
              }))}
              currency={currency}
            />
          </div>

          {/* Line-by-line breakdown */}
          <div className="rounded-lg border bg-white dark:bg-gray-900">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-gray-500">
                <tr>
                  <th className="p-3 font-medium">Category</th>
                  <th className="p-3 text-right font-medium">
                    Planned ({currency})
                  </th>
                  <th className="p-3 text-right font-medium">
                    Spent ({currency})
                  </th>
                  <th className="p-3 text-right font-medium">
                    Remaining ({currency})
                  </th>
                  <th className="p-3 font-medium">Progress</th>
                </tr>
              </thead>
              <tbody>
                {data.lines.map((line) => (
                  <tr key={line.id} className="border-b last:border-0">
                    <td className="p-3 font-medium">{line.name}</td>
                    <td className="p-3 text-right">{line.planned.toFixed(2)}</td>
                    <td className="p-3 text-right">{line.spent.toFixed(2)}</td>
                    <td
                      className={`p-3 text-right ${
                        line.remaining < 0 ? "text-red-500" : "text-green-600"
                      }`}
                    >
                      {line.remaining.toFixed(2)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            className={`h-2 rounded-full ${
                              line.percentage > 100
                                ? "bg-red-500"
                                : line.percentage > 80
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                            style={{
                              width: `${Math.min(line.percentage, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="w-12 text-xs text-gray-500">
                          {line.percentage.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
    <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
      <p className="text-sm text-gray-500">{label}</p>
      <p
        className={`text-2xl font-bold ${
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
