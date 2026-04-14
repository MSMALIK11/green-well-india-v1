import type { NextRequest } from "next/server";

export async function readJsonBody<T = unknown>(req: NextRequest): Promise<T> {
  const text = await req.text();
  if (!text.trim()) return {} as T;
  return JSON.parse(text) as T;
}
