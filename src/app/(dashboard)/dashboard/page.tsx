import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveBudget } from "@/actions/active-budget";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const activeBudget = await getActiveBudget();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500">
            Welcome, {session.user.name || session.user.email}
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Sign Out
          </button>
        </form>
      </div>

      {!activeBudget ? (
        <div className="rounded-lg border bg-white p-8 text-center dark:bg-gray-900">
          <p className="text-gray-500">
            No budget selected. Create one using the selector in the sidebar.
          </p>
        </div>
      ) : (
        <DashboardContent
          budgetId={activeBudget.id}
          budgetName={activeBudget.name}
          budgetYear={activeBudget.year}
          budgetCurrency={activeBudget.currency}
        />
      )}
    </div>
  );
}
