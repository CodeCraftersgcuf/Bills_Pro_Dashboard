import type { CSSProperties } from "react";

/** Public asset (Vite): `/card-bg-geometric.png` */
const CARD_BG = "card-bg-geometric.png";

/** Matches Bills Pro app `getCardColor` + 0.7 overlay on `card_background` */
const CARD_TINT_RGBA: Record<string, string> = {
  green: "rgba(27, 128, 15, 0.72)",
  black: "rgba(17, 24, 39, 0.78)",
  purple: "rgba(107, 70, 193, 0.72)",
  red: "rgba(220, 38, 38, 0.72)",
  blue: "rgba(37, 99, 235, 0.72)",
  brown: "rgba(17, 24, 39, 0.78)",
};

export function virtualCardBackgroundUrl(): string {
  const base = import.meta.env.BASE_URL;
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return `${prefix}${CARD_BG}`;
}

/**
 * Layered background: subtle bottom shadow for PAN readability, API `card_color` tint, geometric image.
 */
export function virtualCardSurfaceStyle(cardColor?: string | null): CSSProperties {
  const key = String(cardColor ?? "green").toLowerCase();
  const tint = CARD_TINT_RGBA[key] ?? CARD_TINT_RGBA.green;
  const url = virtualCardBackgroundUrl();
  return {
    backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 45%), linear-gradient(0deg, ${tint}, ${tint}), url("${url}")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  };
}
