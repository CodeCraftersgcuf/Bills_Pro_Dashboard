export type DateRangePreset = "all" | "7d" | "30d" | "90d" | "custom";

function toYmdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Default window when user picks “Custom” (last 7 local days). */
export function defaultCustomRangeLocal(): { from: string; to: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 7);
  return { from: toYmdLocal(start), to: toYmdLocal(end) };
}

export function presetToFromTo(
  preset: DateRangePreset,
  custom?: { from: string; to: string }
): { from?: string; to?: string } {
  if (preset === "all") {
    return {};
  }
  if (preset === "custom") {
    const f = custom?.from?.trim();
    const t = custom?.to?.trim();
    if (f && t) return { from: f, to: t };
    return {};
  }

  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);

  return {
    from: toYmdLocal(start),
    to: toYmdLocal(end),
  };
}
