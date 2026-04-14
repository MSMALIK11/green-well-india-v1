import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

/** One document per (order, beneficiary, level) — unique index blocks duplicates */
export interface ICommissionPayout extends Document {
  orderId: Types.ObjectId;
  beneficiaryId: Types.ObjectId;
  buyerId: Types.ObjectId;
  productId: Types.ObjectId;
  level: number;
  amount: number;
  wallet: "package";
  createdAt: Date;
}

const CommissionPayoutSchema = new Schema<ICommissionPayout>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    beneficiaryId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    level: { type: Number, required: true, min: 1, max: 20 },
    amount: { type: Number, required: true },
    wallet: { type: String, enum: ["package"], default: "package" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

CommissionPayoutSchema.index(
  { orderId: 1, beneficiaryId: 1, level: 1, productId: 1 },
  { unique: true },
);

export const CommissionPayout: Model<ICommissionPayout> =
  mongoose.models.CommissionPayout ??
  mongoose.model<ICommissionPayout>("CommissionPayout", CommissionPayoutSchema);
