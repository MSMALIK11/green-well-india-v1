import mongoose from "mongoose";
import { env } from "@/server/config/env";

declare global {
  var __mlm_mongoose_conn: Promise<typeof mongoose> | undefined;
}

export async function connectMongo(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }
  if (!global.__mlm_mongoose_conn) {
    global.__mlm_mongoose_conn = mongoose
      .connect(env.mongoUri)
      .then(() => mongoose)
      .catch((err) => {
        global.__mlm_mongoose_conn = undefined;
        throw err;
      });
  }
  return global.__mlm_mongoose_conn;
}
