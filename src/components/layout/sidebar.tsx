"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BudgetSelector } from "./budget-selector";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "\u2302" },
  { href: "/categories", label: "Categories", icon: "\u2630" },
  { href: "/budgets", label: "Budget Lines", icon: "\u2261" },
  { href: "/expenses", label: "Expenses", icon: "\u2696" },
  { href: "/contributions", label: "Contributions", icon: "\u21A5" },
  { href: "/billing", label: "Billing", icon: "\u2605" },
  { href: "/settings", label: "Settings", icon: "\u2699" },
];

type Budget = {
  id: string;
  name: string;
  year: number;
  currency: string;
};

export function Sidebar({
  budgets,
  activeBudgetId,
}: {
  budgets: Budget[];
  activeBudgetId: string | null;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950 lg:block">
      <div className="flex h-full flex-col">
        {/* Logo + Theme */}
        <div className="flex items-center justify-between px-6 py-5">
          <Link href="/dashboard" className="text-xl font-bold tracking-tight">
            <span className="text-blue-600">$</span>pendly
          </Link>
          <ThemeToggle />
        </div>

        {/* Budget Selector */}
        <div className="border-y border-gray-200 py-3 dark:border-gray-800">
          <BudgetSelector budgets={budgets} activeBudgetId={activeBudgetId} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 p-3">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

      </div>
    </aside>
  );
}
