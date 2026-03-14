import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActiveBudget } from "@/actions/active-budget";
import { getCategories } from "@/actions/category";
import { CategoryList } from "@/components/categories/category-list";

export default async function CategoriesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const activeBudget = await getActiveBudget();

  if (!activeBudget) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-4 text-3xl font-bold">Categories</h1>
        <p className="text-gray-500">
          No budget selected. Create one using the selector in the sidebar.
        </p>
      </div>
    );
  }

  const categories = await getCategories(activeBudget.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">Categories</h1>
      <p className="mb-6 text-gray-500">
        {activeBudget.name} &middot; {activeBudget.year} &middot; {activeBudget.currency}
      </p>
      <CategoryList categories={categories} budgetId={activeBudget.id} />
    </div>
  );
}
