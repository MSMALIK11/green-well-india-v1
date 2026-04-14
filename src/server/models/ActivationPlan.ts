import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { PackageKey } from "../constants/mlm";

export interface IActivationPlan extends Document {
  name: string;
  slug: string;
  description: string;
  packageKey: PackageKey;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ActivationPlanSchema = new Schema<IActivationPlan>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "" },
    packageKey: {
      type: String,
      required: true,
      enum: ["BASIC_4999", "STANDARD_9999", "PREMIUM_24999"],
    },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

ActivationPlanSchema.index({ active: 1, sortOrder: 1 });

export const ActivationPlan: Model<IActivationPlan> =
  mongoose.models.ActivationPlan ??
  mongoose.model<IActivationPlan>("ActivationPlan", ActivationPlanSchema);
