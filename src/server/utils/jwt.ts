import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env";

export type AccessPayload = { sub: string; role: "user" | "admin" };

export function signAccessToken(payload: AccessPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtAccessExpires,
  } as jwt.SignOptions);
}

export function signRefreshToken(payload: AccessPayload): string {
  return jwt.sign(
    { sub: payload.sub, role: payload.role, typ: "refresh" },
    env.jwtSecret,
    {
      expiresIn: env.jwtRefreshExpires,
    } as jwt.SignOptions,
  );
}

export function verifyToken(token: string): AccessPayload & { typ?: string } {
  return jwt.verify(token, env.jwtSecret) as AccessPayload & { typ?: string };
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
