import mongoose from "mongoose";
import { Order } from "../models/Order";
import { User } from "../models/User";
import { AppError } from "../utils/errors";

export async function getDirectReferrals(
  userId: mongoose.Types.ObjectId,
): Promise<Record<string, unknown>[]> {
  return User.find({ sponsorId: userId })
    .select("-passwordHash -refreshTokenHashes")
    .lean();
}

export async function getLevelTeam(
  userId: mongoose.Types.ObjectId,
  level: number,
): Promise<Record<string, unknown>[]> {
  if (level < 1 || level > 20) {
    throw new AppError(400, "Level must be 1–20");
  }
  if (level === 1) {
    return User.find({ sponsorId: userId })
      .select("-passwordHash -refreshTokenHashes")
      .lean();
  }
  const field = `ancestorChain.${level - 1}` as const;
  return User.find({ [field]: userId })
    .select("-passwordHash -refreshTokenHashes")
    .lean();
}

export type TreeNode = {
  id: string;
  referralId: string;
  name: string;
  rank: string;
  activationStatus: string;
  /** Sum of totalPv on paid orders for this member */
  pv: number;
  /** Sum of order subtotals (paid) — shown as BV on genealogy */
  bv: number;
  children: TreeNode[];
};

export type TreeResponseMeta = {
  rootReferralId: string;
  parentReferralId: string | null;
  viewerReferralId: string;
};

const MAX_CHILDREN_PER_NODE = 50;

function isTargetInDownlineOfViewer(
  viewerId: mongoose.Types.ObjectId,
  target: {
    sponsorId?: mongoose.Types.ObjectId | null;
    ancestorChain?: mongoose.Types.ObjectId[];
  },
): boolean {
  if (target.sponsorId && String(target.sponsorId) === String(viewerId)) {
    return true;
  }
  const chain = target.ancestorChain ?? [];
  return chain.some((id) => String(id) === String(viewerId));
}

async function viewerIsInDownlineOfRoot(
  viewerId: mongoose.Types.ObjectId,
  rootId: mongoose.Types.ObjectId,
): Promise<boolean> {
  const viewer = await User.findById(viewerId)
    .select("sponsorId ancestorChain")
    .lean();
  if (!viewer) return false;
  if (viewer.sponsorId && String(viewer.sponsorId) === String(rootId)) {
    return true;
  }
  return (viewer.ancestorChain ?? []).some((id) => String(id) === String(rootId));
}

async function assertCanViewTreeRoot(
  viewerId: mongoose.Types.ObjectId,
  rootId: mongoose.Types.ObjectId,
): Promise<void> {
  if (String(rootId) === String(viewerId)) return;

  const root = await User.findById(rootId)
    .select("sponsorId ancestorChain")
    .lean();
  if (!root) throw new AppError(404, "Member not found");

  if (isTargetInDownlineOfViewer(viewerId, root)) return;

  const underRoot = await viewerIsInDownlineOfRoot(viewerId, rootId);
  if (underRoot) return;

  throw new AppError(403, "Not allowed to view this member");
}

async function buildTree(
  uid: mongoose.Types.ObjectId,
  d: number,
): Promise<TreeNode> {
  const u = await User.findById(uid).select(
    "referralId name rank activationStatus",
  );
  if (!u) throw new AppError(404, "User not found");
  const node: TreeNode = {
    id: String(u._id),
    referralId: u.referralId,
    name: u.name,
    rank: u.rank,
    activationStatus: u.activationStatus,
    pv: 0,
    bv: 0,
    children: [],
  };
  if (d <= 0) return node;
  const childDocs = await User.find({ sponsorId: uid })
    .limit(MAX_CHILDREN_PER_NODE)
    .select("_id binaryPlacement createdAt")
    .lean();
  childDocs.sort((a, b) => {
    const rank = (p: string | null | undefined) =>
      p === "left" ? 0 : p === "right" ? 1 : 2;
    const cmp = rank(a.binaryPlacement) - rank(b.binaryPlacement);
    if (cmp !== 0) return cmp;
    return (
      new Date(a.createdAt ?? 0).getTime() -
      new Date(b.createdAt ?? 0).getTime()
    );
  });
  for (const c of childDocs) {
    node.children.push(
      await buildTree(c._id as mongoose.Types.ObjectId, d - 1),
    );
  }
  return node;
}

function collectTreeUserIds(node: TreeNode): mongoose.Types.ObjectId[] {
  const ids = [new mongoose.Types.ObjectId(node.id)];
  for (const c of node.children) {
    ids.push(...collectTreeUserIds(c));
  }
  return ids;
}

async function enrichTreeOrderVolumes(root: TreeNode): Promise<void> {
  const raw = collectTreeUserIds(root);
  const seen = new Set<string>();
  const unique: mongoose.Types.ObjectId[] = [];
  for (const id of raw) {
    const s = String(id);
    if (seen.has(s)) continue;
    seen.add(s);
    unique.push(id);
  }
  if (unique.length === 0) return;

  const agg = await Order.aggregate<{
    _id: mongoose.Types.ObjectId;
    pv: number;
    bv: number;
  }>([
    { $match: { userId: { $in: unique }, status: "paid" } },
    {
      $group: {
        _id: "$userId",
        pv: { $sum: "$totalPv" },
        bv: { $sum: "$subtotal" },
      },
    },
  ]);

  const vol = new Map(
    agg.map((r) => [String(r._id), { pv: r.pv ?? 0, bv: r.bv ?? 0 }]),
  );

  function walk(n: TreeNode) {
    const v = vol.get(n.id) ?? { pv: 0, bv: 0 };
    n.pv = v.pv;
    n.bv = v.bv;
    for (const c of n.children) walk(c);
  }
  walk(root);
}

export async function getTreeForViewer(
  viewerId: mongoose.Types.ObjectId,
  depth: number,
  anchorReferralId?: string,
): Promise<{ tree: TreeNode; meta: TreeResponseMeta }> {
  const me = await User.findById(viewerId).select("referralId").lean();
  if (!me) throw new AppError(404, "User not found");

  let rootId = viewerId;

  if (anchorReferralId?.trim()) {
    const norm = anchorReferralId.trim().toUpperCase();
    if (norm !== me.referralId.toUpperCase()) {
      const anchor = await User.findOne({ referralId: norm })
        .select("_id sponsorId ancestorChain referralId")
        .lean();
      if (!anchor?._id) throw new AppError(404, "Member not found");
      await assertCanViewTreeRoot(
        viewerId,
        anchor._id as mongoose.Types.ObjectId,
      );
      rootId = anchor._id as mongoose.Types.ObjectId;
    }
  }

  const tree = await buildTree(rootId, depth);
  await enrichTreeOrderVolumes(tree);

  const rootDoc = await User.findById(rootId).select("referralId sponsorId").lean();
  if (!rootDoc) throw new AppError(404, "User not found");

  let parentReferralId: string | null = null;
  if (rootDoc.sponsorId) {
    const p = await User.findById(rootDoc.sponsorId).select("referralId").lean();
    parentReferralId = p?.referralId ?? null;
  }

  return {
    tree,
    meta: {
      rootReferralId: rootDoc.referralId,
      parentReferralId,
      viewerReferralId: me.referralId,
    },
  };
}

/** @deprecated Prefer getTreeForViewer — kept for internal callers */
export async function getTreeRoot(
  userId: mongoose.Types.ObjectId,
  depth: number,
): Promise<TreeNode> {
  const { tree } = await getTreeForViewer(userId, depth, undefined);
  return tree;
}

export async function getLevelsSummary(
  userId: mongoose.Types.ObjectId,
): Promise<{ level: number; count: number; business: number }[]> {
  const levels = Array.from({ length: 20 }, (_, i) => i + 1);
  return Promise.all(
    levels.map(async (level) => {
      const members = await getLevelTeam(userId, level);
      const ids = members.map((m) => m._id as mongoose.Types.ObjectId);
      if (ids.length === 0) {
        return { level, count: 0, business: 0 };
      }
      const agg = await Order.aggregate<{ total: number }>([
        { $match: { userId: { $in: ids }, status: "paid" } },
        { $group: { _id: null, total: { $sum: "$subtotal" } } },
      ]);
      return {
        level,
        count: members.length,
        business: agg[0]?.total ?? 0,
      };
    }),
  );
}

export async function countTotalDownline(
  userId: mongoose.Types.ObjectId,
): Promise<number> {
  return User.countDocuments({
    $or: [{ sponsorId: userId }, { ancestorChain: userId }],
  });
}
