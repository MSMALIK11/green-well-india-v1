import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User, type IUser } from "../models/User";
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyToken,
  type AccessPayload,
} from "../utils/jwt";
import { AppError, assertApp } from "../utils/errors";

const SALT_ROUNDS = 12;
const MAX_REFRESH = 10;

/** New members get a 5-digit numeric ID (also used as sponsor / referral code). */
async function allocateMemberReferralId(): Promise<string> {
  for (let i = 0; i < 100; i++) {
    const n = Math.floor(10000 + Math.random() * 90000);
    const referralId = String(n);
    const clash = await User.findOne({ referralId });
    if (!clash) return referralId;
  }
  throw new AppError(500, "Could not allocate user ID");
}

const FOUNDER_REFERRAL = "ROOT000001";

export async function registerUser(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
  sponsorReferralId?: string;
  binaryPlacement?: "left" | "right";
}): Promise<IUser> {
  const exists = await User.findOne({
    $or: [{ email: input.email.toLowerCase() }, { phone: input.phone }],
  });
  assertApp(!exists, 409, "Email or phone already registered");

  const userCount = await User.countDocuments();
  let sponsorCode = (input.sponsorReferralId ?? "").trim().toUpperCase();

  let sponsor: IUser | null = null;
  let ancestorChain: mongoose.Types.ObjectId[] = [];
  let sponsorId: mongoose.Types.ObjectId | null = null;
  let referralId: string;
  let rank = "Member";
  let role: "user" | "admin" = "user";
  let activationStatus: "active" | "inactive" = "inactive";
  let kycStatus: "pending" | "approved" | "rejected" = "pending";

  if (userCount === 0) {
    /** First account in DB — platform founder (no sponsor in tree yet) */
    referralId = FOUNDER_REFERRAL;
    rank = "Founder";
    role = "admin";
    activationStatus = "active";
    kycStatus = "approved";
  } else {
    if (sponsorCode.length < 2) {
      sponsorCode = FOUNDER_REFERRAL;
    }
    sponsor = await User.findOne({ referralId: sponsorCode });
    assertApp(
      sponsor,
      400,
      `No user found with referral ID "${sponsorCode}". Ask your sponsor for their ID, or run \`npm run seed\` from the frontend app folder to create demo root ${FOUNDER_REFERRAL}.`,
    );
    sponsorId = sponsor._id as mongoose.Types.ObjectId;
    const sponsorAncestors = sponsor.ancestorChain.map(
      (id) => id as mongoose.Types.ObjectId,
    );
    ancestorChain = [sponsorId, ...sponsorAncestors].slice(0, 20);

    referralId = await allocateMemberReferralId();

    const placement = input.binaryPlacement ?? null;
    if (placement) {
      const taken = await User.exists({
        sponsorId,
        binaryPlacement: placement,
      });
      assertApp(
        !taken,
        400,
        `This sponsor already has a member on the ${placement} side.`,
      );
    }
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await User.create({
    name: input.name.trim(),
    email: input.email.toLowerCase().trim(),
    phone: input.phone.trim(),
    passwordHash,
    referralId,
    sponsorId,
    ancestorChain,
    rank,
    packageKey: null,
    activationStatus,
    kycStatus,
    kyc: { documentUrls: [] },
    wallets: { package: 0, activation: 0, shopping: 0 },
    role,
    refreshTokenHashes: [],
    ...(userCount > 0 &&
    (input.binaryPlacement === "left" || input.binaryPlacement === "right")
      ? { binaryPlacement: input.binaryPlacement }
      : {}),
  });

  return user;
}

export async function loginUser(
  userId: string,
  password: string,
): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
  const normalized = userId.trim().toUpperCase();
  assertApp(normalized.length > 0, 401, "Invalid credentials");
  const user = await User.findOne({ referralId: normalized });
  assertApp(user, 401, "Invalid credentials");
  const ok = await bcrypt.compare(password, user.passwordHash);
  assertApp(ok, 401, "Invalid credentials");

  const payload: AccessPayload = {
    sub: String(user._id),
    role: user.role as "user" | "admin",
  };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const h = hashToken(refreshToken);
  user.refreshTokenHashes.push(h);
  if (user.refreshTokenHashes.length > MAX_REFRESH) {
    user.refreshTokenHashes = user.refreshTokenHashes.slice(-MAX_REFRESH);
  }
  await user.save();
  return { user, accessToken, refreshToken };
}

export async function issueTokensForUser(user: IUser): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const payload: AccessPayload = {
    sub: String(user._id),
    role: user.role as "user" | "admin",
  };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const h = hashToken(refreshToken);
  user.refreshTokenHashes.push(h);
  if (user.refreshTokenHashes.length > MAX_REFRESH) {
    user.refreshTokenHashes = user.refreshTokenHashes.slice(-MAX_REFRESH);
  }
  await user.save();
  return { accessToken, refreshToken };
}

export async function logoutUser(
  userId: string,
  refreshToken?: string,
): Promise<void> {
  if (!refreshToken) return;
  let payload: AccessPayload & { typ?: string };
  try {
    payload = verifyToken(refreshToken);
  } catch {
    return;
  }
  if (payload.typ !== "refresh") return;
  const h = hashToken(refreshToken);
  await User.findByIdAndUpdate(userId, {
    $pull: { refreshTokenHashes: h },
  });
}

export async function refreshSession(
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  let payload: AccessPayload & { typ?: string };
  try {
    payload = verifyToken(refreshToken);
  } catch {
    throw new AppError(401, "Invalid refresh token");
  }
  if (payload.typ !== "refresh") throw new AppError(401, "Invalid refresh token");

  const user = await User.findById(payload.sub);
  assertApp(user, 401, "User not found");
  const h = hashToken(refreshToken);
  assertApp(
    user.refreshTokenHashes.includes(h),
    401,
    "Refresh token revoked",
  );

  const nextPayload: AccessPayload = {
    sub: String(user._id),
    role: user.role as "user" | "admin",
  };
  const accessToken = signAccessToken(nextPayload);
  const newRefresh = signRefreshToken(nextPayload);
  const newH = hashToken(newRefresh);

  user.refreshTokenHashes = user.refreshTokenHashes.filter((x) => x !== h);
  user.refreshTokenHashes.push(newH);
  await user.save();

  return { accessToken, refreshToken: newRefresh };
}
