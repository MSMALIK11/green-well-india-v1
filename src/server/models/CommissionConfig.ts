import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ICommissionBandRow {
  t0: number;
  t1: number;
  t2: number;
}

export interface ICommissionConfig extends Document {
  key: string;
  bandRupees: ICommissionBandRow[];
}

const BandRowSchema = new Schema<ICommissionBandRow>(
  {
    t0: { type: Number, required: true, min: 0, max: 1_000_000_000 },
    t1: { type: Number, required: true, min: 0, max: 1_000_000_000 },
    t2: { type: Number, required: true, min: 0, max: 1_000_000_000 },
  },
  { _id: false },
);

const CommissionConfigSchema = new Schema<ICommissionConfig>(
  {
    key: { type: String, required: true, unique: true },
    bandRupees: {
      type: [BandRowSchema],
      required: true,
      validate: {
        validator: (v: ICommissionBandRow[]) =>
          Array.isArray(v) && v.length === 5 && v.every((r) => r && [r.t0, r.t1, r.t2].every((n) => n >= 0)),
        message: "bandRupees must have exactly 5 rows with non-negative t0,t1,t2",
      },
    },
  },
  {
    collection: "commission_config",
    versionKey: false,
  },
);

export const CommissionConfig: Model<ICommissionConfig> =
  mongoose.models.CommissionConfig ??
  mongoose.model<ICommissionConfig>("CommissionConfig", CommissionConfigSchema);

export const COMMISSION_CONFIG_KEY = "default";
