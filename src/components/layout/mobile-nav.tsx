"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/budgets", label: "Budgets" },
  { href: "/expenses", label: "Expenses" },
  { href: "/billing", label: "Billing" },
  { href: "/settings", label: "Settings" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="lg:hidden">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <Link href="/dashboard" className="text-lg font-bold">
          Spendly
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <span className="text-lg">{open ? "\u2715" : "\u2630"}</span>
        </button>
      </div>
      {open && (
        <nav className="border-b bg-white p-3 dark:bg-gray-950">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                pathname.startsWith(item.href)
                  ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-400"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
