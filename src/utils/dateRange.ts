export type DateRangePreset = "all" | "7d" | "30d" | "90d";

export function presetToFromTo(preset: DateRangePreset): { from?: string; to?: string } {
  if (preset === "all") {
    return {};
  }

  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);

  const toYmd = (d: Date): string => d.toISOString().slice(0, 10);

  return {
    from: toYmd(start),
    to: toYmd(end),
  };
}
