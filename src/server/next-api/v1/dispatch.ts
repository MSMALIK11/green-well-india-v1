import type { NextRequest } from "next/server";
import fs from "node:fs";
import mongoose from "mongoose";
import { z } from "zod";
import * as XLSX from "xlsx";
import { env } from "@/server/config/env";
import { User } from "@/server/models/User";
import { Order } from "@/server/models/Order";
import { Product } from "@/server/models/Product";
import { LedgerEntry, type WalletKind } from "@/server/models/LedgerEntry";
import { CommissionPayout } from "@/server/models/CommissionPayout";
import {
  MarketingConfig,
  MARKETING_CONFIG_KEY,
} from "@/server/models/MarketingConfig";
import {
  issueTokensForUser,
  loginUser,
  logoutUser,
  refreshSession,
  registerUser,
} from "@/server/services/auth.service";
import {
  buildAuthSetCookieHeaders,
  buildClearAuthCookieHeaders,
  withSetCookies,
} from "@/server/next-api/v1/auth-cookies";
import { readJsonBody } from "@/server/next-api/v1/request-body";
import {
  readRefreshToken,
  requireAccessSession,
  requireAdmin,
} from "@/server/next-api/v1/session";
import {
  getDirectReferrals,
  getLevelTeam,
  getLevelsSummary,
  getTreeForViewer,
  countTotalDownline,
} from "@/server/services/team.service";
import {
  transferBetweenWallets,
  applyWalletChange,
} from "@/server/services/wallet.service";
import {
  buildOrderPreview,
  createOrder,
  payOrderFromShoppingWallet,
} from "@/server/services/order.service";
import { parsePagination } from "@/server/utils/pagination";
import { AppError } from "@/server/utils/errors";
import {
  getCommissionConfigRows,
  setCommissionConfigRows,
} from "@/server/services/commission-config.service";
import { DEFAULT_COMMISSION_BAND_RUPEES } from "@/server/constants/mlm";
import { DEFAULT_HERO_IMAGE_URLS } from "@/server/constants/marketing-hero";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function segmentsAfterV1(url: URL): string[] {
  const parts = url.pathname.split("/").filter(Boolean);
  const i = parts.indexOf("v1");
  return i >= 0 ? parts.slice(i + 1) : [];
}

function notFound(): Response {
  return Response.json({ success: false, error: "Not found" }, { status: 404 });
}

function json(data: unknown, init?: { status?: number }): Response {
  return Response.json(data, { status: init?.status ?? 200 });
}

function xlsxResponse(buf: Buffer, filename: string): Response {
  return new Response(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}

// --- auth ---

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  password: z.string().min(8),
  sponsorReferralId: z.string().optional().default(""),
  binaryPlacement: z.enum(["left", "right"]).optional(),
});

async function dispatchAuth(
  req: NextRequest,
  m: string,
  rest: string[],
): Promise<Response> {
  if (m === "GET" && rest[0] === "sponsor" && rest.length === 2) {
    const ref = z
      .string()
      .min(2)
      .transform((s) => s.trim().toUpperCase())
      .parse(rest[1]);
    const u = await User.findOne({ referralId: ref }).select("name referralId");
    if (!u) return json({ success: false, error: "Sponsor not found" }, { status: 404 });
    return json({ success: true, name: u.name, referralId: u.referralId });
  }

  if (m === "POST" && rest[0] === "register" && rest.length === 1) {
    const body = registerSchema.parse(await readJsonBody(req));
    const user = await registerUser(body);
    const { accessToken, refreshToken } = await issueTokensForUser(user);
    const base = json(
      {
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          referralId: user.referralId,
          rank: user.rank,
          role: user.role,
        },
      },
      { status: 201 },
    );
    return withSetCookies(base, buildAuthSetCookieHeaders(accessToken, refreshToken));
  }

  if (m === "POST" && rest[0] === "login" && rest.length === 1) {
    const body = z
      .object({ email: z.string().email(), password: z.string().min(1) })
      .parse(await readJsonBody(req));
    const { user, accessToken, refreshToken } = await loginUser(
      body.email,
      body.password,
    );
    const base = json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        referralId: user.referralId,
        rank: user.rank,
        role: user.role,
        activationStatus: user.activationStatus,
        kycStatus: user.kycStatus,
      },
    });
    return withSetCookies(base, buildAuthSetCookieHeaders(accessToken, refreshToken));
  }

  if (m === "POST" && rest[0] === "logout" && rest.length === 1) {
    const { userId } = requireAccessSession(req);
    const refresh = readRefreshToken(req);
    await logoutUser(userId, refresh);
    const base = json({ success: true });
    return withSetCookies(base, buildClearAuthCookieHeaders());
  }

  if (m === "POST" && rest[0] === "refresh" && rest.length === 1) {
    const refresh = readRefreshToken(req);
    if (!refresh) throw new AppError(401, "No refresh token");
    const { accessToken, refreshToken } = await refreshSession(refresh);
    const base = json({ success: true });
    return withSetCookies(base, buildAuthSetCookieHeaders(accessToken, refreshToken));
  }

  if (m === "GET" && rest[0] === "me" && rest.length === 1) {
    const { userId } = requireAccessSession(req);
    const user = await User.findById(userId).select(
      "-passwordHash -refreshTokenHashes",
    );
    if (!user) throw new AppError(404, "User not found");
    return json({ success: true, user });
  }

  return notFound();
}

// --- team ---

async function dispatchTeam(
  req: NextRequest,
  m: string,
  rest: string[],
): Promise<Response> {
  const { userId } = requireAccessSession(req);
  const uid = new mongoose.Types.ObjectId(userId);

  if (m === "GET" && rest[0] === "directs" && rest.length === 1) {
    const list = await getDirectReferrals(uid);
    return json({ success: true, data: list });
  }
  if (m === "GET" && rest[0] === "levels-summary" && rest.length === 1) {
    const data = await getLevelsSummary(uid);
    return json({ success: true, data });
  }
  if (m === "GET" && rest[0] === "level" && rest.length === 2) {
    const n = z.coerce.number().int().min(1).max(20).parse(rest[1]);
    const list = await getLevelTeam(uid, n);
    return json({ success: true, level: n, data: list });
  }
  if (m === "GET" && rest[0] === "tree" && rest.length === 1) {
    const sp = req.nextUrl.searchParams;
    const depth = z.coerce.number().int().min(1).max(6).parse(sp.get("depth") ?? 4);
    const anchor = z
      .string()
      .optional()
      .transform((s) => (s?.trim() ? s : undefined))
      .parse(sp.get("anchor") ?? undefined);
    const { tree, meta } = await getTreeForViewer(uid, depth, anchor);
    return json({ success: true, data: tree, meta });
  }

  return notFound();
}

// --- wallet ---

const transferSchema = z.object({
  from: z.enum(["package", "activation", "shopping"]),
  to: z.enum(["package", "activation", "shopping"]),
  amount: z.coerce.number().positive(),
});

async function dispatchWallet(
  req: NextRequest,
  m: string,
  rest: string[],
): Promise<Response> {
  const { userId } = requireAccessSession(req);

  if (m === "GET" && rest[0] === "balances" && rest.length === 1) {
    const user = await User.findById(userId).select("wallets");
    if (!user) return json({ success: false, error: "Not found" }, { status: 404 });
    return json({ success: true, wallets: user.wallets });
  }

  if (m === "POST" && rest[0] === "transfer" && rest.length === 1) {
    const body = transferSchema.parse(await readJsonBody(req));
    await transferBetweenWallets(
      new mongoose.Types.ObjectId(userId),
      body.from as WalletKind,
      body.to as WalletKind,
      body.amount,
    );
    const user = await User.findById(userId).select("wallets");
    return json({ success: true, wallets: user?.wallets });
  }

  if (m === "GET" && rest[0] === "ledger" && rest.length === 1) {
    const { page, limit, skip } = parsePagination(
      Object.fromEntries(req.nextUrl.searchParams) as {
        page?: string;
        limit?: string;
      },
    );
    const wallet = req.nextUrl.searchParams.get("wallet") ?? undefined;
    const filter: Record<string, unknown> = { userId };
    if (wallet && ["package", "activation", "shopping"].includes(wallet)) {
      filter.wallet = wallet;
    }
    const [items, total] = await Promise.all([
      LedgerEntry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      LedgerEntry.countDocuments(filter),
    ]);
    return json({
      success: true,
      data: items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  }

  return notFound();
}

// --- orders ---

const itemsSchema = z.array(
  z.object({
    productId: z.string().min(1),
    quantity: z.coerce.number().int().positive(),
  }),
);

async function dispatchOrders(
  req: NextRequest,
  m: string,
  rest: string[],
): Promise<Response> {
  const { userId } = requireAccessSession(req);

  if (m === "GET" && rest[0] === "export" && rest[1] === "xlsx" && rest.length === 2) {
    const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();
    const rows = orders.flatMap((o) =>
      o.items.map((it) => ({
        orderId: String(o._id),
        status: o.status,
        product: it.name,
        qty: it.quantity,
        lineTotal: it.lineTotal,
        createdAt: o.createdAt,
      })),
    );
    const sheet = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Orders");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
    return xlsxResponse(buf, "my-orders.xlsx");
  }

  if (m === "POST" && rest[0] === "preview" && rest.length === 1) {
    const body = z.object({ items: itemsSchema }).parse(await readJsonBody(req));
    const uid = new mongoose.Types.ObjectId(userId);
    const preview = await buildOrderPreview(uid, body.items);
    return json({ success: true, ...preview });
  }

  if (m === "POST" && rest.length === 0) {
    const body = z
      .object({
        items: itemsSchema,
        status: z.enum(["draft", "pending"]).optional(),
        notes: z.string().max(8000).optional(),
      })
      .parse(await readJsonBody(req));
    const uid = new mongoose.Types.ObjectId(userId);
    const order = await createOrder(uid, body.items, body.status ?? "pending");
    if (body.notes !== undefined) {
      order.notes = body.notes;
      await order.save();
    }
    return json({ success: true, order }, { status: 201 });
  }

  if (m === "GET" && rest.length === 0) {
    const { page, limit, skip } = parsePagination(
      Object.fromEntries(req.nextUrl.searchParams) as {
        page?: string;
        limit?: string;
      },
    );
    const status = req.nextUrl.searchParams.get("status") ?? undefined;
    const filter: Record<string, unknown> = { userId };
    if (status) filter.status = status;
    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);
    return json({
      success: true,
      data: orders,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  }

  if (m === "PATCH" && rest.length === 1) {
    const id = z.string().min(1).parse(rest[0]);
    const body = z
      .object({
        items: itemsSchema.optional(),
        status: z.enum(["draft", "pending", "cancelled"]).optional(),
        notes: z.string().optional(),
      })
      .parse(await readJsonBody(req));
    const order = await Order.findById(id);
    if (!order || String(order.userId) !== userId) {
      return json({ success: false, error: "Order not found" }, { status: 404 });
    }
    if (order.status !== "draft" && order.status !== "pending") {
      return json({ success: false, error: "Cannot edit this order" }, { status: 400 });
    }
    if (body.items) {
      const uid = new mongoose.Types.ObjectId(userId);
      const preview = await buildOrderPreview(uid, body.items);
      order.items = preview.lines;
      order.subtotal = preview.subtotal;
      order.totalPv = preview.totalPv;
    }
    if (body.status) order.status = body.status;
    if (body.notes !== undefined) order.notes = body.notes;
    await order.save();
    return json({ success: true, order });
  }

  if (m === "POST" && rest.length === 2 && rest[1] === "pay") {
    const id = z.string().min(1).parse(rest[0]);
    await payOrderFromShoppingWallet(id, userId);
    const order = await Order.findById(id);
    return json({ success: true, order });
  }

  return notFound();
}

// --- products (public + admin lives under /admin/products) ---

const productBody = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  price: z.coerce.number().positive(),
  packageKey: z
    .enum(["BASIC_4999", "STANDARD_9999", "PREMIUM_24999"])
    .nullable()
    .optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  stock: z.coerce.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

async function dispatchProducts(
  req: NextRequest,
  m: string,
  rest: string[],
): Promise<Response> {
  if (m === "GET" && rest[0] === "public" && rest.length === 1) {
    const list = await Product.find({ active: true }).sort({ name: 1 }).lean();
    return json({ success: true, data: list });
  }
  if (m === "GET" && rest[0] === "public" && rest.length === 2) {
    const id = z.string().min(1).parse(rest[1]);
    if (!mongoose.isValidObjectId(id)) {
      return json({ success: false, error: "Product not found" }, { status: 404 });
    }
    const p = await Product.findOne({ _id: id, active: true }).lean();
    if (!p) return json({ success: false, error: "Product not found" }, { status: 404 });
    return json({ success: true, product: p });
  }

  return notFound();
}

async function dispatchAdminProducts(
  req: NextRequest,
  m: string,
  rest: string[],
  role: string,
): Promise<Response> {
  requireAdmin(role);

  if (m === "GET" && rest.length === 0) {
    const list = await Product.find({}).sort({ name: 1 }).lean();
    return json({ success: true, data: list });
  }

  if (m === "POST" && rest.length === 0) {
    const body = productBody.parse(await readJsonBody(req));
    const p = await Product.create({
      ...body,
      description: body.description ?? "",
      stock: body.stock ?? 0,
      active: body.active ?? true,
      packageKey: body.packageKey ?? null,
    });
    return json({ success: true, product: p }, { status: 201 });
  }

  if (m === "PATCH" && rest.length === 1) {
    const id = z.string().parse(rest[0]);
    const body = productBody.partial().parse(await readJsonBody(req));
    const p = await Product.findByIdAndUpdate(id, body, { new: true });
    if (!p) return json({ success: false, error: "Not found" }, { status: 404 });
    return json({ success: true, product: p });
  }

  if (m === "DELETE" && rest.length === 1) {
    const id = z.string().parse(rest[0]);
    await Product.findByIdAndDelete(id);
    return json({ success: true });
  }

  return notFound();
}

const commissionBandRowSchema = z.object({
  t0: z.coerce.number().int().min(0).max(1_000_000_000),
  t1: z.coerce.number().int().min(0).max(1_000_000_000),
  t2: z.coerce.number().int().min(0).max(1_000_000_000),
});

async function dispatchAdmin(
  req: NextRequest,
  m: string,
  rest: string[],
): Promise<Response> {
  const ctx = requireAccessSession(req);
  requireAdmin(ctx.role);

  if (rest[0] === "products") {
    return dispatchAdminProducts(req, m, rest.slice(1), ctx.role);
  }

  if (rest[0] === "kyc") {
    const k = rest.slice(1);
    if (m === "GET" && k[0] === "pending" && k.length === 1) {
      const list = await User.find({ kycStatus: "pending" })
        .select("-passwordHash -refreshTokenHashes")
        .limit(100)
        .lean();
      return json({ success: true, data: list });
    }
    if (m === "PATCH" && k.length === 2 && k[1] === "status") {
      const userIdParam = z.string().parse(k[0]);
      const body = z
        .object({
          kycStatus: z.enum(["approved", "rejected"]),
          rejectionReason: z.string().optional(),
        })
        .parse(await readJsonBody(req));
      const update: Record<string, unknown> = { kycStatus: body.kycStatus };
      if (body.kycStatus === "rejected" && body.rejectionReason) {
        update["kyc.rejectionReason"] = body.rejectionReason;
      }
      const user = await User.findByIdAndUpdate(userIdParam, { $set: update }, {
        new: true,
      }).select("-passwordHash -refreshTokenHashes");
      return json({ success: true, user });
    }
    return notFound();
  }

  if (m === "GET" && rest[0] === "stats" && rest.length === 1) {
    const [users, paidOrders, ledgerSum] = await Promise.all([
      User.countDocuments(),
      Order.countDocuments({ status: "paid" }),
      LedgerEntry.aggregate([
        { $match: { direction: "credit" } },
        { $group: { _id: null, t: { $sum: "$amount" } } },
      ]),
    ]);
    return json({
      success: true,
      users,
      paidOrders,
      totalCredits: ledgerSum[0]?.t ?? 0,
    });
  }

  if (m === "GET" && rest[0] === "users" && rest.length === 1) {
    const { page, limit, skip } = parsePagination(
      Object.fromEntries(req.nextUrl.searchParams) as {
        page?: string;
        limit?: string;
      },
    );
    const q = req.nextUrl.searchParams.get("q")?.trim();
    const filter: Record<string, unknown> = {};
    if (q) {
      filter.$or = [
        { name: new RegExp(q, "i") },
        { email: new RegExp(q, "i") },
        { referralId: new RegExp(q, "i") },
      ];
    }
    const [data, total] = await Promise.all([
      User.find(filter)
        .select("-passwordHash -refreshTokenHashes")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);
    return json({
      success: true,
      data,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  }

  if (m === "PATCH" && rest[0] === "users" && rest.length === 2) {
    const id = z.string().parse(rest[1]);
    const body = z
      .object({
        activationStatus: z.enum(["active", "inactive"]).optional(),
        rank: z.string().optional(),
        role: z.enum(["user", "admin"]).optional(),
      })
      .parse(await readJsonBody(req));
    const user = await User.findByIdAndUpdate(id, body, { new: true }).select(
      "-passwordHash -refreshTokenHashes",
    );
    return json({ success: true, user });
  }

  if (m === "POST" && rest[0] === "users" && rest.length === 3 && rest[2] === "wallet") {
    const id = z.string().parse(rest[1]);
    const body = z
      .object({
        wallet: z.enum(["package", "activation", "shopping"]),
        amount: z.coerce.number().positive(),
        direction: z.enum(["credit", "debit"]),
        reason: z.string().optional(),
      })
      .parse(await readJsonBody(req));
    await applyWalletChange(
      new mongoose.Types.ObjectId(id),
      body.wallet as WalletKind,
      body.direction,
      body.amount,
      "adjustment",
      "admin_adjustment",
      `${Date.now()}`,
      body.reason,
    );
    const user = await User.findById(id).select("wallets");
    return json({ success: true, wallets: user?.wallets });
  }

  if (m === "GET" && rest[0] === "ledger" && rest.length === 1) {
    const { page, limit, skip } = parsePagination(
      Object.fromEntries(req.nextUrl.searchParams) as {
        page?: string;
        limit?: string;
      },
    );
    const [items, total] = await Promise.all([
      LedgerEntry.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "name email referralId")
        .lean(),
      LedgerEntry.countDocuments({}),
    ]);
    return json({
      success: true,
      data: items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  }

  if (m === "GET" && rest[0] === "commission-config" && rest.length === 1) {
    const bands = await getCommissionConfigRows();
    const labels = [
      "Level 1",
      "Level 2",
      "Levels 3–4",
      "Levels 5–10",
      "Levels 11–20",
    ] as const;
    return json({
      success: true,
      bands: bands.map((b, i) => ({
        label: labels[i],
        t0: b.t0,
        t1: b.t1,
        t2: b.t2,
      })),
      defaults: DEFAULT_COMMISSION_BAND_RUPEES.map((row, i) => ({
        label: labels[i],
        t0: row[0],
        t1: row[1],
        t2: row[2],
      })),
    });
  }

  if (m === "PATCH" && rest[0] === "commission-config" && rest.length === 1) {
    const body = z
      .object({ bands: z.array(commissionBandRowSchema).length(5) })
      .parse(await readJsonBody(req));
    await setCommissionConfigRows(body.bands);
    const bands = await getCommissionConfigRows();
    const labels = [
      "Level 1",
      "Level 2",
      "Levels 3–4",
      "Levels 5–10",
      "Levels 11–20",
    ] as const;
    return json({
      success: true,
      bands: bands.map((b, i) => ({
        label: labels[i],
        t0: b.t0,
        t1: b.t1,
        t2: b.t2,
      })),
    });
  }

  if (m === "GET" && rest[0] === "commissions" && rest.length === 1) {
    const { page, limit, skip } = parsePagination(
      Object.fromEntries(req.nextUrl.searchParams) as {
        page?: string;
        limit?: string;
      },
    );
    const [items, total] = await Promise.all([
      CommissionPayout.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("beneficiaryId", "name referralId")
        .lean(),
      CommissionPayout.countDocuments({}),
    ]);
    return json({
      success: true,
      data: items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  }

  if (m === "GET" && rest[0] === "orders" && rest[1] === "export" && rest.length === 2) {
    const orders = await Order.find({}).sort({ createdAt: -1 }).lean();
    const rows = orders.map((o) => ({
      id: String(o._id),
      userId: String(o.userId),
      status: o.status,
      subtotal: o.subtotal,
      totalPv: o.totalPv,
      createdAt: o.createdAt,
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Orders");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
    return xlsxResponse(buf, "all-orders.xlsx");
  }

  if (m === "GET" && rest[0] === "marketing" && rest[1] === "hero" && rest.length === 2) {
    const doc = await MarketingConfig.findOne({ key: MARKETING_CONFIG_KEY }).lean();
    const urls =
      doc?.heroImageUrls?.length && doc.heroImageUrls.length > 0
        ? doc.heroImageUrls
        : DEFAULT_HERO_IMAGE_URLS;
    return json({ success: true, urls });
  }

  if (m === "PATCH" && rest[0] === "marketing" && rest[1] === "hero" && rest.length === 2) {
    const body = z
      .object({
        urls: z.array(z.string().min(8).max(2000)).min(1).max(20),
      })
      .parse(await readJsonBody(req));
    for (const u of body.urls) {
      if (!/^https?:\/\//i.test(u.trim())) {
        return json(
          {
            success: false,
            error: "Each URL must start with http:// or https://",
          },
          { status: 400 },
        );
      }
    }
    const trimmed = body.urls.map((u) => u.trim());
    await MarketingConfig.findOneAndUpdate(
      { key: MARKETING_CONFIG_KEY },
      {
        $set: { heroImageUrls: trimmed },
        $setOnInsert: { key: MARKETING_CONFIG_KEY },
      },
      { upsert: true, new: true },
    );
    return json({ success: true, urls: trimmed });
  }

  return notFound();
}

// --- kyc (member) ---

async function dispatchKyc(
  req: NextRequest,
  m: string,
  rest: string[],
): Promise<Response> {
  const { userId } = requireAccessSession(req);

  if (m === "PATCH" && rest[0] === "profile" && rest.length === 1) {
    const body = z
      .object({ pan: z.string().optional(), aadhar: z.string().optional() })
      .parse(await readJsonBody(req));
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          "kyc.pan": body.pan,
          "kyc.aadhar": body.aadhar,
          kycStatus: "pending",
        },
      },
      { new: true },
    ).select("-passwordHash -refreshTokenHashes");
    return json({ success: true, user });
  }

  if (m === "POST" && rest[0] === "documents" && rest.length === 1) {
    fs.mkdirSync(env.uploadDir, { recursive: true });
    const formData = await req.formData();
    const files = formData
      .getAll("files")
      .filter((f): f is File => f instanceof File);
    if (!files.length) {
      return json({ success: false, error: "No files" }, { status: 400 });
    }
    const urls: string[] = [];
    for (const file of files) {
      if (file.size > MAX_UPLOAD_BYTES) {
        throw new AppError(400, "File too large (max 5MB)");
      }
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filename = `${Date.now()}_${safe}`;
      const buf = Buffer.from(await file.arrayBuffer());
      await fs.promises.writeFile(`${env.uploadDir}/${filename}`, buf);
      urls.push(`/uploads/${filename}`);
    }
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $push: { "kyc.documentUrls": { $each: urls } },
        $set: { kycStatus: "pending" },
      },
      { new: true },
    ).select("-passwordHash -refreshTokenHashes");
    return json({ success: true, user });
  }

  return notFound();
}

// --- dashboard ---

async function dispatchDashboard(
  req: NextRequest,
  m: string,
  rest: string[],
): Promise<Response> {
  const { userId } = requireAccessSession(req);
  if (m !== "GET" || rest[0] !== "summary" || rest.length !== 1) return notFound();

  const uid = new mongoose.Types.ObjectId(userId);
  const user = await User.findById(userId).select(
    "-passwordHash -refreshTokenHashes",
  );
  if (!user) return json({ success: false }, { status: 404 });

  const [teamCount, orderAgg, credits] = await Promise.all([
    countTotalDownline(uid),
    Order.aggregate([
      { $match: { userId: uid, status: "paid" } },
      { $group: { _id: null, totalPv: { $sum: "$totalPv" } } },
    ]),
    LedgerEntry.aggregate([
      { $match: { userId: uid, direction: "credit" } },
      { $group: { _id: "$incomeKind", total: { $sum: "$amount" } } },
    ]),
  ]);

  const incomeMap = Object.fromEntries(credits.map((c) => [c._id, c.total]));

  return json({
    success: true,
    user,
    team: { totalCount: teamCount },
    business: { totalPv: orderAgg[0]?.totalPv ?? 0 },
    income: {
      total: credits.reduce((s, c) => s + c.total, 0),
      level: incomeMap.level ?? 0,
      lbd: incomeMap.lbd ?? 0,
      reward: incomeMap.reward ?? 0,
    },
    wallets: user.wallets,
  });
}

// --- income ---

async function dispatchIncome(
  req: NextRequest,
  m: string,
  rest: string[],
): Promise<Response> {
  const { userId } = requireAccessSession(req);

  if (m === "GET" && rest.length === 0) {
    const { page, limit, skip } = parsePagination(
      Object.fromEntries(req.nextUrl.searchParams) as {
        page?: string;
        limit?: string;
      },
    );
    const incomeKind = z
      .enum(["level", "lbd", "reward", "transfer", "purchase", "adjustment"])
      .optional()
      .safeParse(req.nextUrl.searchParams.get("incomeKind") ?? undefined);
    const filter: Record<string, unknown> = {
      userId,
      direction: "credit",
    };
    if (incomeKind.success && incomeKind.data) {
      filter.incomeKind = incomeKind.data;
    }
    const [items, total] = await Promise.all([
      LedgerEntry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      LedgerEntry.countDocuments(filter),
    ]);
    return json({
      success: true,
      data: items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  }

  if (m === "GET" && rest[0] === "by-level" && rest.length === 1) {
    const entries = await LedgerEntry.find({
      userId,
      incomeKind: "level",
      direction: "credit",
    })
      .sort({ createdAt: -1 })
      .lean();
    const byLevel: Record<string, number> = {};
    for (const e of entries) {
      const lv = String((e.meta as { level?: number })?.level ?? "?");
      byLevel[lv] = (byLevel[lv] ?? 0) + e.amount;
    }
    return json({ success: true, aggregates: byLevel, entries });
  }

  return notFound();
}

// --- users (member profile) ---

async function dispatchUsers(
  req: NextRequest,
  m: string,
  rest: string[],
): Promise<Response> {
  const { userId } = requireAccessSession(req);
  if (m === "PATCH" && rest[0] === "me" && rest.length === 1) {
    const body = z
      .object({
        name: z.string().min(2).optional(),
        phone: z.string().min(8).optional(),
      })
      .parse(await readJsonBody(req));
    const user = await User.findByIdAndUpdate(userId, body, { new: true }).select(
      "-passwordHash -refreshTokenHashes",
    );
    return json({ success: true, user });
  }
  return notFound();
}

// --- marketing public ---

async function dispatchMarketing(
  _req: NextRequest,
  m: string,
  rest: string[],
): Promise<Response> {
  if (m === "GET" && rest[0] === "hero" && rest.length === 1) {
    let doc = await MarketingConfig.findOne({ key: MARKETING_CONFIG_KEY });
    if (!doc) {
      doc = await MarketingConfig.create({
        key: MARKETING_CONFIG_KEY,
        heroImageUrls: [...DEFAULT_HERO_IMAGE_URLS],
      });
    }
    const urls =
      doc.heroImageUrls?.length > 0 ? doc.heroImageUrls : DEFAULT_HERO_IMAGE_URLS;
    return json({ success: true, urls });
  }
  return notFound();
}

export async function routeV1(req: NextRequest, method: string): Promise<Response> {
  const segs = segmentsAfterV1(req.nextUrl);
  const m = method.toUpperCase();

  if (segs.length === 0) return notFound();

  const root = segs[0];
  const rest = segs.slice(1);

  switch (root) {
    case "auth":
      return dispatchAuth(req, m, rest);
    case "team":
      return dispatchTeam(req, m, rest);
    case "wallet":
      return dispatchWallet(req, m, rest);
    case "orders":
      return dispatchOrders(req, m, rest);
    case "products":
      return dispatchProducts(req, m, rest);
    case "admin":
      return dispatchAdmin(req, m, rest);
    case "kyc":
      return dispatchKyc(req, m, rest);
    case "dashboard":
      return dispatchDashboard(req, m, rest);
    case "income":
      return dispatchIncome(req, m, rest);
    case "users":
      return dispatchUsers(req, m, rest);
    case "marketing":
      return dispatchMarketing(req, m, rest);
    default:
      return notFound();
  }
}
