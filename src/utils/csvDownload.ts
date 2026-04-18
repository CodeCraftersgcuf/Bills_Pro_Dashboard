/** Escape a field for CSV (RFC-style quoting). */
export function csvEscape(v: unknown): string {
  const s = v == null ? "" : String(v);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** UTF-8 BOM so Excel opens UTF-8 CSV correctly. */
const BOM = "\uFEFF";

/**
 * Triggers a browser download of a CSV file.
 */
export function downloadCsv(filenameBase: string, headers: string[], rows: unknown[][]): void {
  if (headers.length === 0) return;
  const line0 = headers.map(csvEscape).join(",");
  const rest = rows.map((r) => r.map(csvEscape).join(","));
  const text = [BOM + line0, ...rest].join("\r\n");
  const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenameBase}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
