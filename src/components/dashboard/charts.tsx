"use client";

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
  Legend,
} from "recharts";

type LineData = {
  name: string;
  planned: number;
  spent: number;
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
];

export function BudgetVsActualChart({
  data,
  currency,
}: {
  data: LineData[];
  currency: string;
}) {
  return (
    <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
      <h3 className="mb-4 font-semibold">Budget vs Actual by Category</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" fontSize={12} />
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

export function SpendingPieChart({
  data,
  currency,
}: {
  data: LineData[];
  currency: string;
}) {
  const pieData = data
    .filter((d) => d.spent > 0)
    .map((d) => ({ name: d.name, value: d.spent }));

  if (pieData.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
        <h3 className="mb-4 font-semibold">Spending by Category</h3>
        <p className="text-center text-gray-500">No spending data yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
      <h3 className="mb-4 font-semibold">Spending by Category</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) =>
              `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
            }
          >
            {pieData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => `${Number(value).toFixed(2)} ${currency}`}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
