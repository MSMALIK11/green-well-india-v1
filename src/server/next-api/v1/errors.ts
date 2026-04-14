import { ZodError } from "zod";
import { AppError } from "@/server/utils/errors";
import { logger } from "@/server/utils/logger";

export function errorToResponse(e: unknown): Response {
  if (e instanceof ZodError) {
    return Response.json(
      { success: false, error: "Validation failed", details: e.flatten() },
      { status: 400 },
    );
  }
  if (e instanceof AppError) {
    return Response.json(
      { success: false, error: e.message, code: e.code },
      { status: e.statusCode },
    );
  }
  logger.error("Unhandled API error", e);
  return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
}
