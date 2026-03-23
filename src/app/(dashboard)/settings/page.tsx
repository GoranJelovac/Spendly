import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SettingsForm } from "@/components/settings/settings-form";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { decimals: true, accentColor: true },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 font-[var(--font-jakarta)] sm:px-6">
      <h1 className="mb-8 text-center text-2xl font-bold">Settings</h1>
      <SettingsForm
        name={session.user.name || ""}
        email={session.user.email || ""}
        decimals={user?.decimals ?? 0}
        accentColor={user?.accentColor ?? "blue"}
      />
    </div>
  );
}
