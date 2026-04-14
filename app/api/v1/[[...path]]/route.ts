/**
 * Fallback for `/api/v1/*` when the first segment is not a dedicated route folder.
 * Resource handlers live under `app/api/v1/<segment>/[[...path]]/route.ts`.
 */
export * from "@/server/next-api/v1/handle-request";
