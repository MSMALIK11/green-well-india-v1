import { env } from "@/server/config/env";

const isProd = env.nodeEnv === "production";

/** Multiple Set-Cookie header values */
export function buildAuthSetCookieHeaders(
  accessToken: string,
  refreshToken: string,
): string[] {
  const secure = isProd ? "; Secure" : "";
  return [
    `access_token=${encodeURIComponent(accessToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${15 * 60}${secure}`,
    `refresh_token=${encodeURIComponent(refreshToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${secure}`,
  ];
}

export function buildClearAuthCookieHeaders(): string[] {
  return [
    "access_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
    "refresh_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
  ];
}

export function withSetCookies(
  res: Response,
  cookieHeaderValues: string[],
): Response {
  const headers = new Headers(res.headers);
  for (const c of cookieHeaderValues) headers.append("Set-Cookie", c);
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}
