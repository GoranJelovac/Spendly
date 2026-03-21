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
import { fmt } from "@/lib/format";

type LineData = {
  name: string;
  categoryName?: string;
  planned: number;
  contributed: number;
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

/** Lighten a hex color by mixing with white. factor 0 = original, 1 = white */
function lighten(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lr = Math.round(r + (255 - r) * factor);
  const lg = Math.round(g + (255 - g) * factor);
  const lb = Math.round(b + (255 - b) * factor);
  return `#${lr.toString(16).padStart(2, "0")}${lg.toString(16).padStart(2, "0")}${lb.toString(16).padStart(2, "0")}`;
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
              innerRadius={55}
              outerRadius={95}
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
              formatter={(value) => `${fmt(Number(value))} ${currency}`}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Scrollable legend */}
      <div className="flex-1 max-h-[200px] overflow-y-auto min-w-0">
        <div className="space-y-1">
          {data.map((entry, index) => {
            const pct = total > 0 ? fmt((entry.value / total) * 100, 1) : "0,0";
            return (
              <div
                key={entry.name}
                className={`flex items-center gap-2 rounded-lg px-2 py-1 text-xs cursor-pointer transition-colors ${
                  activeIndex === index
                    ? "bg-gray-100 dark:bg-[rgba(129,140,248,0.1)]"
                    : "hover:bg-gray-50 dark:hover:bg-[rgba(129,140,248,0.06)]"
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
                  {fmt(entry.value)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const BAR_SPENT = "#ef4444";

/** Get the color triplet for a given line index */
function getBarColors(index: number) {
  const base = COLORS[index % COLORS.length];
  return { planned: base, contributed: lighten(base, 0.4), spent: BAR_SPENT };
}

function BarTooltip({ active, payload, currency, data }: { active?: boolean; payload?: Array<{ payload: LineData; dataKey: string; value: number }>; currency: string; data: LineData[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0].payload;
  const idx = data.findIndex((d) => d.name === item.name);
  const colors = getBarColors(idx);
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-[#252345] dark:bg-[#13112b]">
      <p className="mb-1 font-semibold">{item.name}</p>
      {item.categoryName && (
        <p className="mb-1.5 text-[10px] text-gray-500 dark:text-[#6b6b8a]">{item.categoryName}</p>
      )}
      {payload.map((entry) => {
        const label = entry.dataKey === "planned" ? "Planned" : entry.dataKey === "contributed" ? "Contributed" : "Spent";
        const color = entry.dataKey === "planned" ? colors.planned : entry.dataKey === "contributed" ? colors.contributed : colors.spent;
        return (
          <p key={entry.dataKey} className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: color }} />
            <span className="text-gray-500 dark:text-[#6b6b8a]">{label}:</span>
            <span className="font-medium">{fmt(entry.value)} {currency}</span>
          </p>
        );
      })}
    </div>
  );
}

function PercentageBars({ data, currency }: { data: LineData[]; currency: string }) {
  return (
    <div className="space-y-3">
      {data.map((item, idx) => {
        const total = item.planned + item.contributed;
        const spentPct = total > 0 ? (item.spent / total) * 100 : 0;
        const contributedPct = total > 0 ? (item.contributed / total) * 100 : 0;
        const isOver = spentPct > 100;
        const colors = getBarColors(idx);

        return (
          <div key={item.name} className="group">
            {/* Label row */}
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <div className="min-w-0 flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-sm"
                  style={{ backgroundColor: colors.planned }}
                />
                <span className="text-sm font-medium truncate">{item.name}</span>
                {item.categoryName && (
                  <span className="text-[10px] text-gray-400 dark:text-[#6b6b8a]">{item.categoryName}</span>
                )}
              </div>
              <div className="flex-shrink-0 text-right">
                <span className={`text-sm font-semibold tabular-nums ${isOver ? "text-red-500" : ""}`}>
                  {fmt(spentPct, 1)}%
                </span>
                <span className="ml-2 text-[11px] text-gray-400 dark:text-[#6b6b8a] tabular-nums">
                  {fmt(item.spent)} / {fmt(total)} {currency}
                </span>
              </div>
            </div>

            {/* Bar */}
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-[#252345]">
              {/* Contributed segment (lighter) */}
              {contributedPct > 0 && (
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: "100%",
                    backgroundColor: colors.contributed,
                    opacity: 0.5,
                  }}
                  title={`Contributed: ${fmt(item.contributed)} ${currency}`}
                />
              )}

              {/* Planned base (full bar = 100%) */}
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${Math.min(contributedPct > 0 ? 100 - contributedPct : 100, 100)}%`,
                  backgroundColor: colors.planned,
                  opacity: 0.2,
                }}
              />

              {/* Spent fill */}
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(spentPct, 100)}%`,
                  backgroundColor: isOver ? BAR_SPENT : colors.planned,
                }}
              />

              {/* Overspent portion */}
              {isOver && (
                <div
                  className="absolute inset-y-0 right-0 rounded-r-full animate-pulse"
                  style={{
                    width: `${Math.min(spentPct - 100, 100)}%`,
                    backgroundColor: BAR_SPENT,
                    marginLeft: "auto",
                  }}
                />
              )}
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-gradient-to-r from-blue-500 to-purple-500" /> Spent
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-gradient-to-r from-blue-300 to-purple-300 opacity-20" /> Planned
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-gradient-to-r from-blue-300 to-purple-300 opacity-50" /> Contributed
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: BAR_SPENT }} /> Over budget
        </span>
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
  const [mode, setMode] = useState<"amount" | "percent">("amount");

  return (
    <div className="rounded-2xl bg-gray-50 p-4 dark:bg-[#1a1835]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Planned vs Spent</h3>
        <div className="flex rounded-xl border border-gray-200 dark:border-[#252345]">
          <button
            onClick={() => setMode("amount")}
            className={`w-16 rounded-l-xl py-1 text-xs font-medium transition-colors ${
              mode === "amount"
                ? "bg-[#818cf8] text-white"
                : "text-gray-500 hover:bg-gray-100 dark:text-[#6b6b8a] dark:hover:bg-[#252345]"
            }`}
          >
            Amount
          </button>
          <button
            onClick={() => setMode("percent")}
            className={`w-16 rounded-r-xl py-1 text-xs font-medium transition-colors ${
              mode === "percent"
                ? "bg-[#818cf8] text-white"
                : "text-gray-500 hover:bg-gray-100 dark:text-[#6b6b8a] dark:hover:bg-[#252345]"
            }`}
          >
            %
          </button>
        </div>
      </div>

      {mode === "amount" ? (
        <>
          <div className="overflow-y-auto" style={{ maxHeight: 600 }}>
            <ResponsiveContainer width="100%" height={Math.max(420, data.length * 40 + 40)}>
              <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#252345" horizontal={false} />
                <XAxis type="number" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="name"
                  fontSize={11}
                  width={120}
                  tick={{ fill: "currentColor" }}
                  interval={0}
                />
                <Tooltip content={<BarTooltip currency={currency} data={data} />} />
                <Bar dataKey="planned" stackId="budget" name="planned" barSize={18}>
                  {data.map((_, i) => (
                    <Cell key={`p-${i}`} fill={getBarColors(i).planned} />
                  ))}
                </Bar>
                <Bar dataKey="contributed" stackId="budget" name="contributed" barSize={18}>
                  {data.map((_, i) => (
                    <Cell key={`c-${i}`} fill={getBarColors(i).contributed} />
                  ))}
                </Bar>
                <Bar dataKey="spent" name="spent" barSize={18}>
                  {data.map((_, i) => (
                    <Cell key={`s-${i}`} fill={BAR_SPENT} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center justify-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-gradient-to-r from-blue-500 to-purple-500" /> Planned
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-gradient-to-r from-blue-300 to-purple-300" /> Contributed
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: BAR_SPENT }} /> Spent
            </span>
          </div>
        </>
      ) : (
        <div className="overflow-y-auto" style={{ maxHeight: 600 }}>
          <PercentageBars data={data} currency={currency} />
        </div>
      )}
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

  // Use available (planned + contributed) for the breakdown
  const pieData = data
    .filter((d) => d.planned + d.contributed > 0)
    .map((d) => ({ name: d.name, value: d.planned + d.contributed }));

  if (pieData.length === 0) {
    return (
      <div className="rounded-2xl bg-gray-50 p-4 dark:bg-[#1a1835]">
        <h3 className="mb-4 font-semibold">Budget Breakdown</h3>
        <p className="text-center text-gray-500">No budget data yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gray-50 p-4 dark:bg-[#1a1835]">
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
      <div className="rounded-2xl bg-gray-50 p-4 dark:bg-[#1a1835]">
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
    <div className="rounded-2xl bg-gray-50 p-4 dark:bg-[#1a1835]">
      <h3 className="mb-4 font-semibold">Spending Overview</h3>
      {overspent > 0 && (
        <p className="mb-2 text-xs text-red-500">
          Over budget by {fmt(overspent)} {currency}
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
