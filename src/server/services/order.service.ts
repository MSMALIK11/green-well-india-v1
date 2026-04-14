import mongoose from "mongoose";
import { Order, type IOrder } from "../models/Order";
import { Product } from "../models/Product";
import { User } from "../models/User";
import { PACKAGE_PV, type PackageKey } from "../constants/mlm";
import { distributeOrderCommissions } from "./commission.service";
import { applyWalletChange } from "./wallet.service";
import { AppError, assertApp } from "../utils/errors";

export async function buildOrderPreview(
  _userId: mongoose.Types.ObjectId,
  items: { productId: string; quantity: number }[],
): Promise<{ subtotal: number; totalPv: number; lines: IOrder["items"] }> {
  let subtotal = 0;
  let totalPv = 0;
  const lines: IOrder["items"] = [];

  for (const raw of items) {
    const product = await Product.findById(raw.productId);
    assertApp(product, 404, `Product ${raw.productId} not found`);
    assertApp(product.active, 400, `Product inactive: ${product.name}`);
    assertApp(product.stock >= raw.quantity, 400, `Insufficient stock: ${product.name}`);
    const lineTotal = product.price * raw.quantity;
    subtotal += lineTotal;
    const pk = product.packageKey as PackageKey | null;
    if (pk && PACKAGE_PV[pk]) {
      totalPv += PACKAGE_PV[pk].pv * raw.quantity;
    }
    lines.push({
      productId: product._id as mongoose.Types.ObjectId,
      name: product.name,
      quantity: raw.quantity,
      unitPrice: product.price,
      lineTotal,
      packageKey: product.packageKey as PackageKey | null,
    });
  }

  return { subtotal, totalPv, lines };
}

export async function createOrder(
  userId: mongoose.Types.ObjectId,
  items: { productId: string; quantity: number }[],
  status: "draft" | "pending" = "draft",
): Promise<IOrder> {
  const { subtotal, totalPv, lines } = await buildOrderPreview(userId, items);
  return Order.create({
    userId,
    items: lines,
    subtotal,
    totalPv,
    status,
    commissionsDistributed: false,
  });
}

export async function markOrderPaid(orderId: string, userId: string): Promise<void> {
  const order = await Order.findById(orderId);
  assertApp(order, 404, "Order not found");
  assertApp(String(order.userId) === userId, 403, "Not your order");
  assertApp(order.status === "pending" || order.status === "draft", 400, "Invalid status");

  order.status = "paid";
  await order.save();

  try {
    await distributeOrderCommissions(String(order._id));
  } catch (e) {
    order.status = "pending";
    await order.save();
    throw e;
  }

  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { stock: -item.quantity },
    });
  }

  const buyer = await User.findById(userId);
  if (buyer) {
    const firstPkg = order.items.find((i) => i.packageKey)?.packageKey;
    if (firstPkg) {
      buyer.packageKey = firstPkg as PackageKey;
      buyer.activationStatus = "active";
      await buyer.save();
    }
  }
}

/** Debit shopping wallet for order total (demo payment rail) */
export async function payOrderFromShoppingWallet(
  orderId: string,
  userId: string,
): Promise<void> {
  const order = await Order.findById(orderId);
  assertApp(order, 404, "Order not found");
  assertApp(String(order.userId) === userId, 403, "Not your order");
  const buyer = await User.findById(userId);
  assertApp(buyer, 404, "User not found");
  const have = buyer.wallets.shopping;
  const need = order.subtotal;
  if (have < need) {
    throw new AppError(
      400,
      `Insufficient shopping wallet: need ₹${need.toLocaleString("en-IN")}, have ₹${have.toLocaleString("en-IN")}. In Admin → Users → Allocate, credit the Shopping wallet (not Package). Basic ₹4,999 and Smart ₹9,999 fit ₹10,000; Prime is ₹24,999.`,
    );
  }
  const uid = new mongoose.Types.ObjectId(userId);
  await applyWalletChange(
    uid,
    "shopping",
    "debit",
    order.subtotal,
    "purchase",
    "order",
    String(order._id),
    `Order ${String(order._id)}`,
  );
  await markOrderPaid(orderId, userId);
}
