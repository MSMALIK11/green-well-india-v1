import "@/server/config/env";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongo } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

/** Verifies MongoDB is reachable (uses same URI as the API). */
export async function GET() {
  try {
    await connectMongo();
    if (mongoose.connection.readyState !== 1) {
      return NextResponse.json(
        { ok: false, error: "Mongoose not connected" },
        { status: 503 },
      );
    }
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json(
        { ok: false, error: "No default DB" },
        { status: 503 },
      );
    }
    await db.admin().command({ ping: 1 });
    return NextResponse.json({ ok: true, db: "up" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}
