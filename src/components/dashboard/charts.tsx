"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type LineData = {
  name: string;
  planned: number;
  spent: number;
};

type PieEntry = {
  name: string;
  value: number;
};

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#14b8a6",
  "#a855f7",
  "#e11d48",
  "#0ea5e9",
  "#65a30d",
  "#d946ef",
  "#fb923c",
];

function getColor(index: number, name?: string) {
  if (name === "Unspent") return "#d1d5db";
  return COLORS[index % COLORS.length];
}

function DonutWithLegend({
  data,
  currency,
  activeIndex,
  onActiveChange,
}: {
  data: PieEntry[];
  currency: string;
  activeIndex: number | null;
  onActiveChange: (index: number | null) => void;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Donut */}
      <div className="flex-shrink-0">
        <ResponsiveContainer width={200} height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={85}
              paddingAngle={1}
              dataKey="value"
              onMouseEnter={(_, index) => onActiveChange(index)}
              onMouseLeave={() => onActiveChange(null)}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getColor(index, entry.name)}
                  opacity={activeIndex !== null && activeIndex !== index ? 0.4 : 1}
                  stroke={activeIndex === index ? "#000" : "none"}
                  strokeWidth={activeIndex === index ? 2 : 0}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => `${Number(value).toFixed(2)} ${currency}`}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Scrollable legend */}
      <div className="flex-1 max-h-[200px] overflow-y-auto min-w-0">
        <div className="space-y-1">
          {data.map((entry, index) => {
            const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : "0.0";
            return (
              <div
                key={entry.name}
                className={`flex items-center gap-2 rounded px-2 py-1 text-xs cursor-pointer transition-colors ${
                  activeIndex === index
                    ? "bg-gray-100 dark:bg-gray-800"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                }`}
                onMouseEnter={() => onActiveChange(index)}
                onMouseLeave={() => onActiveChange(null)}
              >
                <span
                  className="inline-block h-3 w-3 flex-shrink-0 rounded-sm"
                  style={{ backgroundColor: getColor(index, entry.name) }}
                />
                <span className="truncate flex-1" title={entry.name}>
                  {entry.name}
                </span>
                <span className="flex-shrink-0 text-gray-500 tabular-nums">
                  {pct}%
                </span>
                <span className="flex-shrink-0 tabular-nums font-medium">
                  {entry.value.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function PlannedVsSpentChart({
  data,
  currency,
}: {
  data: LineData[];
  currency: string;
}) {
  return (
    <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
      <h3 className="mb-4 font-semibold">Planned vs Spent</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" fontSize={11} interval={0} angle={-30} textAnchor="end" height={60} />
          <YAxis fontSize={12} />
          <Tooltip
            formatter={(value) => `${Number(value).toFixed(2)} ${currency}`}
          />
          <Bar dataKey="planned" fill="#3b82f6" name="Planned" />
          <Bar dataKey="spent" fill="#ef4444" name="Spent" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BudgetBreakdownChart({
  data,
  currency,
}: {
  data: LineData[];
  currency: string;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const pieData = data
    .filter((d) => d.planned > 0)
    .map((d) => ({ name: d.name, value: d.planned }));

  if (pieData.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
        <h3 className="mb-4 font-semibold">Budget Breakdown</h3>
        <p className="text-center text-gray-500">No budget data yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
      <h3 className="mb-4 font-semibold">Budget Breakdown</h3>
      <DonutWithLegend
        data={pieData}
        currency={currency}
        activeIndex={activeIndex}
        onActiveChange={setActiveIndex}
      />
    </div>
  );
}

export function SpendingOverviewChart({
  data,
  totalPlanned,
  currency,
}: {
  data: LineData[];
  totalPlanned: number;
  currency: string;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (totalPlanned <= 0) {
    return (
      <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
        <h3 className="mb-4 font-semibold">Spending Overview</h3>
        <p className="text-center text-gray-500">No budget data yet.</p>
      </div>
    );
  }

  const totalSpent = data.reduce((s, d) => s + d.spent, 0);
  const unspent = Math.max(0, totalPlanned - totalSpent);

  const pieData: PieEntry[] = [
    ...data
      .filter((d) => d.spent > 0)
      .map((d) => ({ name: d.name, value: d.spent })),
    ...(unspent > 0 ? [{ name: "Unspent", value: unspent }] : []),
  ];

  const overspent = totalSpent > totalPlanned ? totalSpent - totalPlanned : 0;

  return (
    <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
      <h3 className="mb-4 font-semibold">Spending Overview</h3>
      {overspent > 0 && (
        <p className="mb-2 text-xs text-red-500">
          Over budget by {overspent.toFixed(2)} {currency}
        </p>
      )}
      <DonutWithLegend
        data={pieData}
        currency={currency}
        activeIndex={activeIndex}
        onActiveChange={setActiveIndex}
      />
    </div>
  );
}
