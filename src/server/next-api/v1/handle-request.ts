import "@/server/config/env";
import type { NextRequest } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import { corsPreflightResponse, withCors } from "@/server/next-api/v1/cors";
import { routeV1 } from "@/server/next-api/v1/dispatch";
import { errorToResponse } from "@/server/next-api/v1/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

async function handle(req: NextRequest): Promise<Response> {
  await connectMongo();
  const method = req.method.toUpperCase();
  if (method === "OPTIONS") return corsPreflightResponse();

  const effectiveMethod = method === "HEAD" ? "GET" : method;
  try {
    const res = await routeV1(req, effectiveMethod);
    const out = withCors(res);
    if (method === "HEAD") {
      return new Response(null, { status: out.status, headers: out.headers });
    }
    return out;
  } catch (e) {
    return withCors(errorToResponse(e));
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
export const HEAD = handle;
