import { auth } from "@/lib/auth";

export async function getAuthUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return { ...session.user, id: session.user.id };
}
