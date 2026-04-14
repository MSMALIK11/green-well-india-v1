/** Package SKU → PV (Point Value) for commission math */
export const PACKAGE_PV: Record<string, { price: number; pv: number; tier: 0 | 1 | 2 }> = {
  BASIC_4999: { price: 4999, pv: 1, tier: 0 },
  STANDARD_9999: { price: 9999, pv: 2, tier: 1 },
  PREMIUM_24999: { price: 24999, pv: 5, tier: 2 },
};

export type PackageKey = keyof typeof PACKAGE_PV;

/**
 * Five bands matching upline distance from buyer: L1, L2, L3–4, L5–10, L11–20.
 * Each row is [Basic tier ₹, Smart tier ₹, Prime tier ₹] (package tiers 0, 1, 2).
 */
export const DEFAULT_COMMISSION_BAND_RUPEES: readonly [
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number],
] = [
  [200, 400, 1000],
  [100, 200, 500],
  [50, 100, 250],
  [25, 50, 125],
  [5, 10, 25],
];

/** Band index 0..4 for upline levels 1..20; -1 if out of range */
export function bandIndexForUplineLevel(uplineLevelFromBuyer: number): number {
  if (uplineLevelFromBuyer < 1 || uplineLevelFromBuyer > 20) return -1;
  if (uplineLevelFromBuyer === 1) return 0;
  if (uplineLevelFromBuyer === 2) return 1;
  if (uplineLevelFromBuyer <= 4) return 2;
  if (uplineLevelFromBuyer <= 10) return 3;
  return 4;
}

export function levelCommissionFromBands(
  bands: readonly (readonly [number, number, number])[],
  uplineLevelFromBuyer: number,
  packageTier: 0 | 1 | 2,
): number {
  const idx = bandIndexForUplineLevel(uplineLevelFromBuyer);
  if (idx < 0) return 0;
  const row = bands[idx];
  if (!row) return 0;
  return row[packageTier] ?? 0;
}

/** Default matrix only — runtime payouts use DB config via commission-config service. */
export function levelCommissionRupees(
  uplineLevelFromBuyer: number,
  packageTier: 0 | 1 | 2,
): number {
  return levelCommissionFromBands(
    DEFAULT_COMMISSION_BAND_RUPEES,
    uplineLevelFromBuyer,
    packageTier,
  );
}
