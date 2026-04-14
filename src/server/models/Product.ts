import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { PackageKey } from "../constants/mlm";

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  price: number;
  /** Optional link to MLM package tier for PV on purchase */
  packageKey: PackageKey | null;
  imageUrl?: string;
  stock: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    packageKey: {
      type: String,
      enum: ["BASIC_4999", "STANDARD_9999", "PREMIUM_24999", null],
      default: null,
    },
    imageUrl: String,
    stock: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Product: Model<IProduct> =
  mongoose.models.Product ?? mongoose.model<IProduct>("Product", ProductSchema);
