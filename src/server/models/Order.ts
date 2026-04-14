import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import type { PackageKey } from "../constants/mlm";

export type OrderStatus = "draft" | "pending" | "paid" | "cancelled";

export interface IOrderItem {
  productId: Types.ObjectId;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  packageKey: PackageKey | null;
}

export interface IOrder extends Document {
  userId: Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  totalPv: number;
  status: OrderStatus;
  /** Prevents double commission run */
  commissionsDistributed: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    lineTotal: { type: Number, required: true },
    packageKey: {
      type: String,
      enum: ["BASIC_4999", "STANDARD_9999", "PREMIUM_24999", null],
      default: null,
    },
  },
  { _id: false },
);

const OrderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [OrderItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    totalPv: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["draft", "pending", "paid", "cancelled"],
      default: "draft",
    },
    commissionsDistributed: { type: Boolean, default: false },
    notes: String,
  },
  { timestamps: true },
);

OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ userId: 1, status: 1 });

export const Order: Model<IOrder> =
  mongoose.models.Order ?? mongoose.model<IOrder>("Order", OrderSchema);
