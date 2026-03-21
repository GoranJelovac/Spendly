"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { updateName, updatePassword, updateDecimals, deleteAccount } from "@/actions/settings";
import { useDecimals } from "@/lib/decimals-context";
import { Button } from "@/components/ui/button";

export function SettingsForm({
  name,
  email,
  decimals: initialDecimals,
}: {
  name: string;
  email: string;
  decimals: number;
}) {
  const [nameMsg, setNameMsg] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Theme
  const { theme, setTheme } = useTheme();

  // Decimals
  const { decimals, setDecimals } = useDecimals();
  const [decimalsMsg, setDecimalsMsg] = useState("");
  const [decimalsLoading, setDecimalsLoading] = useState(false);

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

  async function handleDecimalsChange(value: number) {
    setDecimalsMsg("");
    setDecimalsLoading(true);
    setDecimals(value);
    const fd = new FormData();
    fd.set("decimals", String(value));
    const result = await updateDecimals(fd);
    setDecimalsMsg(result.error || result.success || "");
    setDecimalsLoading(false);
  }

  async function handleDeleteAccount() {
    if (deleteInput !== name) return;
    setDeleteLoading(true);
    await deleteAccount();
    setDeleteLoading(false);
  }

  const themeOptions = [
    { value: "light", label: "Light", icon: "\u2600" },
    { value: "dark", label: "Dark", icon: "\u263E" },
    { value: "system", label: "System", icon: "\u2699" },
  ];

  const decimalsOptions = [
    { value: 0, label: "0", example: "1.234" },
    { value: 1, label: "1", example: "1.234,5" },
    { value: 2, label: "2", example: "1.234,56" },
  ];

  return (
    <div className="space-y-6">
      {/* Appearance */}
      <div className="rounded-2xl bg-white p-6 shadow-md dark:bg-[#13112b] dark:border-2 dark:border-[#252345] dark:shadow-[0_0_20px_rgba(129,140,248,0.12)]">
        <h2 className="mb-4 text-lg font-semibold">Appearance</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Theme</label>
            <div className="flex gap-2">
              {themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    theme === opt.value
                      ? "border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-300"
                      : "border-gray-200 hover:border-gray-300 dark:border-[#252345] dark:hover:border-[#353355]"
                  }`}
                >
                  <span>{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Decimal Places</label>
            <div className="flex gap-2">
              {decimalsOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleDecimalsChange(opt.value)}
                  disabled={decimalsLoading}
                  className={`flex flex-col items-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    decimals === opt.value
                      ? "border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-300"
                      : "border-gray-200 hover:border-gray-300 dark:border-[#252345] dark:hover:border-[#353355]"
                  }`}
                >
                  <span>{opt.label}</span>
                  <span className="text-[10px] text-gray-400 dark:text-[#6b6b8a] tabular-nums">{opt.example}</span>
                </button>
              ))}
            </div>
            {decimalsMsg && (
              <p className={`mt-2 text-sm ${decimalsMsg.includes("updated") ? "text-green-600" : "text-red-500"}`}>
                {decimalsMsg}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Profile */}
      <div className="rounded-2xl bg-white p-6 shadow-md dark:bg-[#13112b] dark:border-2 dark:border-[#252345] dark:shadow-[0_0_20px_rgba(129,140,248,0.12)]">
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
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-[#252345] dark:bg-[#1a1835]"
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
      <div className="rounded-2xl bg-white p-6 shadow-md dark:bg-[#13112b] dark:border-2 dark:border-[#252345] dark:shadow-[0_0_20px_rgba(129,140,248,0.12)]">
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
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-[#252345] dark:bg-[#1a1835]"
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
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-[#252345] dark:bg-[#1a1835]"
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
      <div className="rounded-2xl border-2 border-red-200 bg-white p-6 shadow-md dark:border-red-900 dark:bg-[#13112b] dark:shadow-[0_0_20px_rgba(129,140,248,0.12)]">
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
              className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm dark:border-red-800 dark:bg-[#1a1835]"
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
