import { ActivationPlan, type IActivationPlan } from "../models/ActivationPlan";
import { PACKAGE_PV, type PackageKey } from "../constants/mlm";

const PACKAGE_KEYS: PackageKey[] = ["BASIC_4999", "STANDARD_9999", "PREMIUM_24999"];

export type ActivationPlanRow = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  packageKey: PackageKey;
  sortOrder: number;
  active: boolean;
  planLabel: string;
  canonicalPrice: number;
  pv: number;
};

function tierLabel(key: PackageKey): string {
  const meta = PACKAGE_PV[key];
  if (key === "BASIC_4999") return "Basic";
  if (key === "STANDARD_9999") return "Smart";
  if (key === "PREMIUM_24999") return "Prime";
  return meta ? `Tier ${meta.tier}` : key;
}

/** Idempotent defaults for marketing / admin lists (not tied to catalog products). */
export async function ensureDefaultActivationPlans(): Promise<void> {
  const n = await ActivationPlan.countDocuments();
  if (n > 0) return;
  await ActivationPlan.insertMany(
    PACKAGE_KEYS.map((packageKey, i) => ({
      name: `${tierLabel(packageKey)} activation`,
      slug: `default-${packageKey.toLowerCase().replace(/_/g, "-")}`,
      description: `Official ${tierLabel(packageKey)} pack — ${PACKAGE_PV[packageKey].pv} PV.`,
      packageKey,
      sortOrder: i * 10,
      active: true,
    })),
  );
}

export async function listActivationPlansPublic(): Promise<ActivationPlanRow[]> {
  await ensureDefaultActivationPlans();
  const plans = await ActivationPlan.find({ active: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean();
  const rows: ActivationPlanRow[] = [];
  for (const pl of plans) {
    const pk = pl.packageKey as PackageKey;
    const meta = PACKAGE_PV[pk];
    rows.push({
      _id: String(pl._id),
      name: pl.name,
      slug: pl.slug,
      description: pl.description ?? "",
      packageKey: pk,
      sortOrder: pl.sortOrder ?? 0,
      active: pl.active ?? true,
      planLabel: tierLabel(pk),
      canonicalPrice: meta.price,
      pv: meta.pv,
    });
  }
  return rows;
}

export async function listActivationPlansAdmin(): Promise<
  Record<string, unknown>[]
> {
  await ensureDefaultActivationPlans();
  return ActivationPlan.find({}).sort({ sortOrder: 1, name: 1 }).lean();
}

export async function createActivationPlan(input: {
  name: string;
  slug: string;
  description?: string;
  packageKey: PackageKey;
  sortOrder?: number;
  active?: boolean;
}): Promise<IActivationPlan> {
  return ActivationPlan.create({
    name: input.name.trim(),
    slug: input.slug.trim().toLowerCase().replace(/\s+/g, "-"),
    description: input.description?.trim() ?? "",
    packageKey: input.packageKey,
    sortOrder: input.sortOrder ?? 0,
    active: input.active ?? true,
  });
}

export async function updateActivationPlan(
  id: string,
  input: Partial<{
    name: string;
    slug: string;
    description: string;
    packageKey: PackageKey;
    sortOrder: number;
    active: boolean;
  }>,
): Promise<IActivationPlan | null> {
  const current = await ActivationPlan.findById(id);
  if (!current) return null;

  const update: Record<string, unknown> = {};
  if (input.name !== undefined) update.name = input.name.trim();
  if (input.slug !== undefined) {
    update.slug = input.slug.trim().toLowerCase().replace(/\s+/g, "-");
  }
  if (input.description !== undefined) update.description = input.description.trim();
  if (input.packageKey !== undefined) update.packageKey = input.packageKey;
  if (input.sortOrder !== undefined) update.sortOrder = input.sortOrder;
  if (input.active !== undefined) update.active = input.active;

  return ActivationPlan.findByIdAndUpdate(id, update, { new: true });
}

export async function deleteActivationPlan(id: string): Promise<boolean> {
  const r = await ActivationPlan.findByIdAndDelete(id);
  return !!r;
}
