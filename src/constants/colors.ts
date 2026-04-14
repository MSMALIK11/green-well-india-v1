/**
 * Brand & UI palette (hex). Use in inline styles, SVG `fill`, `style={{ color }}`, etc.
 * For Tailwind, prefer arbitrary values with these constants where needed.
 */

/** Primary brand green (logo / buttons / accents). */
export const BRAND_PRIMARY_GREEN = "#2e7d32";

/** Lighter leaf / highlight green. */
export const BRAND_LIGHT_GREEN = "#7cb342";

/** Dark forest headings / footer. */
export const BRAND_FOREST_DARK = "#1b5e20";

/** Hover state for primary green surfaces. */
export const BRAND_PRIMARY_HOVER = "#256628";

/** Register shell (LLP reference). */
export const REGISTER_PAGE_BG = "#f4f7f4";

/** Lucide leaf rain: alternate between the two brand greens. */
export const BRAND_LEAF_COLORS = [
  BRAND_PRIMARY_GREEN,
  BRAND_LIGHT_GREEN,
] as const;

/** Dot texture for register page background. */
export function registerPageBackgroundImage(): string {
  return `radial-gradient(${BRAND_LIGHT_GREEN} 0.5px, transparent 0.5px), radial-gradient(${BRAND_PRIMARY_GREEN} 0.5px, ${REGISTER_PAGE_BG} 0.5px)`;
}
