/** Official MLM tiers — must match backend `PACKAGE_PV` / Product.packageKey enum. */
export const ACTIVATION_PACKAGE_KEYS = [
  "BASIC_4999",
  "STANDARD_9999",
  "PREMIUM_24999",
] as const;

export type ActivationPackageKey = (typeof ACTIVATION_PACKAGE_KEYS)[number];

export const ACTIVATION_TIERS: Record<
  ActivationPackageKey,
  { planLabel: string; price: number; pv: number }
> = {
  BASIC_4999: { planLabel: "Basic", price: 4999, pv: 1 },
  STANDARD_9999: { planLabel: "Smart", price: 9999, pv: 2 },
  PREMIUM_24999: { planLabel: "Prime", price: 24999, pv: 5 },
};

/** Mirrors backend PACKAGE_PV for display (PV / tier labels). */
export const PACKAGE_DISPLAY: Record<
  string,
  { pv: number; shortLabel: string }
> = {
  BASIC_4999: { pv: 1, shortLabel: "Basic" },
  STANDARD_9999: { pv: 2, shortLabel: "Smart" },
  PREMIUM_24999: { pv: 5, shortLabel: "Prime" },
};

type ProductLike = {
  _id: string;
  packageKey: string | null;
  /** Public catalog omits this; treat missing as active. */
  active?: boolean;
  stock: number;
  price: number;
  name: string;
  description?: string;
};

/** One row per official tier; picks a single catalog product per tier (highest stock first). */
export function buildActivationPlanRows(products: readonly ProductLike[]) {
  return ACTIVATION_PACKAGE_KEYS.map((packageKey) => {
    const tier = ACTIVATION_TIERS[packageKey];
    const matches = products.filter(
      (p) =>
        p.packageKey === packageKey &&
        (p.active ?? true) &&
        p.stock >= 1,
    );
    const sorted = [...matches].sort(
      (a, b) =>
        b.stock - a.stock || String(a._id).localeCompare(String(b._id)),
    );
    const product = sorted[0] ?? null;
    return {
      packageKey,
      planLabel: tier.planLabel,
      canonicalPrice: tier.price,
      pv: tier.pv,
      product,
    };
  });
}

export function pvForProduct(packageKey: string | null | undefined): number {
  if (!packageKey) return 0;
  return PACKAGE_DISPLAY[packageKey]?.pv ?? 0;
}

export function bvFromPrice(price: number): number {
  return Math.round(price / 100);
}
