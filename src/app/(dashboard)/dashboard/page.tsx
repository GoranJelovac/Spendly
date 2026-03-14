import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getBudgets } from "@/actions/budget";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const budgets = await getBudgets();

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

      {budgets.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center dark:bg-gray-900">
          <p className="text-gray-500">
            No budgets yet. Create one on the{" "}
            <a href="/budgets" className="font-medium underline">
              Budgets
            </a>{" "}
            page to get started.
          </p>
        </div>
      ) : (
        <DashboardContent
          budgets={budgets.map((b) => ({
            id: b.id,
            name: b.name,
            year: b.year,
            currency: b.currency,
          }))}
        />
      )}
    </div>
  );
}
