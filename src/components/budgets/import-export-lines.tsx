"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  downloadBudgetLinesCsv,
  previewImport,
  applyImport,
  type ImportedLine,
} from "@/actions/import-export-lines";
import * as XLSX from "xlsx";

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

type ParsedLine = { name: string; code: string; category: string; months: number[] };

function parseCSV(text: string): ParsedLine[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  return lines.slice(1).map((row) => {
    const cols = parseCSVRow(row);
    return {
      category: cols[0] || "General",
      name: cols[1] || "",
      code: cols[2] || "",
      months: Array.from({ length: 12 }, (_, i) => parseFloat(cols[i + 3]) || 0),
    };
  }).filter((l) => l.name.trim() !== "");
}

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

function parseExcel(data: ArrayBuffer): ParsedLine[] {
  const workbook = XLSX.read(data, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

  if (rows.length < 2) return [];

  return rows.slice(1).map((row) => ({
    category: String(row[0] || "General"),
    name: String(row[1] || ""),
    code: String(row[2] || ""),
    months: Array.from({ length: 12 }, (_, i) => parseFloat(String(row[i + 3])) || 0),
  })).filter((l) => l.name.trim() !== "");
}

export function ImportExportLines({ budgetId }: { budgetId: string }) {
  const [preview, setPreview] = useState<ImportedLine[] | null>(null);
  const [selections, setSelections] = useState<Record<string, "old" | "new">>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleDownload() {
    setError("");
    const result = await downloadBudgetLinesCsv(budgetId);
    if ("error" in result) {
      setError(result.error ?? "Unknown error");
      return;
    }
    const blob = new Blob([result.csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "budget-lines.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setLoading(true);

    try {
      let parsed: ParsedLine[];

      if (file.name.endsWith(".csv")) {
        const text = await file.text();
        parsed = parseCSV(text);
      } else {
        const buf = await file.arrayBuffer();
        parsed = parseExcel(buf);
      }

      if (parsed.length === 0) {
        setError("No valid lines found in file.");
        setLoading(false);
        return;
      }

      const result = await previewImport(budgetId, parsed);
      if ("error" in result) {
        setError(result.error);
      } else {
        setPreview(result.lines);
        const defaults: Record<string, "old" | "new"> = {};
        result.lines.forEach((l) => {
          if (l.status === "changed") defaults[l.name] = "new";
        });
        setSelections(defaults);
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

    const linesToApply = preview
      .filter((l) => {
        if (l.status === "new") return true;
        if (l.status === "changed" && selections[l.name] === "new") return true;
        return false;
      })
      .map((l) => ({ name: l.name, code: l.code, category: l.category, months: l.months }));

    if (linesToApply.length === 0) {
      setError("No lines selected to import.");
      setLoading(false);
      return;
    }

    const result = await applyImport(budgetId, linesToApply);
    if ("error" in result) {
      setError(result.error ?? "Unknown error");
    } else {
      setPreview(null);
    }
    setLoading(false);
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <Button variant="outline" size="sm" onClick={handleDownload}>
          Download CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={loading}
        >
          {loading ? "Processing..." : "Import CSV / Excel"}
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

      {preview && (
        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm dark:bg-gray-900">
          <h3 className="mb-3 text-lg font-semibold">Import Preview</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-gray-500">
                <tr>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Code</th>
                  {MONTH_SHORT.map((m) => (
                    <th key={m} className="pb-2 text-right font-medium text-xs">{m}</th>
                  ))}
                  <th className="pb-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((line) => (
                  <tr key={line.name} className="border-b">
                    <td className="py-2">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                          line.status === "new"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : line.status === "changed"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {line.status}
                      </span>
                    </td>
                    <td className="py-2 text-xs">
                      {line.status === "changed" && line.existingCategory && line.existingCategory !== line.category ? (
                        <div>
                          <div className="text-red-400 line-through">{line.existingCategory}</div>
                          <div className="text-green-600">{line.category}</div>
                        </div>
                      ) : (
                        line.category
                      )}
                    </td>
                    <td className="py-2">{line.name}</td>
                    <td className="py-2 text-gray-500">{line.code || "—"}</td>
                    {line.months.map((val, i) => (
                      <td key={i} className="py-2 text-right text-xs">
                        {line.status === "changed" && line.existingMonths ? (
                          <div>
                            {val !== line.existingMonths[i] ? (
                              <>
                                <div className="text-red-400 line-through">{line.existingMonths[i]}</div>
                                <div className="text-green-600">{val}</div>
                              </>
                            ) : (
                              val
                            )}
                          </div>
                        ) : (
                          val
                        )}
                      </td>
                    ))}
                    <td className="py-2">
                      {line.status === "new" && (
                        <span className="text-xs text-green-600">Will add</span>
                      )}
                      {line.status === "unchanged" && (
                        <span className="text-xs text-gray-400">Skip</span>
                      )}
                      {line.status === "changed" && (
                        <div className="flex gap-2">
                          <label className="flex items-center gap-1 text-xs">
                            <input
                              type="radio"
                              name={`choice-${line.name}`}
                              checked={selections[line.name] === "old"}
                              onChange={() =>
                                setSelections((s) => ({ ...s, [line.name]: "old" }))
                              }
                            />
                            Keep old
                          </label>
                          <label className="flex items-center gap-1 text-xs">
                            <input
                              type="radio"
                              name={`choice-${line.name}`}
                              checked={selections[line.name] === "new"}
                              onChange={() =>
                                setSelections((s) => ({ ...s, [line.name]: "new" }))
                              }
                            />
                            Use new
                          </label>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex gap-2">
            <Button size="sm" onClick={handleApply} disabled={loading}>
              {loading ? "Applying..." : "Apply"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPreview(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
