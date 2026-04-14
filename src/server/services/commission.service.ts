import mongoose from "mongoose";
import { Order, type IOrder } from "../models/Order";
import { User } from "../models/User";
import { CommissionPayout } from "../models/CommissionPayout";
import { PACKAGE_PV, type PackageKey } from "../constants/mlm";
import {
  getCommissionBandRupeesTuples,
  rupeesForLevel,
} from "./commission-config.service";
import { applyWalletChange } from "./wallet.service";
import { logger } from "../utils/logger";
import { AppError } from "../utils/errors";

function tierForPackageKey(key: PackageKey): 0 | 1 | 2 {
  return PACKAGE_PV[key].tier;
}

/**
 * Distribute level income up to 20 generations for a paid order.
 * Idempotent via CommissionPayout unique index + order flag.
 */
export async function distributeOrderCommissions(orderId: string): Promise<void> {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError(404, "Order not found");
  if (order.status !== "paid") {
    throw new AppError(400, "Order must be paid to distribute commissions");
  }
  if (order.commissionsDistributed) {
    logger.debug("Commissions already distributed", { orderId });
    return;
  }

  const buyer = await User.findById(order.userId);
  if (!buyer) throw new AppError(404, "Buyer not found");

  /** sponsor first, then upline (set at registration) */
  const upline = buyer.ancestorChain.slice(0, 20) as mongoose.Types.ObjectId[];

  const bandRupees = await getCommissionBandRupeesTuples();

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const locked = await Order.findOneAndUpdate(
        { _id: order._id, commissionsDistributed: false },
        { $set: { commissionsDistributed: true } },
        { new: true, session },
      );
      if (!locked) {
        throw new Error("Concurrent commission run");
      }

      for (const item of order.items) {
        if (!item.packageKey) continue;
        const pk = item.packageKey as PackageKey;
        if (!PACKAGE_PV[pk]) continue;
        const tier = tierForPackageKey(pk);
        const qty = item.quantity;

        for (let level = 1; level <= upline.length; level++) {
          const beneficiaryId = upline[level - 1]!;
          const rupees = rupeesForLevel(bandRupees, level, tier) * qty;
          if (rupees <= 0) continue;

          const beneficiary = await User.findById(beneficiaryId).session(session);
          if (!beneficiary) continue;
          if (beneficiary.activationStatus !== "active") continue;

          await CommissionPayout.create(
            [
              {
                orderId: order._id,
                beneficiaryId,
                buyerId: order.userId,
                productId: item.productId,
                level,
                amount: rupees,
                wallet: "package",
              },
            ],
            { session },
          );

          await applyWalletChange(
            beneficiaryId,
            "package",
            "credit",
            rupees,
            "level",
            "order_commission",
            `${String(order._id)}_L${level}_${String(item.productId)}`,
            `Level ${level} income — order ${String(order._id)}`,
            { orderId: String(order._id), level, productId: String(item.productId) },
            session,
          );
        }
      }
    });
  } catch (e) {
    await Order.findByIdAndUpdate(order._id, {
      $set: { commissionsDistributed: false },
    });
    throw e;
  } finally {
    session.endSession();
  }

  logger.info("Commissions distributed", { orderId });
}

export function computeOrderTotalPv(order: IOrder): number {
  let pv = 0;
  for (const item of order.items) {
    if (!item.packageKey) continue;
    const def = PACKAGE_PV[item.packageKey as PackageKey];
    if (def) pv += def.pv * item.quantity;
  }
  return pv;
}
