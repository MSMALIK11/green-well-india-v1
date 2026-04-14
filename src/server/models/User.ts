import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import type { PackageKey } from "../constants/mlm";

export type Role = "user" | "admin";
export type ActivationStatus = "active" | "inactive";
export type KycStatus = "pending" | "approved" | "rejected";

export interface IWallets {
  package: number;
  activation: number;
  shopping: number;
}

export interface IKyc {
  pan?: string;
  aadhar?: string;
  documentUrls: string[];
  rejectionReason?: string;
}

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  referralId: string;
  sponsorId: Types.ObjectId | null;
  /** Nearest sponsor first, up to 20 ids (for fast upline commission) */
  ancestorChain: Types.ObjectId[];
  rank: string;
  packageKey: PackageKey | null;
  activationStatus: ActivationStatus;
  kycStatus: KycStatus;
  kyc: IKyc;
  wallets: IWallets;
  role: Role;
  refreshTokenHashes: string[];
  /** Genealogy left/right leg under sponsor (optional; legacy users unset). */
  binaryPlacement?: "left" | "right";
  createdAt: Date;
  updatedAt: Date;
}

const WalletsSchema = new Schema<IWallets>(
  {
    package: { type: Number, default: 0 },
    activation: { type: Number, default: 0 },
    shopping: { type: Number, default: 0 },
  },
  { _id: false },
);

const KycSchema = new Schema<IKyc>(
  {
    pan: String,
    aadhar: String,
    documentUrls: { type: [String], default: [] },
    rejectionReason: String,
  },
  { _id: false },
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    referralId: { type: String, required: true, unique: true, uppercase: true },
    sponsorId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    ancestorChain: [{ type: Schema.Types.ObjectId, ref: "User" }],
    rank: { type: String, default: "Member" },
    packageKey: {
      type: String,
      enum: ["BASIC_4999", "STANDARD_9999", "PREMIUM_24999", null],
      default: null,
    },
    activationStatus: {
      type: String,
      enum: ["active", "inactive"],
      default: "inactive",
    },
    kycStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    kyc: { type: KycSchema, default: () => ({ documentUrls: [] }) },
    wallets: { type: WalletsSchema, default: () => ({}) },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    refreshTokenHashes: { type: [String], default: [] },
    binaryPlacement: {
      type: String,
      enum: ["left", "right"],
      required: false,
    },
  },
  { timestamps: true },
);

UserSchema.index({ sponsorId: 1 });
UserSchema.index({ sponsorId: 1, binaryPlacement: 1 });
UserSchema.index({ "ancestorChain.0": 1 });

export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);
