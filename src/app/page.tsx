"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      <main className="flex flex-col items-center gap-8 px-6 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
          Spendly
        </h1>
        <p className="max-w-md text-lg text-gray-600 dark:text-gray-400">
          Track your spending, stay on budget. Create budgets, log expenses, and
          see exactly where your money goes.
        </p>
        <div className="flex gap-4">
          <Link
            href="/register"
            className={cn(buttonVariants({ size: "lg" }))}
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            Log In
          </Link>
        </div>
      </main>
    </div>
  );
}
