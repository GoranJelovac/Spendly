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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

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
    if (deleteInput !== name) return;
    setDeleteLoading(true);
    await deleteAccount();
    setDeleteLoading(false);
  }

  return (
    <div className="space-y-6">
      {/* Name */}
      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-900">
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
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
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
      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-900">
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
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
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
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
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
      <div className="rounded-xl border border-red-200 bg-white p-6 shadow-sm dark:border-red-900 dark:bg-gray-900">
        <h2 className="mb-2 text-lg font-semibold text-red-600">Danger Zone</h2>
        <p className="mb-4 text-sm text-gray-500">
          Permanently delete your account and all associated data.
        </p>

        {!showDeleteConfirm ? (
          <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
            Delete Account
          </Button>
        ) : (
          <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              This action cannot be undone. All budgets, lines, and expenses will be permanently removed.
            </p>
            <p className="text-sm text-red-600 dark:text-red-400">
              Type &ldquo;<span className="font-bold">{name}</span>&rdquo; to confirm:
            </p>
            <input
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder={name}
              className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm dark:border-red-800 dark:bg-gray-800"
            />
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={deleteLoading || deleteInput !== name}
              >
                {deleteLoading ? "Deleting..." : "Permanently Delete Account"}
              </Button>
              <Button
                variant="outline"
                onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
