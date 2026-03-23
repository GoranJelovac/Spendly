"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import { useDecimals } from "@/lib/decimals-context";

type ParsedTransaction = {
  date: string;
  line: string;
  amount: number;
  description: string;
};

type PreviewRow = ParsedTransaction & {
  status: "ready" | "error";
  error?: string;
};

type Props = {
  budgetId: string;
  label: string;
  downloadCsv: (budgetId: string) => Promise<{ csv: string } | { error: string }>;
  previewImport: (
    budgetId: string,
    rows: ParsedTransaction[]
  ) => Promise<{ rows: PreviewRow[] } | { error: string }>;
  applyImport: (
    budgetId: string,
    rows: ParsedTransaction[]
  ) => Promise<{ success: string } | { error: string }>;
};

function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (inQuotes) {
      if (ch === '"' && row[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        result.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

function parseCSV(text: string): ParsedTransaction[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  return lines
    .slice(1)
    .map((row) => {
      const cols = parseCSVRow(row);
      return {
        date: cols[0]?.trim() || "",
        line: cols[1]?.trim() || "",
        amount: parseFloat(cols[2]) || 0,
        description: cols[3]?.trim() || "",
      };
    })
    .filter((r) => r.line !== "" && r.date !== "" && r.amount > 0);
}

function parseExcel(data: ArrayBuffer): ParsedTransaction[] {
  const workbook = XLSX.read(data, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

  if (rows.length < 2) return [];

  return rows
    .slice(1)
    .map((row) => ({
      date: String(row[0] || "").trim(),
      line: String(row[1] || "").trim(),
      amount: parseFloat(String(row[2])) || 0,
      description: String(row[3] || "").trim(),
    }))
    .filter((r) => r.line !== "" && r.date !== "" && r.amount > 0);
}

export function ImportExportTransactions({
  budgetId,
  label,
  downloadCsv,
  previewImport,
  applyImport,
}: Props) {
  const { fmtD } = useDecimals();
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleDownload() {
    setError("");
    setSuccessMsg("");
    const result = await downloadCsv(budgetId);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    const blob = new Blob([result.csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${label.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      let parsed: ParsedTransaction[];

      if (file.name.endsWith(".csv")) {
        const text = await file.text();
        parsed = parseCSV(text);
      } else {
        const buf = await file.arrayBuffer();
        parsed = parseExcel(buf);
      }

      if (parsed.length === 0) {
        setError("No valid rows found in file.");
        setLoading(false);
        return;
      }

      const result = await previewImport(budgetId, parsed);
      if ("error" in result) {
        setError(result.error);
      } else {
        setPreview(result.rows);
      }
    } catch {
      setError("Failed to parse file.");
    }

    setLoading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleApply() {
    if (!preview) return;
    setLoading(true);
    setError("");

    const readyRows = preview
      .filter((r) => r.status === "ready")
      .map(({ date, line, amount, description }) => ({
        date,
        line,
        amount,
        description,
      }));

    if (readyRows.length === 0) {
      setError("No valid rows to import.");
      setLoading(false);
      return;
    }

    const result = await applyImport(budgetId, readyRows);
    if ("error" in result) {
      setError(result.error);
    } else {
      setSuccessMsg(result.success);
      setPreview(null);
    }
    setLoading(false);
  }

  const readyCount = preview?.filter((r) => r.status === "ready").length ?? 0;
  const errorCount = preview?.filter((r) => r.status === "error").length ?? 0;

  return (
    <div>
      <div className="flex gap-1">
        <Button variant="outline" size="icon" onClick={handleDownload} title="Download CSV">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          title="Import CSV / Excel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
      {successMsg && <p className="mb-4 text-sm text-green-600">{successMsg}</p>}

      {preview && (
        <div className="mb-6 rounded-2xl bg-white p-5 shadow-md dark:bg-sp-bg dark:border-2 dark:border-sp-border dark:shadow-[0_0_20px_var(--sp-glow)]">
          <h3 className="mb-1 text-lg font-semibold">Import Preview</h3>
          <p className="mb-3 text-sm text-gray-500">
            {readyCount} ready to import
            {errorCount > 0 && (
              <span className="text-red-500"> · {errorCount} with errors (will be skipped)</span>
            )}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-gray-500">
                <tr>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Line</th>
                  <th className="pb-2 text-right font-medium">Amount</th>
                  <th className="pb-2 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                          row.status === "ready"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {row.status === "ready" ? "ready" : "error"}
                      </span>
                    </td>
                    <td className="py-2">{row.date}</td>
                    <td className="py-2">
                      {row.line}
                      {row.error && (
                        <div className="text-xs text-red-500">{row.error}</div>
                      )}
                    </td>
                    <td className="py-2 text-right">{fmtD(row.amount)}</td>
                    <td className="py-2 text-gray-500">{row.description || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex gap-2">
            <Button size="sm" onClick={handleApply} disabled={loading || readyCount === 0}>
              {loading ? "Importing..." : `Import ${readyCount} row(s)`}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setPreview(null); setSuccessMsg(""); }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
