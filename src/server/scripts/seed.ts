import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { env } from "../config/env";
import { User } from "../models/User";
import { Product } from "../models/Product";
import { applyWalletChange } from "../services/wallet.service";

const ROOT_REFERRAL = "ROOT000001";
const ADMIN_REFERRAL = "ADM000001";

/** Default admin login (override with SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD). */
const SEED_ADMIN_EMAIL =
  process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase() || "greenwell@gmail.com";
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "admin123";

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

  const adminHash = await bcrypt.hash(SEED_ADMIN_PASSWORD, 12);
  /** Prefer referral id, then legacy seed emails, then current SEED_ADMIN_EMAIL. */
  let admin =
    (await User.findOne({ referralId: ADMIN_REFERRAL })) ??
    (await User.findOne({ email: "admin@mlm-saas.local" })) ??
    (await User.findOne({ email: "adminz@gmail.com" })) ??
    (await User.findOne({ email: SEED_ADMIN_EMAIL }));

  if (admin) {
    await User.updateOne(
      { _id: admin._id },
      {
        $set: {
          email: SEED_ADMIN_EMAIL,
          passwordHash: adminHash,
          role: "admin",
          refreshTokenHashes: [],
        },
      },
    );
    console.log("Updated admin login:", SEED_ADMIN_EMAIL);
  } else {
    admin = await User.create({
      name: "System Admin",
      email: SEED_ADMIN_EMAIL,
      phone: "9999990001",
      passwordHash: adminHash,
      referralId: ADMIN_REFERRAL,
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
    console.log("Created admin under root:", SEED_ADMIN_EMAIL);
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
