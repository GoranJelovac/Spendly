"use client";

import { useState } from "react";
import { updateName, updatePassword, deleteAccount } from "@/actions/settings";
import { Button } from "@/components/ui/button";

export function SettingsForm({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const [nameMsg, setNameMsg] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  async function handleNameUpdate(formData: FormData) {
    setNameMsg("");
    const result = await updateName(formData);
    setNameMsg(result.error || result.success || "");
  }

  async function handlePasswordUpdate(formData: FormData) {
    setPwMsg("");
    const result = await updatePassword(formData);
    setPwMsg(result.error || result.success || "");
  }

  async function handleDeleteAccount() {
    if (
      !confirm(
        "Are you sure you want to delete your account? This cannot be undone. All budgets, lines, and expenses will be permanently removed."
      )
    ) {
      return;
    }
    await deleteAccount();
  }

  return (
    <div className="space-y-8">
      {/* Name */}
      <div className="rounded-lg border bg-white p-6 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold">Profile</h2>
        <form action={handleNameUpdate} className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <p className="mt-1 text-sm text-gray-500">{email}</p>
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium">
              Name
            </label>
            <input
              id="name"
              name="name"
              defaultValue={name}
              required
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          {nameMsg && (
            <p
              className={`text-sm ${
                nameMsg.includes("updated") ? "text-green-600" : "text-red-500"
              }`}
            >
              {nameMsg}
            </p>
          )}
          <Button type="submit">Save</Button>
        </form>
      </div>

      {/* Password */}
      <div className="rounded-lg border bg-white p-6 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold">Change Password</h2>
        <form action={handlePasswordUpdate} className="space-y-3">
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium"
            >
              Current Password
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium">
              New Password
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              minLength={6}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          {pwMsg && (
            <p
              className={`text-sm ${
                pwMsg.includes("updated") ? "text-green-600" : "text-red-500"
              }`}
            >
              {pwMsg}
            </p>
          )}
          <Button type="submit">Update Password</Button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="rounded-lg border border-red-200 bg-white p-6 dark:border-red-900 dark:bg-gray-900">
        <h2 className="mb-2 text-lg font-semibold text-red-600">Danger Zone</h2>
        <p className="mb-4 text-sm text-gray-500">
          Permanently delete your account and all associated data.
        </p>
        <Button variant="destructive" onClick={handleDeleteAccount}>
          Delete Account
        </Button>
      </div>
    </div>
  );
}
