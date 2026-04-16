/**
 * Turn API snake_case / enum tokens into readable labels (e.g. `crypto_deposit` → `Crypto Deposit`).
 * Long free-text (e.g. descriptions) only gets underscores → spaces; casing is left unchanged.
 */
export function humanizeApiLabel(value: string | null | undefined): string {
  const raw = String(value ?? "").trim();
  if (!raw || raw === "—") return raw === "—" ? "—" : "";
  const spaced = raw.replace(/_/g, " ").replace(/\s+/g, " ").trim();
  if (!spaced) return "";
  const words = spaced.split(" ");
  if (words.length > 8 || spaced.length > 60) {
    return spaced;
  }
  return words
    .map((w) => {
      if (!w.length) return "";
      if (/^[A-Z0-9]{2,}$/.test(w)) return w;
      return w[0].toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

export function humanizeApiLabelOrDash(value: string | null | undefined): string {
  const h = humanizeApiLabel(value);
  return h || "—";
}

/** Prefer humanized category, then type (matches admin transaction list behaviour). */
export function humanizeTransactionSubtype(t: { category?: string | null; type?: string | null }): string {
  const cat = humanizeApiLabel(t.category);
  const ty = humanizeApiLabel(t.type);
  if (cat && cat !== "—") return cat;
  if (ty && ty !== "—") return ty;
  return "—";
}
