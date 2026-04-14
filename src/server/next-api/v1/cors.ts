import { env } from "@/server/config/env";

export function corsPreflightResponse(): Response {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", env.clientOrigin);
  headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD",
  );
  headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Cookie",
  );
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Max-Age", "86400");
  return new Response(null, { status: 204, headers });
}

export function withCors(res: Response): Response {
  const headers = new Headers(res.headers);
  headers.set("Access-Control-Allow-Origin", env.clientOrigin);
  headers.set("Access-Control-Allow-Credentials", "true");
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}
