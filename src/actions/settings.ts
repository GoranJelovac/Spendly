"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-utils";
import { signOut } from "@/lib/auth";

export async function updateName(formData: FormData) {
  const user = await getAuthUser();
  const name = formData.get("name") as string;

  if (!name) return { error: "Name is required." };

  await db.user.update({
    where: { id: user.id },
    data: { name },
  });

  return { success: "Name updated!" };
}

export async function updatePassword(formData: FormData) {
  const user = await getAuthUser();
  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;

  if (!currentPassword || !newPassword) {
    return { error: "All fields are required." };
  }

  if (newPassword.length < 6) {
    return { error: "New password must be at least 6 characters." };
  }

  const dbUser = await db.user.findUnique({ where: { id: user.id } });
  if (!dbUser?.hashedPassword) {
    return { error: "Cannot change password for this account type." };
  }

  const isValid = await bcrypt.compare(currentPassword, dbUser.hashedPassword);
  if (!isValid) {
    return { error: "Current password is incorrect." };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await db.user.update({
    where: { id: user.id },
    data: { hashedPassword },
  });

  return { success: "Password updated!" };
}

export async function updateDecimals(formData: FormData) {
  const user = await getAuthUser();
  const decimals = Number(formData.get("decimals"));

  if (![0, 1, 2].includes(decimals)) {
    return { error: "Decimals must be 0, 1, or 2." };
  }

  await db.user.update({
    where: { id: user.id },
    data: { decimals },
  });

  return { success: "Decimal places updated!" };
}

export async function deleteAccount() {
  const user = await getAuthUser();
  await db.user.delete({ where: { id: user.id } });
  await signOut({ redirectTo: "/" });
}
