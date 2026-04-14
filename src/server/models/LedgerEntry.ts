import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export type WalletKind = "package" | "activation" | "shopping";
export type LedgerDirection = "credit" | "debit";
export type IncomeKind = "level" | "lbd" | "reward" | "transfer" | "purchase" | "adjustment";

export interface ILedgerEntry extends Document {
  userId: Types.ObjectId;
  wallet: WalletKind;
  direction: LedgerDirection;
  amount: number;
  balanceAfter: number;
  incomeKind: IncomeKind;
  referenceType: string;
  referenceId: string;
  description?: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

const LedgerSchema = new Schema<ILedgerEntry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    wallet: {
      type: String,
      enum: ["package", "activation", "shopping"],
      required: true,
    },
    direction: { type: String, enum: ["credit", "debit"], required: true },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    incomeKind: {
      type: String,
      enum: ["level", "lbd", "reward", "transfer", "purchase", "adjustment"],
      required: true,
    },
    referenceType: { type: String, required: true },
    referenceId: { type: String, required: true },
    description: String,
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

LedgerSchema.index({ userId: 1, createdAt: -1 });
LedgerSchema.index({ referenceType: 1, referenceId: 1 });

export const LedgerEntry: Model<ILedgerEntry> =
  mongoose.models.LedgerEntry ??
  mongoose.model<ILedgerEntry>("LedgerEntry", LedgerSchema);
