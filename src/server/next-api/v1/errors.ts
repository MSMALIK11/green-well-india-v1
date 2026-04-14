import { ZodError } from "zod";
import { AppError } from "@/server/utils/errors";
import { logger } from "@/server/utils/logger";

function isMongoAuthError(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  const code = (e as { code?: number }).code;
  if (code === 18) return true;
  return /bad auth|authentication failed/i.test(e.message);
}

function isMongoConnectionError(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  const { name, message } = e;
  if (
    name === "MongooseServerSelectionError" ||
    name === "MongoServerSelectionError" ||
    name === "MongoNetworkError" ||
    name === "MongoParseError"
  ) {
    return true;
  }
  return /ECONNREFUSED|ENOTFOUND|querySrv E|MongoNetworkError/i.test(message);
}

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
  if (isMongoAuthError(e)) {
    logger.error("MongoDB authentication error", e);
    const dev =
      process.env.NODE_ENV !== "production"
        ? "MongoDB login failed. In .env.local, set MONGODB_URI with the correct Atlas database user and password (replace any placeholder like YOUR_PASSWORD). URL-encode special characters in the password (e.g. @ → %40). In Atlas: Database Access → confirm user exists and password; Edit password if unsure. Restart npm run dev after saving."
        : null;
    return Response.json(
      {
        success: false,
        error:
          dev ??
          "Database authentication failed. Service configuration must be updated.",
      },
      { status: 503 },
    );
  }
  if (isMongoConnectionError(e)) {
    logger.error("MongoDB connection error", e);
    const dev =
      process.env.NODE_ENV !== "production"
        ? "Cannot connect to MongoDB. Start MongoDB locally (port 27017) or set MONGODB_URI in .env.local to a reachable URI (e.g. MongoDB Atlas), then restart the dev server."
        : null;
    return Response.json(
      {
        success: false,
        error:
          dev ??
          "Database is temporarily unavailable. Please try again in a moment.",
      },
      { status: 503 },
    );
  }
  logger.error("Unhandled API error", e);
  return Response.json({ success: false, error: "Internal server error" }, { status: 500 });
}
