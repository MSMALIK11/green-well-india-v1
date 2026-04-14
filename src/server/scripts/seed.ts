import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { env } from "../config/env";
import { User } from "../models/User";
import { Product } from "../models/Product";
import { applyWalletChange } from "../services/wallet.service";

const ROOT_REFERRAL = "ROOT000001";

async function seed() {
  await mongoose.connect(env.mongoUri);
  console.log("Connected");

  let root = await User.findOne({ referralId: ROOT_REFERRAL });
  if (!root) {
    const passwordHash = await bcrypt.hash("Admin@123", 12);
    root = await User.create({
      name: "Root Founder",
      email: "root@mlm-saas.local",
      phone: "9999990000",
      passwordHash,
      referralId: ROOT_REFERRAL,
      sponsorId: null,
      ancestorChain: [],
      rank: "Founder",
      packageKey: "PREMIUM_24999",
      activationStatus: "active",
      kycStatus: "approved",
      kyc: { documentUrls: [] },
      wallets: { package: 0, activation: 0, shopping: 0 },
      role: "admin",
      refreshTokenHashes: [],
    });
    console.log("Created root admin", ROOT_REFERRAL);
  }

  let admin = await User.findOne({ email: "admin@mlm-saas.local" });
  if (!admin) {
    const passwordHash = await bcrypt.hash("Admin@123", 12);
    admin = await User.create({
      name: "System Admin",
      email: "admin@mlm-saas.local",
      phone: "9999990001",
      passwordHash,
      referralId: "ADM000001",
      sponsorId: root._id,
      ancestorChain: [root._id as mongoose.Types.ObjectId],
      rank: "Admin",
      packageKey: null,
      activationStatus: "active",
      kycStatus: "approved",
      kyc: { documentUrls: [] },
      wallets: { package: 0, activation: 0, shopping: 0 },
      role: "admin",
      refreshTokenHashes: [],
    });
    console.log("Created admin under root");
  }

  let demo = await User.findOne({ email: "user@mlm-saas.local" });
  if (!demo) {
    const passwordHash = await bcrypt.hash("User@12345", 12);
    demo = await User.create({
      name: "Demo Distributor",
      email: "user@mlm-saas.local",
      phone: "9999990002",
      passwordHash,
      referralId: "USR000001",
      sponsorId: root._id,
      ancestorChain: [root._id as mongoose.Types.ObjectId],
      rank: "Member",
      packageKey: null,
      activationStatus: "inactive",
      kycStatus: "pending",
      kyc: { documentUrls: [] },
      wallets: { package: 0, activation: 0, shopping: 0 },
      role: "user",
      refreshTokenHashes: [],
    });
    console.log("Created demo user USR000001 / User@12345 — sponsor:", ROOT_REFERRAL);
  }

  if (demo.wallets.shopping < 10_000) {
    await applyWalletChange(
      demo._id as mongoose.Types.ObjectId,
      "shopping",
      "credit",
      100_000,
      "adjustment",
      "seed",
      "demo_shopping_balance",
      "Seed shopping balance for checkout demo",
    );
  }

  const products = [
    {
      name: "Starter Pack ₹4999",
      slug: "starter-4999",
      description: "1 PV activation package",
      price: 4999,
      packageKey: "BASIC_4999" as const,
      stock: 500,
    },
    {
      name: "Growth Pack ₹9999",
      slug: "growth-9999",
      description: "2 PV activation package",
      price: 9999,
      packageKey: "STANDARD_9999" as const,
      stock: 500,
    },
    {
      name: "Elite Pack ₹24999",
      slug: "elite-24999",
      description: "5 PV activation package",
      price: 24999,
      packageKey: "PREMIUM_24999" as const,
      stock: 500,
    },
  ];

  for (const p of products) {
    const exists = await Product.findOne({ slug: p.slug });
    if (!exists) {
      await Product.create({ ...p, active: true });
      console.log("Product", p.slug);
    }
  }

  console.log("Seed done.");
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
