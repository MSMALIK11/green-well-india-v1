import crypto from "crypto";
import mongoose from "mongoose";
import type { ClientSession } from "mongoose";
import { User, type IUser } from "../models/User";
import type { WalletKind } from "../models/LedgerEntry";
import { LedgerEntry, type IncomeKind } from "../models/LedgerEntry";
import { AppError } from "../utils/errors";

function readWallet(user: IUser, w: WalletKind): number {
  return user.wallets[w];
}

export async function applyWalletChange(
  userId: mongoose.Types.ObjectId,
  wallet: WalletKind,
  direction: "credit" | "debit",
  amount: number,
  incomeKind: IncomeKind,
  referenceType: string,
  referenceId: string,
  description?: string,
  meta?: Record<string, unknown>,
  existingSession?: ClientSession,
): Promise<number> {
  if (amount <= 0 || !Number.isFinite(amount)) {
    throw new AppError(400, "Invalid amount");
  }

  const run = async (session: ClientSession) => {
    const user = await User.findById(userId).session(session);
    if (!user) throw new AppError(404, "User not found");

    const current = readWallet(user, wallet);
    const next =
      direction === "credit" ? current + amount : current - amount;
    if (next < 0) throw new AppError(400, "Insufficient wallet balance");

    user.wallets[wallet] = next;
    await user.save({ session });

    await LedgerEntry.create(
      [
        {
          userId,
          wallet,
          direction,
          amount,
          balanceAfter: next,
          incomeKind,
          referenceType,
          referenceId,
          description,
          meta,
        },
      ],
      { session },
    );

    return next;
  };

  if (existingSession) return run(existingSession);

  const session = await mongoose.startSession();
  try {
    let result = 0;
    await session.withTransaction(async () => {
      result = await run(session);
    });
    return result;
  } finally {
    session.endSession();
  }
}

/** Move funds between a user's wallets inside one transaction */
export async function transferBetweenWallets(
  userId: mongoose.Types.ObjectId,
  from: WalletKind,
  to: WalletKind,
  amount: number,
): Promise<void> {
  if (from === to) throw new AppError(400, "Same wallet");
  const ref = crypto.randomUUID();
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await applyWalletChange(
        userId,
        from,
        "debit",
        amount,
        "transfer",
        "internal_transfer",
        `${ref}_out`,
        `Transfer to ${to}`,
        { to },
        session,
      );
      await applyWalletChange(
        userId,
        to,
        "credit",
        amount,
        "transfer",
        "internal_transfer",
        `${ref}_in`,
        `Transfer from ${from}`,
        { from },
        session,
      );
    });
  } finally {
    session.endSession();
  }
}
