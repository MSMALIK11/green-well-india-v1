import type { NextRequest } from "next/server";
import { AppError } from "@/server/utils/errors";
import { verifyToken } from "@/server/utils/jwt";

export function readAccessToken(req: NextRequest): string | undefined {
  const c = req.cookies.get("access_token")?.value;
  if (c) return c;
  const h = req.headers.get("authorization");
  if (h?.startsWith("Bearer ")) return h.slice(7);
  return undefined;
}

export function readRefreshToken(req: NextRequest): string | undefined {
  return req.cookies.get("refresh_token")?.value;
}

export function requireAccessSession(req: NextRequest): {
  userId: string;
  role: "user" | "admin";
} {
  const token = readAccessToken(req);
  if (!token) throw new AppError(401, "Not authenticated");
  try {
    const payload = verifyToken(token);
    if (payload.typ === "refresh") throw new AppError(401, "Invalid token type");
    return { userId: payload.sub, role: payload.role as "user" | "admin" };
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new AppError(401, "Not authenticated");
  }
}

export function requireAdmin(role: string): void {
  if (role !== "admin") throw new AppError(403, "Admin only");
}
