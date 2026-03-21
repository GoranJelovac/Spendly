"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BudgetSelector } from "./budget-selector";
import { ThemeToggle } from "@/components/theme-toggle";

const mainItems = [
  { href: "/dashboard", label: "Dashboard", icon: "⌂" },
  { href: "/categories", label: "Categories", icon: "☰" },
  { href: "/budgets", label: "Budget Lines", icon: "≡" },
  { href: "/expenses", label: "Expenses", icon: "⚖" },
  { href: "/contributions", label: "Contributions", icon: "↥" },
];

const accountItems = [
  { href: "/billing", label: "Billing", icon: "★" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

type Budget = {
  id: string;
  name: string;
  year: number;
  currency: string;
};

export function MobileNav({
  budgets,
  activeBudgetId,
}: {
  budgets: Budget[];
  activeBudgetId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  function NavLink({ item }: { item: { href: string; label: string; icon: string } }) {
    const active = pathname.startsWith(item.href);
    return (
      <Link
        href={item.href}
        onClick={() => setOpen(false)}
        className={`flex items-center gap-3 px-3 py-[9px] text-[14px] font-medium transition-colors ${
          active
            ? "border-b-2 border-blue-500 bg-blue-500/[0.04] text-blue-500 dark:bg-blue-500/[0.04] dark:text-blue-400"
            : "rounded-[15px] border-b-2 border-transparent text-gray-500 hover:bg-gray-100/80 dark:text-gray-400 dark:hover:bg-white/[0.04]"
        }`}
      >
        <span className={`text-[15px] ${active ? "opacity-100" : "opacity-60"}`}>{item.icon}</span>
        {item.label}
      </Link>
    );
  }

  return (
    <div className="font-[var(--font-sora)] lg:hidden">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight">
          <span className="text-blue-500">$</span>pendly
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setOpen(!open)}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <span className="text-lg">{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>
      {open && (
        <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-[#18181b]">
          <div className="border-b border-gray-100 p-3 dark:border-gray-800">
            <BudgetSelector budgets={budgets} activeBudgetId={activeBudgetId} />
          </div>
          <nav className="p-3">
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400 dark:text-gray-600">
              Main
            </p>
            <div className="flex flex-col gap-[1px]">
              {mainItems.map((item) => <NavLink key={item.href} item={item} />)}
            </div>
            <p className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400 dark:text-gray-600">
              Account
            </p>
            <div className="flex flex-col gap-[1px]">
              {accountItems.map((item) => <NavLink key={item.href} item={item} />)}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
