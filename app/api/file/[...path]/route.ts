import "@/server/config/env";
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { env } from "@/server/config/env";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await ctx.params;
  const safe = (segments ?? []).join("/").replace(/\.\./g, "");
  if (!safe) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const dir = path.resolve(env.uploadDir);
  const filePath = path.join(dir, safe);
  if (!filePath.startsWith(dir)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const buf = await fs.promises.readFile(filePath);
    const ext = path.extname(safe).toLowerCase();
    const type =
      ext === ".pdf"
        ? "application/pdf"
        : ext === ".png"
          ? "image/png"
          : ext === ".jpg" || ext === ".jpeg"
            ? "image/jpeg"
            : ext === ".webp"
              ? "image/webp"
              : "application/octet-stream";
    return new NextResponse(buf, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
