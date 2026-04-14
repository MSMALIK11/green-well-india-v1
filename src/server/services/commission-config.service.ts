import {
  DEFAULT_COMMISSION_BAND_RUPEES,
  levelCommissionFromBands,
} from "../constants/mlm";
import {
  CommissionConfig,
  COMMISSION_CONFIG_KEY,
  type ICommissionBandRow,
} from "../models/CommissionConfig";

export type BandRupeesTuple = [number, number, number];

function defaultBandsAsRows(): ICommissionBandRow[] {
  return DEFAULT_COMMISSION_BAND_RUPEES.map(([t0, t1, t2]) => ({ t0, t1, t2 }));
}

/** Rows for API / admin UI (always length 5). */
export async function getCommissionConfigRows(): Promise<ICommissionBandRow[]> {
  const doc = await CommissionConfig.findOne({ key: COMMISSION_CONFIG_KEY }).lean();
  if (!doc?.bandRupees || doc.bandRupees.length !== 5) {
    return defaultBandsAsRows();
  }
  return doc.bandRupees.map((r) => ({
    t0: Math.round(r.t0),
    t1: Math.round(r.t1),
    t2: Math.round(r.t2),
  }));
}

export async function setCommissionConfigRows(rows: ICommissionBandRow[]): Promise<void> {
  await CommissionConfig.findOneAndUpdate(
    { key: COMMISSION_CONFIG_KEY },
    {
      $set: { bandRupees: rows },
      $setOnInsert: { key: COMMISSION_CONFIG_KEY },
    },
    { upsert: true, new: true },
  );
}

/** Tuples for payout loop (fresh snapshot per order). */
export async function getCommissionBandRupeesTuples(): Promise<BandRupeesTuple[]> {
  const rows = await getCommissionConfigRows();
  return rows.map((r) => [r.t0, r.t1, r.t2]);
}

export function rupeesForLevel(
  bands: BandRupeesTuple[],
  uplineLevel: number,
  packageTier: 0 | 1 | 2,
): number {
  return levelCommissionFromBands(bands, uplineLevel, packageTier);
}
